// src/modules/orders/order.service.js — updated transitions only
import * as orderRepository from "./order.repository.js";
import { pool } from "../../database/pool.js";

export async function getAllOrders() {
  return await orderRepository.findAll();
}

// Main branch ID - all orders go through the main branch
const MAIN_BRANCH_ID = 1;

export async function logOrder({ actor, customer, items }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Always use main branch for all order requests
    const branchId = MAIN_BRANCH_ID;

    // Find or create customer
    const customerId = await orderRepository.findOrCreateCustomer(connection, {
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address,
      businessName: customer.businessName,
      branchId
    });

    // Generate order code
    const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const orderId = await orderRepository.createOrder(connection, {
      branchId,
      customerId,
      loggedBy: actor.userId,
      orderCode
    });

    // Add order items
    await orderRepository.addOrderItems(connection, orderId, items);

    // Recalculate total
    await orderRepository.recalculateTotal(connection, orderId);

    await connection.commit();

    // Return the created order with details
    const order = await orderRepository.findById(orderId);
    return order;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function transitionOrder({ orderId, actor, comment, allowedRoles, fromStatus, toStatus, extraFields = {}, afterUpdate }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const order = await orderRepository.findByIdForUpdate(connection, orderId, actor);

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

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

    return {
      orderId,
      fromStatus,
      toStatus,
      updatedBy: actor.userId,
      comment
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function approveOrder({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"],
    fromStatus: "PENDING",
    toStatus: "APPROVED",
    extraFields: { approved_at: new Date(), customer_service_id: actor.userId },
    afterUpdate: async (connection) => {
      await connection.execute(
        `INSERT INTO processing (order_id, status) VALUES (?, 'PENDING')`,
        [orderId]
      );
    },
  });
}

export async function startProcessing({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "PROCESSING"],
    fromStatus: "APPROVED",
    toStatus: "PROCESSING",
    extraFields: { processing_started_at: new Date() },
    afterUpdate: async (connection) => {
      await connection.execute(
        `UPDATE processing SET status = 'IN_PROGRESS', assigned_to = ?, started_at = UTC_TIMESTAMP(3) WHERE order_id = ?`,
        [actor.userId, orderId]
      );
    },
  });
}

export async function completeProcessing({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "PROCESSING"],
    fromStatus: "PROCESSING",
    toStatus: "PROCESSING_COMPLETED",
    extraFields: { processing_completed_at: new Date() },
    afterUpdate: async (connection) => {
      await connection.execute(
        `UPDATE processing SET status = 'COMPLETED', completed_at = UTC_TIMESTAMP(3) WHERE order_id = ?`,
        [orderId]
      );
      await connection.execute(
        `
        INSERT INTO notifications (order_id, user_id, title, message, type)
        SELECT ?, id, 'Processing complete', CONCAT('Order ', ?, ' is ready to prepare for delivery.'), 'ORDER_HANDOFF'
        FROM users WHERE role = 'CUSTOMER_SERVICE' AND is_active = TRUE
        `,
        [orderId, orderId]
      );
    },
  });
}

export async function markReadyForDelivery({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"],
    fromStatus: "PROCESSING_COMPLETED",
    toStatus: "READY_FOR_DELIVERY",
    extraFields: { ready_for_delivery_at: new Date() },
  });
}

export async function markDeliveredAndClose({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"],
    fromStatus: "READY_FOR_DELIVERY",
    toStatus: "DELIVERED",
    extraFields: { delivered_at: new Date(), customer_confirmed: true, customer_confirmed_at: new Date() },
  });
}