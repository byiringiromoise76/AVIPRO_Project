// src/middleware/authorize.js
// This file provides authorization middleware for role-based access control
// It checks if the authenticated user has the required role to access a route
// This middleware should be used after authenticate middleware
// Usage: authorize("ADMIN", "SALES") - allows users with ADMIN or SALES roles

// Authorization middleware factory function
// Creates a middleware function that checks user roles
// @param {...string} allowedRoles - The roles that are allowed to access the route
// @returns {Function} Express middleware function
export function authorize(...allowedRoles) {
    // Return the actual middleware function
    return (req, res, next) => {
        // ============================================================
        // AUTHORIZATION (ROLE) ENFORCEMENT — DISABLED (commented out)
        // ============================================================
        // Role checks are commented out so every authenticated request is
        // allowed through. Re-enable this block to restore role-based access.

        // // Check if user information is attached to request (from authenticate middleware)
        // if (!req.auth) {
        //     return res.status(401).json({
        //         message: "Authentication required"
        //     });
        // }
        //
        // // Get the user's role from the request object
        // const userRole = req.auth.role;
        //
        // // Check if the user's role is in the list of allowed roles
        // if (!allowedRoles.includes(userRole)) {
        //     // User's role is not allowed to access this route
        //     return res.status(403).json({
        //         message: "Insufficient permissions",
        //         requiredRoles: allowedRoles,
        //         userRole: userRole
        //     });
        // }

        // User has the required role, continue to the next middleware or route handler
        next();
    };
}