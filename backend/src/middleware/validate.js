/**
 * src/middleware/validate.js
 * 
 * Request validation middleware using Zod schemas.
 * Validates request body, params, and query against a Zod schema.
 * 
 * WHY: Never trust user input! This middleware ensures all incoming data
 * matches expected shapes BEFORE it reaches the database. It prevents:
 * - SQL injection (by ensuring correct types)
 * - Missing required fields
 * - Invalid data formats (bad emails, negative numbers, etc.)
 * 
 * Example usage:
 *   import { validate } from './middleware/validate.js';
 *   import { createProductSchema } from './product.validation.js';
 *   
 *   // POST /api/products with body { name: "Widget", price: 9.99 }
 *   router.post('/products', validate(createProductSchema), createProduct);
 * 
 * Zod schema example:
 *   const createProductSchema = z.object({
 *     body: z.object({
 *       name: z.string().min(1),        // name must be a non-empty string
 *       price: z.number().positive()     // price must be a positive number
 *     })
 *   });
 */

export function validate(schema) {
    return (req, res, next) => {
        // safeParse validates without throwing — returns { success, data, error }
        const result = schema.safeParse({
            body: req.body,       // Data sent in request body (e.g. login form data)
            params: req.params,   // URL parameters (e.g. /users/5 → { id: "5" })
            query: req.query,     // Query string (e.g. ?limit=10&page=1)
        });

        // If validation failed, return 400 with specific error messages
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
                // Example errors: { email: ["Invalid email"], password: ["Too short"] }
            });
        }

        // Merge validated & transformed data back to request.
        // Express 5 makes req.query a getter-only property, so we copy
        // validated keys into the existing object rather than reassigning.
        if (result.data.body) req.body = result.data.body;
        if (result.data.params) Object.assign(req.params, result.data.params);
        if (result.data.query) {
            const q = req.query;
            for (const [key, value] of Object.entries(result.data.query)) {
                q[key] = value;
            }
        }

        next(); // Continue to the next middleware or route handler
    };
}
