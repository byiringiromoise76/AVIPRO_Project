/**
 * src/modules/customers/customer.repository.js
 * 
 * Database operations for customers.
 * Customers are created during order placement for tracking purposes.
 * 
 * NOTE: The customers table has NO email column — columns are:
 * id, branch_id, full_name, phone, address, business_name, created_at, updated_at.
 * The unique identifier is phone (per branch).
 */
import { pool } from "../../database/pool.js";

/**
 * Find a customer by phone number (unique per branch).
 * Used during order placement to check if a customer already exists.
 * 
 * @param {string} phone - Customer's phone number
 * @returns {Promise<Object|null>} Customer record or null
 */
export async function findByPhone(phone) {
    const [rows] = await pool.execute(
        "SELECT id, full_name, phone, address, business_name, branch_id FROM customers WHERE phone = ? LIMIT 1",
        [phone]
    );
    return rows[0] || null;
}

/**
 * Find a customer by ID.
 * 
 * @param {number} id - Customer ID
 * @returns {Promise<Object|null>} Customer record or null
 */
export async function findById(id) {
    const [rows] = await pool.execute(
        "SELECT id, full_name, phone, address, business_name, branch_id FROM customers WHERE id = ? LIMIT 1",
        [id]
    );
    return rows[0] || null;
}

/**
 * Get all customers, newest first.
 * 
 * @returns {Promise<Array>} All customers
 */
export async function findAll() {
    const [rows] = await pool.execute(
        "SELECT id, full_name, phone, address, business_name, branch_id FROM customers ORDER BY created_at DESC"
    );
    return rows;
}

/**
 * Create a new customer.
 * Accepts an optional connection for use inside transactions (SQL atomicity).
 * 
 * @param {Object} [connection] - DB connection from pool (for transactions); falls back to pool
 * @param {Object} data - { fullName, phone, address, businessName, branchId }
 * @returns {Promise<number>} New customer's ID
 */
export async function createCustomer(connection, { fullName, phone, address, businessName, branchId }) {
    const db = connection || pool;
    const [result] = await db.execute(
        `INSERT INTO customers (branch_id, full_name, phone, address, business_name)
         VALUES (?, ?, ?, ?, ?)`,
        [branchId, fullName, phone, address, businessName || null]
    );
    return result.insertId;
}

/**
 * Update customer — partial update, only provided fields are changed.
 * 
 * @param {number} id - Customer ID
 * @param {Object} data - { fullName, phone, address, businessName }
 * @returns {Promise<boolean>} True if updated
 */
export async function updateCustomer(id, { fullName, phone, address, businessName }) {
    const fields = [];
    const values = [];

    if (fullName !== undefined) { fields.push('full_name = ?'); values.push(fullName); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address); }
    if (businessName !== undefined) { fields.push('business_name = ?'); values.push(businessName || null); }

    if (fields.length === 0) return false; // Nothing to update

    fields.push('updated_at = CURRENT_TIMESTAMP(3)');
    values.push(id);

    const [result] = await pool.execute(
        `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0;
}

/**
 * Search customers by name, phone, or business name.
 * Uses LIKE with wildcards for partial-match search.
 * 
 * @param {string} searchTerm - Text to search for
 * @returns {Promise<Array>} Matching customers
 */
export async function searchCustomers(searchTerm) {
    const [rows] = await pool.execute(
        `SELECT id, full_name, phone, address, business_name, branch_id
         FROM customers
         WHERE full_name LIKE ? OR phone LIKE ? OR business_name LIKE ?
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows;
}

/**
 * Get all orders for a customer (order history).
 * 
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} Customer's orders
 */
export async function getCustomerOrders(customerId) {
    const [rows] = await pool.execute(
        `SELECT o.id, o.order_code, o.status, o.total_amount, o.created_at, o.delivered_at
         FROM orders o
         WHERE o.customer_id = ?
         ORDER BY o.created_at DESC`,
        [customerId]
    );
    return rows;
}