/**
 * src/modules/delivery/delivery.repository.js
 * 
 * Database operations for delivery tracking.
 * One delivery record per order (unique constraint on order_id).
 * 
 * NOTE: delivery table columns are:
 * order_id, delivery_person_id, delivery_address,
 * status ENUM('PENDING','DISPATCHED','DELIVERED'),
 * customer_confirmed, customer_confirmed_at,
 * scheduled_at, dispatched_at, delivered_at, notes, created_at, updated_at.
 * There is NO delivery_date / delivery_notes / recipient_name / recipient_phone.
 */
import { pool } from "../../database/pool.js";

// Common SELECT list to avoid repetition in every query.
const DELIVERY_SELECT = `
    SELECT d.id, d.order_id, d.delivery_person_id, d.delivery_address,
           d.status, d.customer_confirmed, d.customer_confirmed_at,
           d.scheduled_at, d.dispatched_at, d.delivered_at, d.notes,
           d.created_at, d.updated_at,
           o.order_code, o.total_amount,
           c.full_name AS customer_name, c.phone AS customer_phone
    FROM delivery d
    JOIN orders o ON d.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
`;

/**
 * Get all deliveries with order and customer details.
 * 
 * @returns {Promise<Array>} All deliveries
 */
export async function findAll() {
    const [rows] = await pool.execute(`${DELIVERY_SELECT} ORDER BY d.created_at DESC`);
    return rows;
}

/**
 * Find a delivery by ID.
 * 
 * @param {number} id - Delivery ID
 * @returns {Promise<Object|null>} Delivery or null
 */
export async function findById(id) {
    const [rows] = await pool.execute(
        `${DELIVERY_SELECT} WHERE d.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Find the delivery for a specific order (one-to-one).
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Object|null>} Delivery or null
 */
export async function findByOrderId(orderId) {
    const [rows] = await pool.execute(
        `${DELIVERY_SELECT} WHERE d.order_id = ? LIMIT 1`,
        [orderId]
    );
    return rows[0] || null;
}

/**
 * Get all deliveries with a given status.
 * 
 * @param {string} status - 'PENDING', 'DISPATCHED', or 'DELIVERED'
 * @returns {Promise<Array>} Deliveries
 */
export async function findByStatus(status) {
    const [rows] = await pool.execute(
        `${DELIVERY_SELECT} WHERE d.status = ? ORDER BY d.created_at DESC`,
        [status]
    );
    return rows;
}

/**
 * Create a delivery record for an order (status PENDING).
 * 
 * @param {Object} data - { orderId, deliveryAddress, scheduledAt, notes, deliveryPersonId }
 * @returns {Promise<number>} New delivery ID
 */
export async function create({ orderId, deliveryAddress, scheduledAt, notes, deliveryPersonId }) {
    const [result] = await pool.execute(
        `INSERT INTO delivery (order_id, delivery_address, scheduled_at, notes, delivery_person_id, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [orderId, deliveryAddress, scheduledAt || null, notes || null, deliveryPersonId || null]
    );
    return result.insertId;
}

/**
 * Update a delivery — partial update of provided fields.
 * 
 * @param {number} id - Delivery ID
 * @param {Object} data - { deliveryAddress, deliveryPersonId, scheduledAt, notes, status }
 * @returns {Promise<boolean>} True if updated
 */
export async function update(id, { deliveryAddress, deliveryPersonId, scheduledAt, notes, status }) {
    const fields = [];
    const values = [];

    if (deliveryAddress !== undefined) { fields.push('delivery_address = ?'); values.push(deliveryAddress); }
    if (deliveryPersonId !== undefined) { fields.push('delivery_person_id = ?'); values.push(deliveryPersonId); }
    if (scheduledAt !== undefined) { fields.push('scheduled_at = ?'); values.push(scheduledAt); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }

    // Special handling for status transitions: set the associated timestamp
    if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
        if (status === 'DISPATCHED') fields.push('dispatched_at = NOW()');
        if (status === 'DELIVERED') fields.push('delivered_at = NOW()');
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP(3)');
    values.push(id);

    const [result] = await pool.execute(
        `UPDATE delivery SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0;
}

/**
 * Delete a delivery record.
 * 
 * @param {number} id - Delivery ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteById(id) {
    const [result] = await pool.execute("DELETE FROM delivery WHERE id = ?", [id]);
    return result.affectedRows > 0;
}