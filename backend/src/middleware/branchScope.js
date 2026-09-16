/**
 * src/middleware/branchScope.js
 * 
 * Branch scoping middleware.
 * 
 * WHY: In a multi-branch business, a user at Branch 2 should NOT see/modify
 * records belonging to Branch 1. This middleware attaches the branch filter
 * to the request, and it can be used to restrict data access at the service layer.
 * 
 * IMPORTANT: This is scoping MIDDLEWARE — it sets up req.scope but the actual
 * filtering happens in each repository's WHERE clause (the middleware alone
 * cannot rewrite every SQL query automatically).
 * 
 * Example usage in a repository:
 *   const scope = req.scope; // { branchId: 1 }
 *   if (scope) query += " AND branch_id = ?";
 *
 * Usage:
 *   router.get("/", authenticate, branchScope, getAll);
 * 
 * If the user has no branchId (shouldn't happen), we default to no scoping
 * so ADMIN can see everything.
 */
export function branchScope(req, res, next) {
    // Attach branch scope to the request.
    // Admins could have access to all branches — scope is null for them.
    // Regular staff are scoped to their own branch.
    if (req.auth && req.auth.role !== "ADMIN") {
        req.scope = { branchId: req.auth.branchId };
    } else {
        req.scope = null; // No restriction for admins
    }
    next();
}