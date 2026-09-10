import { z } from "zod";

const productBodySchema = z.object({
    name: z.string().min(1, "Product name is required").max(150, "Product name must be less than 150 characters"),
    sku: z.string().min(1, "SKU is required").max(80, "SKU must be less than 80 characters"),
    sellingUnit: z.enum(["PIECE", "KG", "BOX"], {
        errorMap: () => ({ message: "Selling unit must be PIECE, KG, or BOX" })
    }),
    price: z.number().positive("Price must be a positive number"),
    minimumStock: z.number().int().min(0, "Minimum stock must be a non-negative integer").default(0)
});

export const createProductSchema = z.object({
    body: productBodySchema
});

export const updateProductSchema = z.object({
    body: productBodySchema.partial(),
    params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
    })
});

export const searchProductSchema = z.object({
    query: z.object({
        name: z.string().min(1, "Search term is required")
    })
});