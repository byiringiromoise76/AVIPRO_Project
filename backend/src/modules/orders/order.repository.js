/**
 * src/modules/orders/order.repository.js
 * 
 * Database operations for orders.
 * 
 * NOTE on schema: the orders table has the following timestamp columns:
 * requested_at, approved_at, processing_started_at, processing_completed_at,
 * ready_for_delivery_at, delivered_at. There is NO 'processed_at' column.
 * The users table has email, not username. The status_history table
 * has created_at, not changed_at.
 */
import { pool } from "../../database/pool.js";

/**
 * Find or create a customer within a transaction.
 * Looks up by phone; creates a new record if not found.
 * 
 * @param {Object} connection - DB connection (must be in a transaction)
 * @param {Object} data - { fullName, phone, address, businessName, branchId }
 * @returns {Promise<number>} Customer ID
 */
export async function findOrCreateCustomer(connection, { fullName, phone, address, businessName, branchId }) {
    // Check if customer already exists with this phone number
    const [existing] = await connection.execute(
        "SELECT id FROM customers WHERE phone = ? LIMIT 1",
        [phone]
    );

    // Reuse existing customer if found (prevents duplicate records)
    if (existing[0]) return existing[0].id;

    // Create new customer otherwise
    const [result] = await connection.execute(
        `INSERT INTO customers (branch_id, full_name, phone, address, business_name)
         VALUES (?, ?, ?, ?, ?)`,
        [branchId, fullName, phone, address, businessName || null]
    );
    return result.insertId;
}

/**
 * Create a new order with status PENDING.
 * 
 * @param {Object} connection - DB connection (transaction)
 * @param {Object} data - { branchId, customerId, loggedBy, salespersonId, orderCode }
 * @returns {Promise<number>} New order ID
 */
export async function createOrder(connection, { branchId, customerId, loggedBy, salespersonId, orderCode }) {
    const [result] = await connection.execute(
        `INSERT INTO orders (branch_id, customer_id, customer_service_id, salesperson_id, order_code, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [branchId, customerId, loggedBy, salespersonId || loggedBy, orderCode]
    );
    return result.insertId;
}

/**
 * Add order items to an order (inside a transaction).
 * 
 * @param {Object} connection - DB connection (transaction)
 * @param {number} orderId - Order ID
 * @param {Array} items - [{ productId, quantity, unitPrice }]
 */
export async function addOrderItems(connection, orderId, items) {
    for (const item of items) {
        await connection.execute(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
             VALUES (?, ?, ?, ?)`,
            [orderId, item.productId, item.quantity, item.unitPrice]
        );
    }
}

/**
 * Recalculate the order total from its items.
 * The order_items table has a STORED GENERATED column `line_total`
 * = quantity * unit_price - discount, so we just SUM it.
 * 
 * @param {Object} connection - DB connection (transaction)
 * @param {number} orderId - Order ID
 */
export async function recalculateTotal(connection, orderId) {
    await connection.execute(
        `UPDATE orders o
         SET total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = ?)
         WHERE o.id = ?`,
        [orderId, orderId]
    );
}

/**
 * Get an order with a row-level lock (FOR UPDATE) for status transitions.
 * Prevents two requests from modifying the same order concurrently.
 * 
 * @param {Object} connection - DB connection (transaction)
 * @param {number} orderId - Order ID
 * @returns {Promise<Object|null>} Order { id, branch_id, status } or null
 */
export async function findByIdForUpdate(connection, orderId) {
    const [rows] = await connection.execute(
        `SELECT id, branch_id, status FROM orders WHERE id = ? FOR UPDATE`,
        [orderId]
    );
    return rows[0] || null;
}

/**
 * Set an order's status and optional extra fields (timestamps, ids).
 * 
 * @param {Object} connection - DB connection (transaction)
 * @param {number} orderId - Order ID
 * @param {string} status - New status value
 * @param {Object} extraFields - { columnName: value } pairs to update too
 * @returns {Promise<void>}
 */
export async function setStatus(connection, orderId, status, extraFields = {}) {
    const fields = ["status = ?"];
    const params = [status];

    // E.g. { approved_at: new Date() } → "approved_at = ?", [date]
    for (const [column, value] of Object.entries(extraFields)) {
        fields.push(`${column} = ?`);
        params.push(value);
    }

    params.push(orderId);
    await connection.execute(
        `UPDATE orders SET ${fields.join(", ")}, updated_at = UTC_TIMESTAMP(3) WHERE id = ?`,
        params
    );
}

/**
 * Write a row into order_status_history (audit trail for every status change).
 * 
 * @param {Object} connection - DB connection (transaction)
 * @param {number} orderId - Order ID
 * @param {number} userId - The user who changed the status
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string|null} comment - Optional comment
 */
export async function createStatusHistory(connection, orderId, userId, oldStatus, newStatus, comment) {
    await connection.execute(
        `INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, userId, oldStatus, newStatus, comment || null]
    );
}

/**
 * Get all orders with optional filtering by status and date range.
 * Joins customers, users, and branches for readable names.
 * 
 * @param {Object} filters - { status, startDate, endDate, limit }
 * @returns {Promise<Array>} List of orders
 */
export async function findAll({ status, startDate, endDate, limit = 100 } = {}) {
    let query = `
        SELECT
            o.id, o.order_code, o.status, o.total_amount,
            o.created_at, o.requested_at, o.approved_at,
            o.processing_started_at, o.processing_completed_at,
            o.ready_for_delivery_at, o.delivered_at,
            o.branch_id, o.customer_id, o.customer_service_id, o.salesperson_id,
            c.full_name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
            cs.email AS customer_service_email, cs.full_name AS customer_service_name,
            s.email AS salesperson_email, s.full_name AS salesperson_name,
            b.name AS branch_name, b.location AS branch_location
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users cs ON o.customer_service_id = cs.id
        LEFT JOIN users s ON o.salesperson_id = s.id
        LEFT JOIN branches b ON o.branch_id = b.id
        WHERE 1=1
    `;
    const params = [];

    // Optional: filter by exact status
    if (status) {
        query += " AND o.status = ?";
        params.push(status);
    }

    // Optional: filter by date range
    if (startDate) {
        query += " AND o.created_at >= ?";
        params.push(startDate);
    }
    if (endDate) {
        query += " AND o.created_at <= ?";
        params.push(endDate);
    }

    query += " ORDER BY o.created_at DESC LIMIT ?";
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return rows;
}

/**
 * Get one order by ID (simple, used for existence checks).
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Object|null>} Order or null
 */
export async function findById(orderId) {
    const [rows] = await pool.execute(
        "SELECT * FROM orders WHERE id = ? LIMIT 1",
        [orderId]
    );
    return rows[0] || null;
}

/**
 * Get one order with full joined details (customer, users, branch).
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Object|null>} Order with details or null
 */
export async function findByIdWithDetails(orderId) {
    const [rows] = await pool.execute(
        `SELECT
            o.id, o.order_code, o.status, o.total_amount,
            o.requested_at, o.approved_at,
            o.processing_started_at, o.processing_completed_at,
            o.ready_for_delivery_at, o.delivered_at,
            o.rejection_reason, o.internal_notes,
            o.branch_id, o.customer_id, o.customer_service_id, o.salesperson_id,
            c.full_name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
            c.business_name AS customer_business_name,
            cs.email AS customer_service_email, cs.full_name AS customer_service_name,
            s.email AS salesperson_email, s.full_name AS salesperson_name,
            b.name AS branch_name, b.location AS branch_location
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users cs ON o.customer_service_id = cs.id
        LEFT JOIN users s ON o.salesperson_id = s.id
        LEFT JOIN branches b ON o.branch_id = b.id
        WHERE o.id = ? LIMIT 1`,
        [orderId]
    );
    return rows[0] || null;
}

/**
 * Get items for an order with product info.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} Order items
 */
export async function getOrderItems(orderId) {
    const [rows] = await pool.execute(
        `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.line_total,
                p.name AS product_name, p.sku, p.selling_unit
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
         ORDER BY oi.id`,
        [orderId]
    );
    return rows;
}

/**
 * Get status history for an order (audit trail) with user info.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} Status history entries
 */
export async function getOrderStatusHistory(orderId) {
    const [rows] = await pool.execute(
        `SELECT osh.id, osh.order_id, osh.changed_by, osh.old_status, osh.new_status,
                osh.comment, osh.created_at AS changed_at,
                u.email AS user_email, u.full_name
         FROM order_status_history osh
         LEFT JOIN users u ON osh.changed_by = u.id
         WHERE osh.order_id = ?
         ORDER BY osh.created_at ASC`,
        [orderId]
    );
    return rows;
}