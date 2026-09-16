/**
 * src/middleware/authenticate.js
 * 
 * JWT authentication middleware for protected routes.
 * 
 * WHY: Protects routes that should only be accessible to logged-in users.
 * The client sends `Authorization: Bearer <accessToken>` — this middleware
 * verifies the token and attaches the decoded user info to req.auth so
 * controllers can use it (e.g. to know WHO is acting).
 * 
 * Example usage:
 *   import { authenticate } from "./middleware/authenticate.js";
 *   router.get("/orders", authenticate, getOrders);
 * 
 * Example request header:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
// import { verifyAccessToken } from "../utils/tokens.js";

export function authenticate(req, res, next) {
    // ============================================================
    // AUTHENTICATION ENFORCEMENT — DISABLED (commented out)
    // ============================================================
    // The JWT verification below is commented out so the API can be used
    // without a token. A default ADMIN identity is injected instead, keeping
    // every downstream controller working. Re-enable this block to restore
    // real authentication.

    // // Read the Authorization header
    // const authHeader = req.headers.authorization;
    //
    // // If header is missing, the user isn't sending credentials
    // if (!authHeader) {
    //     return res.status(401).json({ message: "Authorization header is required" });
    // }
    //
    // // Header format is "Bearer <token>" — split and take the token part
    // const token = authHeader.split(" ")[1];
    // if (!token) {
    //     return res.status(401).json({ message: "Token is required" });
    // }
    //
    // // Verify the token signature + expiration
    // const decoded = verifyAccessToken(token);
    // if (!decoded) {
    //     return res.status(401).json({ message: "Invalid or expired token" });
    // }
    //
    // // Attach user info to req.auth for subsequent middleware/handlers
    // req.auth = {
    //     userId: decoded.userId,
    //     email: decoded.email,
    //     branchId: decoded.branchId,
    //     role: decoded.role
    // };

    // Default identity used while authentication is disabled.
    req.auth = {
        userId: 1,
        email: "admin@avipro.com",
        branchId: 1,
        role: "ADMIN"
    };

    next(); // Proceed to the next middleware or route handler
}