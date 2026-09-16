/**
 * src/modules/auth/auth.service.js
 * 
 * Authentication business logic: register, login, refresh token, logout.
 * 
 * WHY separate service layer? Business rules live here, independent of
 * Express (controller) and SQL (repository). This makes the logic
 * easy to test and reuse.
 * 
 * Flow:
 *   login → verify email + password → generate access & refresh tokens → save refresh token
 */
import * as authRepository from "./auth.repository.js";
import { comparePassword } from "../../utils/password.js";
import { generateAccessToken, generateRefreshToken, getTokenExpiration, verifyRefreshToken } from "../../utils/tokens.js";
import { env } from "../../config/env.js";

/**
 * Register a new user.
 * Validates that the email is unique before creating the user.
 * 
 * HTTP POST /api/auth/register
 * 
 * @param {Object} data - { email, password, fullName, phone, branchId, role }
 * @returns {Promise<Object>} Created user record (without password)
 */
export async function register({ email, password, fullName, phone, branchId, role }) {
    // Check email uniqueness to prevent duplicate accounts
    const existing = await authRepository.findByEmail(email);
    if (existing) {
        const error = new Error("Email already exists");
        error.status = 409; // HTTP 409 Conflict
        throw error;
    }

    // Create the user record (password hashed inside repository)
    const userId = await authRepository.createUser({ email, password, fullName, phone, branchId, role });
    return await authRepository.findById(userId);
}

/**
 * Authenticate a user and issue JWT tokens.
 * 
 * HTTP POST /api/auth/login
 * 
 * Example request body:
 *   { "email": "admin@avipro.com", "password": "password123" }
 * 
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user, accessToken, refreshToken, expiresIn }
 */
export async function login({ email, password }) {
    // Find user by email
    const user = await authRepository.findByEmail(email);
    if (!user) {
        const error = new Error("Invalid credentials");
        error.status = 401; // HTTP 401 Unauthorized
        throw error;
    }

    // Check account is active (not deactivated)
    if (!user.is_active) {
        const error = new Error("Account is deactivated");
        error.status = 403; // HTTP 403 Forbidden
        throw error;
    }

    // Verify the password against the stored hash
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        const error = new Error("Invalid credentials");
        error.status = 401;
        throw error;
    }

    // JWT payload — this data gets encoded inside the token and decoded on each request
    const payload = {
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
        role: user.role
    };

    // Access token: short-lived, sent with every API request
    const accessToken = generateAccessToken(payload);
    // Refresh token: long-lived, used only to get new access tokens
    const refreshToken = generateRefreshToken(payload);
    // Calculate expiry date for storing in database
    const refreshTokenExpiresAt = getTokenExpiration(`${env.jwt.refreshTokenDays}d`);

    // Store refresh token (hashed) in DB so it can be revoked later
    await authRepository.saveRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
            branchId: user.branch_id,
            role: user.role
        },
        accessToken,
        refreshToken,
        expiresIn: env.jwt.accessTokenTTL
    };
}

/**
 * Get a new access token using a valid refresh token.
 * Uses single-use refresh tokens for security: the old token is revoked
 * and a new one issued each time.
 * 
 * HTTP POST /api/auth/refresh
 * 
 * @param {Object} body - { refreshToken }
 * @returns {Promise<Object>} { accessToken, refreshToken, expiresIn }
 */
export async function refreshToken({ refreshToken }) {
    // Verify JWT signature and expiration
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        const error = new Error("Invalid or expired refresh token");
        error.status = 401;
        throw error;
    }

    // Check token exists in DB, isn't revoked, and isn't expired
    const tokenRecord = await authRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
        const error = new Error("Invalid or expired refresh token");
        error.status = 401;
        throw error;
    }

    // Get fresh user data (they could have been deactivated since login)
    const user = await authRepository.findById(decoded.userId);
    if (!user || !user.is_active) {
        const error = new Error("User not found or account deactivated");
        error.status = 401;
        throw error;
    }

    const payload = {
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
        role: user.role
    };

    // Generate new tokens
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    const refreshTokenExpiresAt = getTokenExpiration(`${env.jwt.refreshTokenDays}d`);

    // Revoke the old refresh token (single-use security)
    await authRepository.revokeRefreshToken(refreshToken);
    // Save the new refresh token
    await authRepository.saveRefreshToken(user.id, newRefreshToken, refreshTokenExpiresAt);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: env.jwt.accessTokenTTL
    };
}

/**
 * Logout by revoking the refresh token.
 * This prevents the token from being used again.
 * 
 * HTTP POST /api/auth/logout
 * 
 * @param {Object} body - { refreshToken }
 * @returns {Promise<Object>} Confirmation message
 */
export async function logout({ refreshToken }) {
    await authRepository.revokeRefreshToken(refreshToken);
    return { message: "Logged out successfully" };
}