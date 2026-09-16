/**
 * src/utils/asyncHandler.js
 * 
 * Wraps async route handlers so thrown errors are automatically passed
 * to the Express error-handling middleware.
 * 
 * WHY: In Express 5, async route handlers that throw are NOT automatically
 * forwarded to the error middleware. Without this wrapper (or try/catch in
 * every controller), a database error would crash the request silently.
 * 
 * Example usage (replaces manual try/catch):
 *   // BEFORE:
 *   export async function getUsers(req, res, next) {
 *       try { const users = await service.getAll(); res.json({ data: users }); }
 *       catch (error) { next(error); }
 *   }
 *
 *   // AFTER (simpler!):
 *   export const getUsers = asyncHandler(async (req, res) => {
 *       const users = await service.getAll();
 *       res.json({ data: users });
 *   });
 *
 * @param {Function} fn - An async Express route handler
 * @returns {Function} Wrapped handler that catches errors and calls next(error)
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        // If the promise rejects, next(error) forwards it to the error handler.
        // This is what makes the try/catch unnecessary.
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}