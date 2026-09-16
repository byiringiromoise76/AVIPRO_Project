/**
 * src/modules/orders/order.controller.js
 * 
 * HTTP handlers for order operations.
 * Connects Express requests with the order service.
 */
import * as orderService from "./order.service.js";

/**
 * GET /api/orders?status=PENDING&startDate=...&endDate=...&limit=50
 * Get all orders with optional filters.
 */
export async function getAllOrders(req, res, next) {
    try {
        const filters = {
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 100
        };
        const orders = await orderService.getAllOrders(filters);
        return res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/orders — Create/log a new order.
 * Supports both guest customers and authenticated staff.
 * 
 * Example body:
 *   {
 *     "customer": { "fullName": "Jane", "phone": "0712345678", "address": "123 St" },
 *     "items": [{ "productId": 1, "quantity": 2, "unitPrice": 50 }]
 *   }
 */
export async function logOrder(req, res, next) {
    try {
        // req.auth is set by the authenticate middleware (null = guest checkout)
        const actor = req.auth || null;

        const result = await orderService.logOrder({
            actor,
            customer: {
                fullName: req.body.customer.fullName,
                phone: req.body.customer.phone,
                address: req.body.customer.address,
                businessName: req.body.customer.businessName
            },
            items: req.body.items
        });
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * Factory that creates a transition handler for status-change endpoints.
 * Extracts the order ID and actor from the request and calls the service function.
 * 
 * @param {Function} serviceFn - One of the orderService transition functions
 * @returns {Function} Express handler
 */
const makeTransitionHandler = (serviceFn) => async (req, res, next) => {
    try {
        const orderId = Number(req.params.id);
        const actor = req.auth; // Always set — routes are protected by authenticate
        const result = await serviceFn({
            orderId,
            actor,
            comment: req.body.comment || null
        });
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export const approveOrder = makeTransitionHandler(orderService.approveOrder);
export const startProcessing = makeTransitionHandler(orderService.startProcessing);
export const completeProcessing = makeTransitionHandler(orderService.completeProcessing);
export const markReadyForDelivery = makeTransitionHandler(orderService.markReadyForDelivery);
export const markDeliveredAndClose = makeTransitionHandler(orderService.markDeliveredAndClose);

/**
 * GET /api/orders/:id — Get an order by ID with complete details.
 */
export async function getOrderById(req, res, next) {
    try {
        const orderId = Number(req.params.id);
        const order = await orderService.getOrderById(orderId);
        return res.status(200).json({ data: order });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/orders/:id/items — Get items for an order.
 */
export async function getOrderItems(req, res, next) {
    try {
        const orderId = Number(req.params.id);
        const items = await orderService.getOrderItems(orderId);
        return res.status(200).json({ data: items });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/orders/:id/history — Get status history for an order.
 */
export async function getOrderHistory(req, res, next) {
    try {
        const orderId = Number(req.params.id);
        const history = await orderService.getOrderHistory(orderId);
        return res.status(200).json({ data: history });
    } catch (error) {
        next(error);
    }
}