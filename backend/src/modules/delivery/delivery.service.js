/**
 * src/modules/delivery/delivery.service.js
 * 
 * Business logic for delivery management.
 * One delivery record per order, tracking schedule → dispatch → delivered.
 * 
 * NOTE: The delivery table columns are scheduled_at, dispatched_at, delivered_at,
 * notes, delivery_address, delivery_person_id. Statuses: PENDING, DISPATCHED, DELIVERED.
 */
import * as deliveryRepository from "./delivery.repository.js";

/**
 * Get all deliveries.
 * 
 * @returns {Promise<Array>} All deliveries
 */
export async function getAllDeliveries() {
    return await deliveryRepository.findAll();
}

/**
 * Get one delivery by ID, or throw 404.
 * 
 * @param {number} id - Delivery ID
 * @returns {Promise<Object>} Delivery
 */
export async function getDeliveryById(id) {
    const delivery = await deliveryRepository.findById(id);
    if (!delivery) {
        const error = new Error("Delivery not found");
        error.status = 404;
        throw error;
    }
    return delivery;
}

/**
 * Get delivery for an order.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Delivery
 */
export async function getDeliveryByOrderId(orderId) {
    const delivery = await deliveryRepository.findByOrderId(orderId);
    if (!delivery) {
        const error = new Error("Delivery not found for this order");
        error.status = 404;
        throw error;
    }
    return delivery;
}

/**
 * Get deliveries filtered by status.
 * 
 * @param {string} status - PENDING, DISPATCHED, or DELIVERED
 * @returns {Promise<Array>} Deliveries
 */
export async function getDeliveriesByStatus(status) {
    return await deliveryRepository.findByStatus(status);
}

/**
 * Create a delivery for an order. Each order can have only ONE delivery.
 * 
 * @param {Object} data - { orderId, deliveryAddress, scheduledAt, notes, deliveryPersonId }
 * @returns {Promise<Object>} Created delivery
 */
export async function createDelivery({ orderId, deliveryAddress, scheduledAt, notes, deliveryPersonId }) {
    // Prevent duplicate delivery records for the same order
    const existing = await deliveryRepository.findByOrderId(orderId);
    if (existing) {
        const error = new Error("Delivery already exists for this order");
        error.status = 409;
        throw error;
    }

    const id = await deliveryRepository.create({
        orderId,
        deliveryAddress,
        scheduledAt,
        notes,
        deliveryPersonId
    });
    return await deliveryRepository.findById(id);
}

/**
 * Update a delivery — partial update.
 * 
 * @param {number} id - Delivery ID
 * @param {Object} data - { deliveryAddress, deliveryPersonId, scheduledAt, notes, status }
 * @returns {Promise<Object>} Updated delivery
 */
export async function updateDelivery(id, { deliveryAddress, deliveryPersonId, scheduledAt, notes, status }) {
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
        const error = new Error("Delivery not found");
        error.status = 404;
        throw error;
    }

    const updateData = {};
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
    if (deliveryPersonId !== undefined) updateData.deliveryPersonId = deliveryPersonId;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await deliveryRepository.update(id, updateData);
    return await deliveryRepository.findById(id);
}

/**
 * Delete a delivery record.
 * 
 * @param {number} id - Delivery ID
 * @returns {Promise<Object>} Confirmation message
 */
export async function deleteDelivery(id) {
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
        const error = new Error("Delivery not found");
        error.status = 404;
        throw error;
    }
    await deliveryRepository.deleteById(id);
    return { message: "Delivery deleted successfully" };
}