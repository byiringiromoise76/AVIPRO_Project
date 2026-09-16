/**
 * src/modules/auth/auth.controller.js
 * 
 * HTTP handlers for authentication endpoints.
 * Controllers receive Express requests, extract data, call services,
 * and format the HTTP response. They should NOT contain business logic.
 */
import * as authService from "./auth.service.js";

/**
 * Register a new user.
 * HTTP POST /api/auth/register
 * 
 * Example request body:
 *   { "email": "new@avipro.com", "password": "secret123", "fullName": "John Doe", "branchId": 1, "role": "SALES" }
 */
export async function register(req, res, next) {
    try {
        const { email, password, fullName, phone, branchId, role } = req.body;
        const user = await authService.register({ email, password, fullName, phone, branchId, role });
        return res.status(201).json({ data: user });
    } catch (error) {
        next(error); // Pass to centralized error handler
    }
}

/**
 * Login a user and issue JWT tokens.
 * HTTP POST /api/auth/login
 * 
 * Example request body:
 *   { "email": "admin@avipro.com", "password": "password123" }
 * 
 * Example response:
 *   { "data": { "user": { ... }, "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": "15m" } }
 */
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a new access token using a refresh token.
 * HTTP POST /api/auth/refresh
 * 
 * Example request body:
 *   { "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
 */
export async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken({ refreshToken });
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * Logout by revoking the refresh token.
 * HTTP POST /api/auth/logout
 */
export async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.logout({ refreshToken });
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}