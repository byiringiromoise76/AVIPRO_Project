// src/middleware/validate.js
/**
 * Request validation middleware using Zod schemas
 * Validates request body, params, and query against a Zod schema
 * 
 * Example usage:
 *   import { validate } from './middleware/validate.js';
 *   import { createProductSchema } from './product.validation.js';
 *   
 *   router.post('/products', validate(createProductSchema), createProduct);
 */

/**
 * WHAT IS THIS MIDDLEWARE FOR? (BEGINNER EXPLANATION)
 * ===================================================
 * Before we trust any data a user sends us, we should CHECK it.
 * For example, if a user is registering, we need to make sure:
 * - "email" is actually an email (not "hello123")
 * - "password" is at least 6 characters
 * - "name" is between 2 and 100 characters
 * 
 * This middleware takes a "Zod schema" (rules) and checks the request data against it.
 * If the data doesn't follow the rules, it returns "400 Bad Request" before
 * the data ever reaches our database.
 * 
 * HOW EXPRESS MIDDLEWARE WORKS:
 * Express runs functions in order: middleware1 -> middleware2 -> route handler.
 * If a middleware calls next(), the request moves to the next step.
 * If a middleware sends a response (like res.status(400).json()), the chain stops.
 */

export function validate(schema) {
    // Return a function that Express knows how to call
    return (req, res, next) => {
        // Validate the request data against the Zod schema rules
        // safeParse (not just parse) means: "Try to validate, but DON'T throw an error on failure"
        // Instead, it returns an object with a "success" field we can check
        const result = schema.safeParse({
            body: req.body,       // Data sent in the request body (e.g. login form)
            params: req.params,   // Data in the URL (e.g. /users/5 -> id "5")
            query: req.query,     // Data in the query string (e.g. ?limit=10)
        });

        // If the data does NOT follow the rules...
        if (!result.success) {
            // Return 400 (Bad Request) with the field errors
            // .flatten().fieldErrors turns Zod's errors into { fieldName: [messages] }
            // Example: { email: ["Invalid email format"], password: ["Too short"] }
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        // If validation passed, let the request continue to the actual route handler
        next();
    };
}