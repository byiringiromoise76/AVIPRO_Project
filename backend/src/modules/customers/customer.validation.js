/**
 * src/modules/customers/customer.validation.js
 * 
 * Zod schemas for customer endpoints.
 * 
 * NOTE: No email field — customers don't have an email column in the DB.
 * They are identified by phone + branch.
 */
import { z } from "zod";

const customerBodySchema = z.object({
    fullName: z.string().min(1, "Full name is required").max(150, "Full name must be less than 150 characters"),
    phone: z.string().min(1, "Phone number is required").max(30, "Phone number must be less than 30 characters"),
    address: z.string().min(1, "Address is required").max(255, "Address must be less than 255 characters"),
    businessName: z.string().max(150, "Business name must be less than 150 characters").optional()
});

/**
 * POST /api/customers — Create customer body schema.
 */
export const createCustomerSchema = z.object({
    body: customerBodySchema
});

/**
 * PUT /api/customers/:id — Update customer schema (all fields optional).
 */
export const updateCustomerSchema = z.object({
    body: customerBodySchema.partial(),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

/**
 * GET /api/customers/search?search=term — Query schema.
 */
export const searchCustomerSchema = z.object({
    query: z.object({
        search: z.string().min(1, "Search term is required")
    })
});