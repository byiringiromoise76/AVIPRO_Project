/**
 * src/modules/notifications/notification.repository.js
 * 
 * Database operations for in-app notifications.
 * 
 * NOTE: users table has email — NOT username.
 * notifications table columns: id, user_id, order_id, title, message,
 * type, is_read, created_at.
 */
import { pool } from "../../database/pool.js";

// Common SELECT list with the users join.
const NOTIFICATION_SELECT = `
    SELECT n.id, n.user_id, n.order_id, n.title, n.message, n.type, n.is_read, n.created_at,
           u.email AS user_email, u.full_name, u.role,
           o.order_code
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    LEFT JOIN orders o ON n.order_id = o.id
`;

/**
 * Get all notifications.
 * 
 * @returns {Promise<Array>} All notifications
 */
export async function findAll() {
    const [rows] = await pool.execute(`${NOTIFICATION_SELECT} ORDER BY n.created_at DESC`);
    return rows;
}

/**
 * Find a notification by ID.
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object|null>} Notification or null
 */
export async function findById(id) {
    const [rows] = await pool.execute(
        `${NOTIFICATION_SELECT} WHERE n.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Get all notifications for a user.
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Notifications
 */
export async function findByUserId(userId) {
    const [rows] = await pool.execute(
        `${NOTIFICATION_SELECT} WHERE n.user_id = ? ORDER BY n.created_at DESC`,
        [userId]
    );
    return rows;
}

/**
 * Get unread notifications for a user (for badges/alerts).
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Unread notifications
 */
export async function findUnreadByUserId(userId) {
    const [rows] = await pool.execute(
        `${NOTIFICATION_SELECT} WHERE n.user_id = ? AND n.is_read = FALSE ORDER BY n.created_at DESC`,
        [userId]
    );
    return rows;
}

/**
 * Get all notifications related to an order.
 * 
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} Notifications
 */
export async function findByOrderId(orderId) {
    const [rows] = await pool.execute(
        `${NOTIFICATION_SELECT} WHERE n.order_id = ? ORDER BY n.created_at DESC`,
        [orderId]
    );
    return rows;
}

/**
 * Create a notification (unread by default).
 * 
 * @param {Object} data - { userId, orderId, title, message, type }
 * @returns {Promise<number>} New notification ID
 */
export async function create({ userId, orderId, title, message, type }) {
    const [result] = await pool.execute(
        `INSERT INTO notifications (user_id, order_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [userId, orderId || null, title, message, type || 'SYSTEM']
    );
    return result.insertId;
}

/**
 * Mark a notification as read.
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<boolean>} True if updated
 */
export async function markAsRead(id) {
    const [result] = await pool.execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = ?",
        [id]
    );
    return result.affectedRows > 0;
}

/**
 * Mark all notifications as read for a user.
 * 
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
export async function markAllAsReadForUser(userId) {
    const [result] = await pool.execute(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
        [userId]
    );
    return result.affectedRows;
}

/**
 * Delete a notification.
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteById(id) {
    const [result] = await pool.execute("DELETE FROM notifications WHERE id = ?", [id]);
    return result.affectedRows > 0;
}