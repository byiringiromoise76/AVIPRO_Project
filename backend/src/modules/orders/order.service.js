/**
 * src/modules/orders/order.service.js
 * 
 * Business logic for order lifecycle:
 *   1. logOrder — create a new order (guest checkout or staff)
 *   2. Transition helpers — approve → process → deliver, each with status validation
 * 
 * Every transition runs in a DATABASE TRANSACTION, gets a row lock (FOR UPDATE),
 * and writes to order_status_history for a full audit trail.
 * 
 * NOTE: Timestamps on the orders table are:
 *   approved_at, processing_started_at, processing_completed_at,
 *   ready_for_delivery_at, delivered_at
 * (There is NO processed_at column.)
 */
import * as orderRepository from "./order.repository.js";
import { pool } from "../../database/pool.js";

/**
 * Get all orders with optional filters.
 * 
 * Example: api/orders?status=PENDING&startDate=2026-01-01&limit=50
 * 
 * @param {Object} filters - { status, startDate, endDate, limit }
 * @returns {Promise<Array>} Orders
 */
export async function getAllOrders(filters = {}) {
    return await orderRepository.findAll(filters);
}

// All orders go through the main branch for centralized processing
const MAIN_BRANCH_ID = 1;

/**
 * Create/log a new order. Supports guest customers (no auth) and staff.
 * Runs in a transaction: customer, order, items, and total all commit together.
 * 
 * HTTP POST /api/orders
 * 
 * Example body:
 *   {
 *     "customer": { "fullName": "Jane", "phone": "0712345678", "address": "123 St" },
 *     "items": [{ "productId": 1, "quantity": 2, "unitPrice": 50 }]
 *   }
 * 
 * @param {Object} options - { actor, customer, items }
 * @returns {Promise<Object>} Created order with details
 */
export async function logOrder({ actor, customer, items }) {
    const connection = await pool.getConnection();

    try {
        // Start transaction so all-or-nothing: either everything succeeds or rolls back
        await connection.beginTransaction();

        // Find or create the customer by phone (reuses existing customers)
        const customerId = await orderRepository.findOrCreateCustomer(connection, {
            fullName: customer.fullName,
            phone: customer.phone,
            address: customer.address,
            businessName: customer.businessName,
            branchId: MAIN_BRANCH_ID
        });

        // Generate a unique order code: ORD-<timestamp>-<random>
        const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const orderId = await orderRepository.createOrder(connection, {
            branchId: MAIN_BRANCH_ID,
            customerId,
            loggedBy: actor?.userId || null,
            salespersonId: actor?.userId || null,
            orderCode
        });

        await orderRepository.addOrderItems(connection, orderId, items);
        await orderRepository.recalculateTotal(connection, orderId);

        await connection.commit();
        return await orderRepository.findByIdWithDetails(orderId);
    } catch (error) {
        await connection.rollback(); // Undo any partial changes
        throw error;
    } finally {
        connection.release(); // Always return connection to pool
    }
}

/**
 * Core status-transition engine used by all order state changes.
 * Validates the current status, updates it, and records history.
 * 
 * @param {Object} options
 * @param {number} options.orderId - Order to transition
 * @param {Object} options.actor - { userId, branchId, role } of the user
 * @param {string} [options.comment] - Optional note
 * @param {string} options.fromStatus - Required current status
 * @param {string} options.toStatus - New status
 * @param {Object} [options.extraFields] - { column: value } extras (timestamps)
 * @param {Function} [options.afterUpdate] - Callback(connection) to run post-update
 * @returns {Promise<Object>} Transition summary
 */
async function transitionOrder({ orderId, actor, comment, fromStatus, toStatus, extraFields = {}, afterUpdate }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Row-level lock prevents two users from updating the same order at once
        const order = await orderRepository.findByIdForUpdate(connection, orderId);
        if (!order) {
            const error = new Error("Order not found");
            error.status = 404;
            throw error;
        }

        // Business rule: order must be in the expected state before moving forward
        if (order.status !== fromStatus) {
            const error = new Error(`Order must be in ${fromStatus} status to transition to ${toStatus}`);
            error.status = 400;
            throw error;
        }

        await orderRepository.setStatus(connection, orderId, toStatus, extraFields);
        await orderRepository.createStatusHistory(connection, orderId, actor.userId, fromStatus, toStatus, comment);

        if (afterUpdate) {
            await afterUpdate(connection);
        }

        await connection.commit();

        return { orderId, fromStatus, toStatus, updatedBy: actor.userId, comment };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Approve a PENDING order → APPROVED.
 * Also creates a processing record. Admin/Customer Service only.
 * 
 * HTTP PATCH /api/orders/:id/approve
 */
export async function approveOrder({ orderId, actor, comment }) {
    return transitionOrder({
        orderId,
        actor,
        comment,
        fromStatus: "PENDING",
        toStatus: "APPROVED",
        extraFields: { approved_at: new Date(), customer_service_id: actor.userId },
        afterUpdate: async (connection) => {
            // Create processing record for the approved order
            await connection.execute(
                "INSERT INTO processing (order_id, status) VALUES (?, 'PENDING')",
                [orderId]
            );
        }
    });
}

/**
 * Start processing an APPROVED order → PROCESSING.
 * Processing manager begins work. Admin/Processing only.
 * 
 * HTTP PATCH /api/orders/:id/start-processing
 */
export async function startProcessing({ orderId, actor, comment }) {
    return transitionOrder({
        orderId,
        actor,
        comment,
        fromStatus: "APPROVED",
        toStatus: "PROCESSING",
        extraFields: { processing_started_at: new Date() },
        afterUpdate: async (connection) => {
            await connection.execute(
                `UPDATE processing SET status = 'IN_PROGRESS', assigned_to = ?, started_at = UTC_TIMESTAMP(3) WHERE order_id = ?`,
                [actor.userId, orderId]
            );
        }
    });
}

/**
 * Complete processing → PROCESSING_COMPLETED.
 * Notifies all active customer-service staff the order is ready to prepare for delivery.
 * 
 * HTTP PATCH /api/orders/:id/complete-processing
 */
export async function completeProcessing({ orderId, actor, comment }) {
    return transitionOrder({
        orderId,
        actor,
        comment,
        fromStatus: "PROCESSING",
        toStatus: "PROCESSING_COMPLETED",
        extraFields: { processing_completed_at: new Date() },
        afterUpdate: async (connection) => {
            await connection.execute(
                "UPDATE processing SET status = 'COMPLETED', completed_at = UTC_TIMESTAMP(3) WHERE order_id = ?",
                [orderId]
            );
            // Notify all active customer service staff
            await connection.execute(
                `INSERT INTO notifications (order_id, user_id, title, message, type)
                 SELECT ?, id, 'Processing complete', CONCAT('Order ', ?, ' is ready to prepare for delivery.'), 'ORDER_HANDOFF'
                 FROM users WHERE role = 'CUSTOMER_SERVICE' AND is_active = TRUE`,
                [orderId, orderId]
            );
        }
    });
}

/**
 * Mark order as READY_FOR_DELIVERY (customer service prepared the hand-off).
 * 
 * HTTP PATCH /api/orders/:id/ready-for-delivery
 */
export async function markReadyForDelivery({ orderId, actor, comment }) {
    return transitionOrder({
        orderId,
        actor,
        comment,
        fromStatus: "PROCESSING_COMPLETED",
        toStatus: "READY_FOR_DELIVERY",
        extraFields: { ready_for_delivery_at: new Date() }
    });
}

/**
 * Mark order as DELIVERED (final step — closes the order).
 * 
 * HTTP PATCH /api/orders/:id/delivered
 */
export async function markDeliveredAndClose({ orderId, actor, comment }) {
    return transitionOrder({
        orderId,
        actor,
        comment,
        fromStatus: "READY_FOR_DELIVERY",
        toStatus: "DELIVERED",
        extraFields: {
            delivered_at: new Date(),
            customer_confirmed: true,
            customer_confirmed_at: new Date()
        }
    });
}

/**
 * Get one order by ID with full details, or throw 404.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Order with details
 */
export async function getOrderById(orderId) {
    const order = await orderRepository.findByIdWithDetails(orderId);
    if (!order) {
        const error = new Error("Order not found");
        error.status = 404;
        throw error;
    }
    return order;
}

/**
 * Get items for an order.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} Order items
 */
export async function getOrderItems(orderId) {
    return await orderRepository.getOrderItems(orderId);
}

/**
 * Get status history for an order (audit trail).
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} Status history
 */
export async function getOrderHistory(orderId) {
    return await orderRepository.getOrderStatusHistory(orderId);
}