import { z } from "zod";

const customerBodySchema = z.object({
    fullName: z.string().min(1, "Full name is required").max(150, "Full name must be less than 150 characters"),
    phone: z.string().min(1, "Phone number is required").max(30, "Phone number must be less than 30 characters"),
    address: z.string().min(1, "Address is required").max(255, "Address must be less than 255 characters"),
    businessName: z.string().max(150, "Business name must be less than 150 characters").optional()
});

export const createCustomerSchema = z.object({
    body: customerBodySchema
});

export const updateCustomerSchema = z.object({
    body: customerBodySchema.partial(),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

export const searchCustomerSchema = z.object({
    query: z.object({
        search: z.string().min(1, "Search term is required")
    })
});