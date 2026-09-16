/**
 * src/modules/processing/processing.repository.js
 * 
 * Database operations for order processing (the middle stage of the order lifecycle).
 * 
 * IMPORTANT: SQL does NOT support `//` comments — only `--` or `/* *​/`.
 * Previous version had invalid `//` comments inside SQL, causing ER_PARSE_ERROR.
 */
import { pool } from "../../database/pool.js";

/**
 * Get the work queue: orders that are APPROVED (ready to start) or PROCESSING (in progress).
 * Ordered by approval time (oldest first = first-come, first-served).
 * 
 * @returns {Promise<Array>} Processing work queue
 */
export async function findWorkQueue() {
    const [rows] = await pool.execute(
        `SELECT
            p.id AS processing_id,
            p.status AS processing_status,
            p.assigned_to,
            p.started_at,
            p.completed_at,
            o.id AS order_id,
            o.order_code,
            o.status AS order_status,
            o.branch_id,
            o.total_amount,
            o.approved_at,
            c.full_name AS customer_name,
            c.phone AS customer_phone
        FROM processing p
        JOIN orders o ON o.id = p.order_id
        JOIN customers c ON c.id = o.customer_id
        WHERE o.status IN ('APPROVED', 'PROCESSING')
        ORDER BY o.approved_at ASC`
    );
    return rows;
}

/**
 * Find the processing record for a specific order.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Object|null>} Processing record or null
 */
export async function findByOrderId(orderId) {
    const [rows] = await pool.execute(
        `SELECT
            p.id AS processing_id,
            p.status AS processing_status,
            p.assigned_to,
            p.notes,
            p.started_at,
            p.completed_at,
            o.id AS order_id,
            o.order_code,
            o.status AS order_status,
            o.branch_id
        FROM processing p
        JOIN orders o ON o.id = p.order_id
        WHERE p.order_id = ?`,
        [orderId]
    );
    return rows[0] || null;
}

/**
 * Add/update a note on a processing record.
 * 
 * @param {number} orderId - Order ID
 * @param {string} note - Processing note
 * @returns {Promise<void>}
 */
export async function addNote(orderId, note) {
    await pool.execute(
        "UPDATE processing SET notes = ? WHERE order_id = ?",
        [note, orderId]
    );
}