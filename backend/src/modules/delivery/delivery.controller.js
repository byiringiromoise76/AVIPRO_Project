/**
 * src/modules/delivery/delivery.controller.js
 * 
 * HTTP handlers for delivery operations.
 */
import * as deliveryService from "./delivery.service.js";

/**
 * GET /api/delivery — Get all deliveries.
 */
export async function getAllDeliveries(req, res, next) {
    try {
        const deliveries = await deliveryService.getAllDeliveries();
        return res.status(200).json({ data: deliveries });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/delivery/:id — Get a delivery by ID.
 */
export async function getDeliveryById(req, res, next) {
    try {
        const delivery = await deliveryService.getDeliveryById(req.params.id);
        return res.status(200).json({ data: delivery });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/delivery/order/:orderId — Get delivery by order.
 */
export async function getDeliveryByOrderId(req, res, next) {
    try {
        const delivery = await deliveryService.getDeliveryByOrderId(req.params.orderId);
        return res.status(200).json({ data: delivery });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/delivery/status/:status — Get deliveries by status.
 * Valid statuses: PENDING, DISPATCHED, DELIVERED.
 */
export async function getDeliveriesByStatus(req, res, next) {
    try {
        const deliveries = await deliveryService.getDeliveriesByStatus(req.params.status);
        return res.status(200).json({ data: deliveries });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/delivery — Create a delivery.
 * 
 * Example body:
 *   { "orderId": 1, "deliveryAddress": "123 Main St", "scheduledAt": "2026-09-20 10:00:00", "notes": "Call on arrival" }
 */
export async function createDelivery(req, res, next) {
    try {
        const { orderId, deliveryAddress, scheduledAt, notes, deliveryPersonId } = req.body;
        const delivery = await deliveryService.createDelivery({
            orderId,
            deliveryAddress,
            scheduledAt,
            notes,
            deliveryPersonId
        });
        return res.status(201).json({ data: delivery });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/delivery/:id — Update a delivery.
 */
export async function updateDelivery(req, res, next) {
    try {
        const { deliveryAddress, deliveryPersonId, scheduledAt, notes, status } = req.body;
        const delivery = await deliveryService.updateDelivery(req.params.id, {
            deliveryAddress,
            deliveryPersonId,
            scheduledAt,
            notes,
            status
        });
        return res.status(200).json({ data: delivery });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/delivery/:id — Delete a delivery.
 */
export async function deleteDelivery(req, res, next) {
    try {
        const result = await deliveryService.deleteDelivery(req.params.id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}