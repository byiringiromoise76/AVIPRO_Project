/**
 * src/modules/users/user.validation.js
 * 
 * Zod schemas for user management endpoints.
 * 
 * NOTE: No username field — users are identified by email in this system.
 */
import { z } from "zod";

const validRoles = ["ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"];
const roleError = { errorMap: () => ({ message: "Role must be ADMIN, SALES, CUSTOMER_SERVICE, or PROCESSING" }) };

/**
 * POST /api/users — Create user body schema.
 */
const createUserSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
        fullName: z.string().min(1, "Full name is required").max(150, "Full name must be less than 150 characters"),
        branchId: z.number().int().positive("Branch ID must be a positive integer"),
        role: z.enum(validRoles, roleError),
        phone: z.string().max(30, "Phone must be less than 30 characters").optional()
    })
});

/**
 * PUT /api/users/:id — Update user body schema (all fields optional).
 */
const updateUserSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format").optional(),
        fullName: z.string().min(1, "Full name is required").max(150, "Full name must be less than 150 characters").optional(),
        branchId: z.number().int().positive("Branch ID must be a positive integer").optional(),
        role: z.enum(validRoles, roleError).optional(),
        phone: z.string().max(30, "Phone must be less than 30 characters").optional(),
        isActive: z.boolean().optional()
    }).partial(),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

/**
 * POST /api/users/:id/change-password — Change password body schema.
 */
const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters").max(100, "New password must be less than 100 characters")
    }),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

export { createUserSchema, updateUserSchema, changePasswordSchema };