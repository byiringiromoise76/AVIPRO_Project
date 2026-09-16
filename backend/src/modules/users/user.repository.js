/**
 * src/modules/users/user.repository.js
 * 
 * Database operations for user management.
 * Data access layer for the user service.
 * 
 * NOTE: The users table has NO username column — users are identified by email.
 * The table columns are: id, branch_id, full_name, email, phone, role,
 * password_hash, is_active, created_at, updated_at, etc.
 */
import { pool } from "../../database/pool.js";
import { hashPassword, comparePassword } from "../../utils/password.js";

/**
 * Get all users, ordered newest first.
 * 
 * @returns {Promise<Array>} List of all users
 */
export async function findAll() {
    const [rows] = await pool.execute(
        `SELECT id, email, full_name, branch_id, role, phone, is_active, created_at, updated_at
         FROM users ORDER BY created_at DESC`
    );
    return rows;
}

/**
 * Find a user by ID (primary key).
 * 
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User record or null
 */
export async function findById(id) {
    const [rows] = await pool.execute(
        `SELECT id, email, full_name, branch_id, role, phone, is_active, created_at, updated_at
         FROM users WHERE id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Find a user by email (unique identifier).
 * 
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} User record or null
 */
export async function findByEmail(email) {
    const [rows] = await pool.execute(
        `SELECT id, email, full_name, branch_id, role, phone, is_active, created_at, updated_at
         FROM users WHERE email = ? LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

/**
 * Create a new user.
 * Password is hashed with bcrypt before storage.
 * 
 * @param {Object} data - { email, password, fullName, branchId, role, phone }
 * @returns {Promise<number>} New user's ID
 */
export async function create({ email, password, fullName, branchId, role, phone }) {
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.execute(
        `INSERT INTO users (email, password_hash, full_name, branch_id, role, phone, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [email, hashedPassword, fullName, branchId, role, phone || null]
    );
    return result.insertId;
}

/**
 * Update user information — partial update, only includes provided fields.
 * 
 * @param {number} id - User ID
 * @param {Object} data - Fields to update { email, fullName, branchId, role, phone, isActive }
 * @returns {Promise<boolean>} True if updated
 */
export async function update(id, { email, fullName, branchId, role, phone, isActive }) {
    const fields = [];
    const values = [];

    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (fullName !== undefined) { fields.push('full_name = ?'); values.push(fullName); }
    if (branchId !== undefined) { fields.push('branch_id = ?'); values.push(branchId); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (isActive !== undefined) { fields.push('is_active = ?'); values.push(isActive); }

    if (fields.length === 0) return false; // Nothing to update

    fields.push('updated_at = CURRENT_TIMESTAMP(3)');
    values.push(id);

    const [result] = await pool.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0;
}

/**
 * Delete a user from the database.
 * 
 * @param {number} id - User ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteById(id) {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

/**
 * Change a user's password.
 * Verifies the current password before setting the new one (defense in depth).
 * 
 * @param {number} id - User ID
 * @param {string} currentPassword - Current password to verify
 * @param {string} newPassword - New password to set
 * @returns {Promise<boolean>} True if changed
 */
export async function changePassword(id, currentPassword, newPassword) {
    const [rows] = await pool.execute(
        "SELECT id, password_hash AS password FROM users WHERE id = ? LIMIT 1",
        [id]
    );
    const user = rows[0];
    if (!user) return false;

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) return false;

    const hashedPassword = await hashPassword(newPassword);
    const [result] = await pool.execute(
        "UPDATE users SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [hashedPassword, id]
    );
    return result.affectedRows > 0;
}

/**
 * Toggle a user's active status (activate/deactivate).
 * Deactivated users cannot log in.
 * 
 * @param {number} id - User ID
 * @returns {Promise<boolean>} True if toggled
 */
export async function toggleActive(id) {
    const [result] = await pool.execute(
        "UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [id]
    );
    return result.affectedRows > 0;
}