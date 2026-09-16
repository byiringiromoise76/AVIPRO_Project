/**
 * src/middleware/errorHandler.js
 * 
 * Centralized error handler for all Express routes.
 * 
 * WHY a central error handler? Instead of writing try/catch error handling
 * in every single controller, any handler can simply call `next(error)` and
 * this ONE function formats the response consistently.
 * 
 * Example in a controller:
 *   try { ... } catch (error) { next(error); }
 * 
 * Error status convention:
 *   error.status = 404  → "Not found"
 *   error.status = 400  → "Bad request"
 *   If no status, treat as an unhandled server error (500).
 */

/**
 * Express error-handling middleware. Must have 4 params (err, req, res, next)
 * so Express recognizes it as an error handler.
 */
export function errorHandler(err, req, res, next) {
    // Log the full error to the console for developers
    console.error("Error:", err.message);

    // Default to 500 (Internal Server Error) when no explicit status is set
    const status = err.status || 500;

    // For 500 errors, hide the internal message from clients (security)
    const message = status === 500 ? "Internal server error" : err.message;

    res.status(status).json({ message });
}