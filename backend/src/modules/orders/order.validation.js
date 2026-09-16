import { z } from "zod";

const customerSchema = z.object({
    fullName: z.string().min(1, "Customer name is required").max(150, "Customer name must be less than 150 characters"),
    phone: z.string().min(1, "Phone number is required").max(30, "Phone number must be less than 30 characters"),
    address: z.string().min(1, "Address is required").max(255, "Address must be less than 255 characters"),
    businessName: z.string().max(150, "Business name must be less than 150 characters").optional()
});

const orderItemSchema = z.object({
    productId: z.number().int().positive("Product ID must be a positive integer"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    unitPrice: z.number().positive("Unit price must be a positive number")
});

const createOrderSchema = z.object({
    body: z.object({
        customer: customerSchema,
        items: z.array(orderItemSchema).min(1, "At least one item is required"),
        branchId: z.number().int().positive("Branch ID must be a positive integer").optional() // For sales agents
    })
});

const transitionOrderSchema = z.object({
    body: z.object({
        comment: z.string().max(255, "Comment must be less than 255 characters").optional()
    }),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

export { createOrderSchema, transitionOrderSchema };