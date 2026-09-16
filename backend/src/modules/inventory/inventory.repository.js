/**
 * src/modules/inventory/inventory.repository.js
 * 
 * Database operations for inventory management.
 * Inventory tracks stock per product per branch.
 * 
 * NOTE: The inventory table columns are: id, branch_id, product_id,
 * quantity_available, quantity_reserved, updated_at.
 * There is NO quantity / minimum_stock / created_at column on this table —
 * minimum_stock lives on the products table.
 */
import { pool } from "../../database/pool.js";

// Common SELECT list reused in every query to avoid repetition.
// Joins products and branches to return human-readable names.
const INVENTORY_SELECT = `
    SELECT i.id, i.product_id, i.branch_id,
           i.quantity_available, i.quantity_reserved, i.updated_at,
           p.name AS product_name, p.sku, p.selling_unit, p.price, p.minimum_stock,
           b.name AS branch_name, b.location
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN branches b ON i.branch_id = b.id
`;

/**
 * Get all inventory records with product and branch details.
 * 
 * @returns {Promise<Array>} All inventory records
 */
export async function findAll() {
    const [rows] = await pool.execute(
        `${INVENTORY_SELECT} ORDER BY i.updated_at DESC`
    );
    return rows;
}

/**
 * Find an inventory record by ID.
 * 
 * @param {number} id - Inventory record ID
 * @returns {Promise<Object|null>} Record or null
 */
export async function findById(id) {
    const [rows] = await pool.execute(
        `${INVENTORY_SELECT} WHERE i.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Find inventory by product + branch combination.
 * Used to prevent duplicate records (unique constraint).
 * 
 * @param {number} productId - Product ID
 * @param {number} branchId - Branch ID
 * @returns {Promise<Object|null>} Record or null
 */
export async function findByProductAndBranch(productId, branchId) {
    const [rows] = await pool.execute(
        `${INVENTORY_SELECT} WHERE i.product_id = ? AND i.branch_id = ? LIMIT 1`,
        [productId, branchId]
    );
    return rows[0] || null;
}

/**
 * Get all records for a branch.
 * 
 * @param {number} branchId - Branch ID
 * @returns {Promise<Array>} Records for the branch
 */
export async function findByBranch(branchId) {
    const [rows] = await pool.execute(
        `${INVENTORY_SELECT} WHERE i.branch_id = ? ORDER BY i.updated_at DESC`,
        [branchId]
    );
    return rows;
}

/**
 * Get all records for a product (stock across all branches).
 * 
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Records for the product
 */
export async function findByProduct(productId) {
    const [rows] = await pool.execute(
        `${INVENTORY_SELECT} WHERE i.product_id = ? ORDER BY i.updated_at DESC`,
        [productId]
    );
    return rows;
}

/**
 * Get low stock items — quantity_available at or below product's minimum_stock.
 * Optionally filtered by branch.
 * 
 * @param {number|null} branchId - Optional branch filter
 * @returns {Promise<Array>} Low stock records
 */
export async function getLowStockItems(branchId) {
    const query = `
        ${INVENTORY_SELECT}
        WHERE i.quantity_available <= p.minimum_stock
        ${branchId ? 'AND i.branch_id = ?' : ''}
        ORDER BY i.quantity_available ASC
    `;
    const [rows] = await pool.execute(query, branchId ? [branchId] : []);
    return rows;
}

/**
 * Create a new inventory record (stock tracking for product at branch).
 * 
 * @param {Object} data - { productId, branchId, quantity }
 * @returns {Promise<number>} New record ID
 */
export async function create({ productId, branchId, quantity }) {
    const [result] = await pool.execute(
        `INSERT INTO inventory (product_id, branch_id, quantity_available)
         VALUES (?, ?, ?)`,
        [productId, branchId, quantity]
    );
    return result.insertId;
}

/**
 * Update inventory — partial update of quantity and reserved quantity.
 * 
 * @param {number} id - Record ID
 * @param {Object} data - { quantityAvailable, quantityReserved }
 * @returns {Promise<boolean>} True if updated
 */
export async function update(id, { quantityAvailable, quantityReserved }) {
    const fields = [];
    const values = [];

    if (quantityAvailable !== undefined) { fields.push('quantity_available = ?'); values.push(quantityAvailable); }
    if (quantityReserved !== undefined) { fields.push('quantity_reserved = ?'); values.push(quantityReserved); }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP(3)');
    values.push(id);

    const [result] = await pool.execute(
        `UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0;
}

/**
 * Adjust available stock by adding/subtracting a quantity change.
 * 
 * @param {number} id - Record ID
 * @param {number} quantityChange - Positive to add stock, negative to remove
 * @returns {Promise<boolean>} True if adjusted
 */
export async function adjustStock(id, quantityChange) {
    const [result] = await pool.execute(
        `UPDATE inventory
         SET quantity_available = quantity_available + ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [quantityChange, id]
    );
    return result.affectedRows > 0;
}

/**
 * Delete an inventory record (stops tracking a product at a branch).
 * 
 * @param {number} id - Record ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteById(id) {
    const [result] = await pool.execute("DELETE FROM inventory WHERE id = ?", [id]);
    return result.affectedRows > 0;
}