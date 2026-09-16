/**
 * src/modules/users/user.controller.js
 * 
 * HTTP handlers for user management.
 * Extracts data from Express requests and delegates to the user service.
 */
import * as userService from "./user.service.js";

/**
 * GET /api/users — Get all users.
 */
export async function getAllUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json({ data: users });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/users/:id — Get a single user by ID.
 */
export async function getUserById(req, res, next) {
    try {
        const user = await userService.getUserById(req.params.id);
        return res.status(200).json({ data: user });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users — Create a new user.
 * 
 * Example body:
 *   { "email": "john@avipro.com", "password": "secret123", "fullName": "John Doe", "branchId": 1, "role": "SALES" }
 */
export async function createUser(req, res, next) {
    try {
        const { email, password, fullName, branchId, role, phone } = req.body;
        const user = await userService.createUser({ email, password, fullName, branchId, role, phone });
        return res.status(201).json({ data: user });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/users/:id — Update user information.
 */
export async function updateUser(req, res, next) {
    try {
        const { email, fullName, branchId, role, phone, isActive } = req.body;
        const user = await userService.updateUser(req.params.id, { email, fullName, branchId, role, phone, isActive });
        return res.status(200).json({ data: user });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/users/:id — Delete a user.
 */
export async function deleteUser(req, res, next) {
    try {
        const result = await userService.deleteUser(req.params.id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users/:id/change-password — Change a user's password.
 * 
 * Example body: { "currentPassword": "old123", "newPassword": "new123" }
 */
export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await userService.changeUserPassword(req.params.id, currentPassword, newPassword);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/users/:id/toggle-active — Toggle user's active status.
 */
export async function toggleActive(req, res, next) {
    try {
        const user = await userService.toggleUserActive(req.params.id);
        return res.status(200).json({ data: user });
    } catch (error) {
        next(error);
    }
}