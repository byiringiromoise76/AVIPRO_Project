/**
 * src/middleware/rateLimiters.js
 * 
 * Rate limiting middleware using express-rate-limit.
 * 
 * WHY: Prevents abuse — a hacker could otherwise hit the login endpoint
 * thousands of times per second (brute-force password guessing) or spam
 * other endpoints. Rate limiting allows a maximum number of requests per
 * time window from the same IP address.
 * 
 * Example usage:
 *   import { authLimiter, apiLimiter } from "./middleware/rateLimiters.js";
 *   router.post("/login", authLimiter, login);
 *   app.use("/api", apiLimiter);
 */
import rateLimit from "express-rate-limit";

/**
 * Strict limiter for authentication endpoints (login/register/refresh).
 * 10 requests per 15 minutes per IP — brute force protection.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                  // Max 10 requests per window
    standardHeaders: true,    // Include rate-limit info in headers
    message: {
        message: "Too many attempts, please try again later",
    },
});

/**
 * General limiter for the whole API.
 * 500 requests per 15 minutes per IP — prevents request flooding.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,                 // Max 500 requests per window
    standardHeaders: true,
    message: {
        message: "Too many requests, please try again later",
    },
});