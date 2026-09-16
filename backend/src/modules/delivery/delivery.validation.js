/**
 * src/modules/delivery/delivery.validation.js
 * 
 * Zod schemas for delivery endpoints.
 * 
 * NOTE: Status values must match the DB enum: PENDING, DISPATCHED, DELIVERED.
 * Fields: deliveryAddress, deliveryPersonId, scheduledAt, notes.
 */
import { z } from "zod";

/**
 * POST /api/delivery — Create delivery body schema.
 */
const createDeliverySchema = z.object({
    body: z.object({
        orderId: z.number().int().positive("Order ID must be a positive integer"),
        deliveryAddress: z.string().min(1, "Delivery address is required").max(255, "Delivery address must be less than 255 characters"),
        deliveryPersonId: z.number().int().positive("Delivery person ID must be a positive integer").optional(),
        scheduledAt: z.string().optional(),
        notes: z.string().max(500, "Notes must be less than 500 characters").optional()
    })
});

/**
 * PUT /api/delivery/:id — Update delivery schema (all fields optional).
 */
const updateDeliverySchema = z.object({
    body: z.object({
        deliveryAddress: z.string().min(1, "Delivery address is required").max(255, "Delivery address must be less than 255 characters").optional(),
        deliveryPersonId: z.number().int().positive("Delivery person ID must be a positive integer").optional(),
        scheduledAt: z.string().optional(),
        notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
        status: z.enum(["PENDING", "DISPATCHED", "DELIVERED"], {
            errorMap: () => ({ message: "Status must be PENDING, DISPATCHED, or DELIVERED" })
        }).optional()
    }).partial(),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

export { createDeliverySchema, updateDeliverySchema };