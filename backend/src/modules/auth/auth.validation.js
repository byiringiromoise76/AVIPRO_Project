/**
 * src/modules/auth/auth.validation.js
 * 
 * Zod validation schemas for auth endpoints.
 * 
 * WHY validate? Rejects invalid data (wrong types, missing fields, bad formats)
 * before it reaches the database. The validate() middleware runs these schemas.
 * 
 * Example: registering with email="not-an-email" → 400 { errors: { email: ["Invalid email"] } }
 */
import { z } from "zod";

/**
 * Registration schema — validates the POST /api/auth/register body.
 */
const registerSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
        fullName: z.string().min(1, "Full name is required").max(150, "Full name must be less than 150 characters"),
        phone: z.string().max(30, "Phone must be less than 30 characters").optional(),
        branchId: z.number().int().positive("Branch ID must be a positive integer").optional(),
        role: z.enum(["ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"], {
            errorMap: () => ({ message: "Role must be ADMIN, SALES, CUSTOMER_SERVICE, or PROCESSING" })
        }).optional()
    })
});

/**
 * Login schema — validates the POST /api/auth/login body.
 * Login uses email (not username) — the users table has no username column.
 */
const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required")
    })
});

/**
 * Refresh token schema — validates POST /api/auth/refresh and /logout.
 */
const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required")
    })
});

export { registerSchema, loginSchema, refreshTokenSchema };