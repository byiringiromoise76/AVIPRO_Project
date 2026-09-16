/**
 * src/utils/tokens.js
 * 
 * JWT (JSON Web Token) utilities for generating and verifying tokens.
 * 
 * WHY JWT? JWTs are stateless tokens that contain user information (userId, role, branch).
 * The server doesn't need to store sessions in memory or database — the token itself
 * carries all the info needed to identify and authorize the user.
 * 
 * Two types of tokens:
 * 1. Access Token (short-lived, e.g. 15 min) — Used for API requests
 * 2. Refresh Token (long-lived, e.g. 7 days) — Used to get new access tokens
 * 
 * Example flow:
 *   1. User logs in → server generates access + refresh tokens
 *   2. User makes API request with access token in Authorization header
 *   3. When access token expires, user sends refresh token to get a new one
 *   4. When user logs out, refresh token is revoked (deleted from DB)
 */
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

// Use the JWT secret from centralized config
const JWT_SECRET = env.jwt.secret;

/**
 * Generate an access token (short-lived).
 * 
 * @param {Object} payload - User data to encode (e.g. { userId, email, branchId, role })
 * @returns {string} Signed JWT string
 * 
 * @example
 *   const token = generateAccessToken({ userId: 1, role: "ADMIN", branchId: 1 });
 *   // Returns: "eyJhbGciOiJIUzI1NiIs..."
 */
export function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: env.jwt.accessTokenTTL });
}

/**
 * Generate a refresh token (long-lived).
 * 
 * @param {Object} payload - User data to encode
 * @returns {string} Signed JWT string
 * 
 * @example
 *   const token = generateRefreshToken({ userId: 1 });
 *   // Returns: "eyJhbGciOiJIUzI1NiIs..." (valid for 7 days)
 */
export function generateRefreshToken(payload) {
    return jwt.sign({ ...payload, jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: `${env.jwt.refreshTokenDays}d` });
}

/**
 * Verify an access token.
 * Used by authenticate middleware to validate tokens on protected routes.
 * 
 * @param {string} token - The JWT access token to verify
 * @returns {Object|null} Decoded payload if valid, null if invalid/expired
 * 
 * @example
 *   const decoded = verifyAccessToken("eyJhbGciOiJIUzI1NiIs...");
 *   if (decoded) {
 *       console.log(decoded.userId); // 1
 *       console.log(decoded.role);   // "ADMIN"
 *   }
 */
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Token is invalid, expired, or malformed
    }
}

/**
 * Verify a refresh token.
 * Used during token refresh to validate the refresh token.
 * 
 * @param {string} token - The JWT refresh token to verify
 * @returns {Object|null} Decoded payload if valid, null if invalid/expired
 */
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Calculate the expiration date for a token.
 * 
 * @param {string} expiresIn - Duration string (e.g. "1h", "7d", "30m")
 * @returns {Date} The expiration date
 * 
 * @example
 *   const expires = getTokenExpiration("7d");
 *   console.log(expires); // Date 7 days from now
 */
export function getTokenExpiration(expiresIn) {
    const now = new Date();
    const expiration = new Date(now.getTime() + parseExpiration(expiresIn));
    return expiration;
}

/**
 * Parse a duration string to milliseconds.
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 * 
 * @param {string} expiresIn - Duration string (e.g. "1h", "7d")
 * @returns {number} Duration in milliseconds
 * 
 * @example
 *   parseExpiration("1h");  // 3600000
 *   parseExpiration("7d");  // 604800000
 *   parseExpiration("30m"); // 1800000
 */
function parseExpiration(expiresIn) {
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
        s: 1000,      // seconds → ms
        m: 60000,     // minutes → ms
        h: 3600000,   // hours → ms
        d: 86400000   // days → ms
    };

    return value * multipliers[unit];
}
