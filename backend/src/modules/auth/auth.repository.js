/**
 * src/modules/auth/auth.repository.js
 * 
 * Database operations for authentication.
 * This is the data access layer for the auth service.
 * 
 * WHY separate layer? The repository isolates all SQL queries in one place,
 * so the service layer stays clean and testable. If the database schema changes,
 * you only update the repository — not the business logic.
 * 
 * NOTE: Users are identified by email (not username) — the users table has no username column.
 * Refresh tokens are stored HASHED (SHA-256 → 64-char hex matching CHAR(64) column),
 * for security: even if the database leaks, raw tokens can't be used.
 */
import { pool } from "../../database/pool.js";
import { hashPassword } from "../../utils/password.js";
import crypto from "crypto";

/**
 * Hash a refresh token for secure database storage.
 * SHA-256 produces a fixed 64-character hex string matching the token_hash CHAR(64) column.
 * 
 * WHY hash? If a hacker steals the database, they get hashes — not usable tokens.
 * 
 * @param {string} token - The raw refresh token
 * @returns {string} SHA-256 hex hash of the token
 */
function hashRefreshToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Find a user by email (users table has email, not username).
 * Used during login to authenticate users.
 * Returns the user record including password_hash for password verification.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function findByEmail(email) {
    const [rows] = await pool.execute(
        `SELECT id, email, password_hash AS password, full_name, phone, branch_id, role, is_active
         FROM users WHERE email = ? LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

/**
 * Find a user by ID (primary key).
 * Used to get user info for token generation and authorization.
 * 
 * @param {number} userId - User's database ID
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function findById(userId) {
    const [rows] = await pool.execute(
        `SELECT id, email, full_name, phone, branch_id, role, is_active
         FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
}

/**
 * Create a new user in the database.
 * Password is hashed with bcrypt before storage (never store plain text!).
 * 
 * @param {Object} data - User data { email, password, fullName, phone, branchId, role }
 * @returns {Promise<number>} ID of the newly created user
 */
export async function createUser({ email, password, fullName, phone, branchId, role }) {
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.execute(
        `INSERT INTO users (email, password_hash, full_name, phone, branch_id, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [email, hashedPassword, fullName, phone || null, branchId || 1, role || "SALES"]
    );
    return result.insertId;
}

/**
 * Save a refresh token hash in the database.
 * Used after login to store the refresh token for later token refresh.
 * 
 * @param {number} userId - User's ID
 * @param {string} refreshToken - Raw refresh token (hashed before storing)
 * @param {Date} expiresAt - Token expiration timestamp
 * @returns {Promise<number>} ID of the created refresh session
 */
export async function saveRefreshToken(userId, refreshToken, expiresAt) {
    const tokenHash = hashRefreshToken(refreshToken);
    // Delete any existing rows with the same hash (handles revoke-then-save race)
    await pool.execute(
        "DELETE FROM refresh_sessions WHERE token_hash = ?",
        [tokenHash]
    );
    const [result] = await pool.execute(
        `INSERT INTO refresh_sessions (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
    );
    return result.insertId;
}

/**
 * Find a valid refresh token in the database.
 * Used during token refresh to validate the refresh token.
 * Checks that: token_hash matches, not revoked (revoked_at IS NULL), not expired.
 * 
 * @param {string} token - Raw refresh token from client
 * @returns {Promise<Object|null>} Refresh session record or null if invalid
 */
export async function findRefreshToken(token) {
    const tokenHash = hashRefreshToken(token);
    const [rows] = await pool.execute(
        `SELECT user_id, expires_at
         FROM refresh_sessions
         WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
    );
    return rows[0] || null;
}

/**
 * Revoke a specific refresh token (used during logout).
 * Sets revoked_at timestamp — the token can no longer be used to get new access tokens.
 * 
 * @param {string} token - The raw refresh token to revoke
 * @returns {Promise<boolean>} True if a token was revoked
 */
export async function revokeRefreshToken(token) {
    const tokenHash = hashRefreshToken(token);
    const [result] = await pool.execute(
        "UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL",
        [tokenHash]
    );
    return result.affectedRows > 0;
}

/**
 * Revoke all refresh tokens for a user.
 * Used during logout or when a password is changed to invalidate all sessions.
 * 
 * @param {number} userId - User's ID
 * @returns {Promise<number>} Number of revoked sessions
 */
export async function revokeAllUserTokens(userId) {
    const [result] = await pool.execute(
        "UPDATE refresh_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
        [userId]
    );
    return result.affectedRows;
}