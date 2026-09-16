/**
 * src/modules/inventory/inventory.validation.js
 * 
 * Zod schemas for inventory endpoints.
 * 
 * NOTE: The API uses quantityAvailable (DB: quantity_available) and
 * quantityReserved (DB: quantity_reserved). No minimumStock — it comes from products.
 */
import { z } from "zod";

/**
 * POST /api/inventory — Create inventory record.
 */
const createInventorySchema = z.object({
    body: z.object({
        productId: z.number().int().positive("Product ID must be a positive integer"),
        branchId: z.number().int().positive("Branch ID must be a positive integer"),
        quantity: z.number().min(0, "Quantity must be non-negative")
    })
});

/**
 * PUT /api/inventory/:id — Update inventory record.
 */
const updateInventorySchema = z.object({
    body: z.object({
        quantityAvailable: z.number().min(0, "Available quantity must be non-negative").optional(),
        quantityReserved: z.number().min(0, "Reserved quantity must be non-negative").optional()
    }).partial(),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

/**
 * POST /api/inventory/:id/adjust-stock — Adjust stock.
 */
const adjustStockSchema = z.object({
    body: z.object({
        quantity: z.number("Quantity must be a number")
    }),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

export { createInventorySchema, updateInventorySchema, adjustStockSchema };