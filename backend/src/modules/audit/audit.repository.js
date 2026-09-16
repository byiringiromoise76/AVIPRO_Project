/**
 * src/modules/audit/audit.repository.js
 * 
 * Database operations for audit logging.
 * 
 * NOTE: users table has email — NOT username.
 */
import { pool } from "../../database/pool.js";

// Common SELECT list with the users join.
const AUDIT_SELECT = `
    SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id,
           a.ip_address, a.user_agent, a.metadata, a.created_at,
           u.email AS user_email, u.full_name, u.role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
`;

/**
 * Get audit logs with optional filters (user, action, entityType, date range, limit).
 * 
 * @param {Object} filters - { userId, action, entityType, startDate, endDate, limit }
 * @returns {Promise<Array>} Filtered audit logs
 */
export async function findAll({ userId, action, entityType, startDate, endDate, limit = 100 }) {
    let query = `${AUDIT_SELECT} WHERE 1=1`;
    const params = [];

    if (userId) { query += " AND a.user_id = ?"; params.push(userId); }
    if (action) { query += " AND a.action = ?"; params.push(action); }
    if (entityType) { query += " AND a.entity_type = ?"; params.push(entityType); }
    if (startDate) { query += " AND a.created_at >= ?"; params.push(startDate); }
    if (endDate) { query += " AND a.created_at <= ?"; params.push(endDate); }

    query += " ORDER BY a.created_at DESC LIMIT ?";
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return rows;
}

/**
 * Get one audit log by ID.
 * 
 * @param {number} id - Audit log ID
 * @returns {Promise<Object|null>} Audit log or null
 */
export async function findById(id) {
    const [rows] = await pool.execute(
        `${AUDIT_SELECT} WHERE a.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Get audit logs for a user.
 * 
 * @param {number} userId - User ID
 * @param {number} limit - Max rows
 * @returns {Promise<Array>} User's audit logs
 */
export async function findByUserId(userId, limit = 50) {
    const [rows] = await pool.execute(
        `${AUDIT_SELECT} WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT ?`,
        [userId, limit]
    );
    return rows;
}

/**
 * Get audit logs for an action type.
 * 
 * @param {string} action - Action name (e.g. "LOGIN", "CREATE_ORDER")
 * @param {number} limit - Max rows
 * @returns {Promise<Array>} Matching audit logs
 */
export async function findByAction(action, limit = 50) {
    const [rows] = await pool.execute(
        `${AUDIT_SELECT} WHERE a.action = ? ORDER BY a.created_at DESC LIMIT ?`,
        [action, limit]
    );
    return rows;
}

/**
 * Create an audit log entry.
 * Metadata is stored as JSON for flexibility.
 * 
 * @param {Object} data - { userId, action, entityType, entityId, ipAddress, userAgent, metadata }
 * @returns {Promise<number>} New log ID
 */
export async function create({ userId, action, entityType, entityId, ipAddress, userAgent, metadata }) {
    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await pool.execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId || null, action || null, entityType || null, entityId || null, ipAddress || null, userAgent || null, metadataJson]
    );
    return result.insertId;
}

/**
 * Delete an audit log.
 * 
 * @param {number} id - Audit log ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteById(id) {
    const [result] = await pool.execute("DELETE FROM audit_logs WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

/**
 * Delete audit logs older than the retention period (default 90 days).
 * Keeps the DB from growing indefinitely.
 * 
 * @param {number} daysToKeep - Retention period in days
 * @returns {Promise<number>} Number of deleted rows
 */
export async function deleteOldLogs(daysToKeep = 90) {
    const [result] = await pool.execute(
        "DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
        [daysToKeep]
    );
    return result.affectedRows;
}