/**
 * src/modules/users/user.service.js
 * 
 * Business logic for user management.
 * Handles user creation, updates, deletion, password changes, and activation.
 * 
 * NOTE: Users are identified by email (no username column in the DB).
 */
import * as userRepository from "./user.repository.js";

/**
 * Get all users.
 * 
 * @returns {Promise<Array>} All users
 */
export async function getAllUsers() {
    return await userRepository.findAll();
}

/**
 * Get a single user by ID, or throw 404 if not found.
 * 
 * @param {number} id - User ID
 * @returns {Promise<Object>} User record
 * @throws {Error} 404 if user doesn't exist
 */
export async function getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }
    return user;
}

/**
 * Create a new user. Validates email uniqueness first.
 * 
 * @param {Object} data - { email, password, fullName, branchId, role, phone }
 * @returns {Promise<Object>} Created user
 */
export async function createUser({ email, password, fullName, branchId, role, phone }) {
    // Prevent duplicate email accounts
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        const error = new Error("Email already exists");
        error.status = 409;
        throw error;
    }

    const userId = await userRepository.create({ email, password, fullName, branchId, role, phone });
    return await userRepository.findById(userId);
}

/**
 * Update user information — partial update, only provided fields are changed.
 * Also validates that a changed email doesn't already exist.
 * 
 * @param {number} id - User ID
 * @param {Object} data - { email, fullName, branchId, role, phone, isActive }
 * @returns {Promise<Object>} Updated user
 */
export async function updateUser(id, { email, fullName, branchId, role, phone, isActive }) {
    const existing = await userRepository.findById(id);
    if (!existing) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    // Check email uniqueness when email is being changed
    if (email && email !== existing.email) {
        const emailExists = await userRepository.findByEmail(email);
        if (emailExists) {
            const error = new Error("Email already exists");
            error.status = 409;
            throw error;
        }
    }

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    await userRepository.update(id, updateData);
    return await userRepository.findById(id);
}

/**
 * Delete a user.
 * 
 * @param {number} id - User ID
 * @returns {Promise<Object>} Confirmation message
 */
export async function deleteUser(id) {
    const existing = await userRepository.findById(id);
    if (!existing) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    await userRepository.deleteById(id);
    return { message: "User deleted successfully" };
}

/**
 * Change a user's password. Requires the current password for verification.
 * 
 * @param {number} id - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Confirmation message
 */
export async function changeUserPassword(id, currentPassword, newPassword) {
    const existing = await userRepository.findById(id);
    if (!existing) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    const success = await userRepository.changePassword(id, currentPassword, newPassword);
    if (!success) {
        const error = new Error("Current password is incorrect");
        error.status = 400;
        throw error;
    }

    return { message: "Password changed successfully" };
}

/**
 * Toggle a user's active status (activate/deactivate).
 * 
 * @param {number} id - User ID
 * @returns {Promise<Object>} Updated user with new active status
 */
export async function toggleUserActive(id) {
    const existing = await userRepository.findById(id);
    if (!existing) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    await userRepository.toggleActive(id);
    return await userRepository.findById(id);
}