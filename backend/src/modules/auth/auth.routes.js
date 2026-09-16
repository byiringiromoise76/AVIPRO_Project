// src/modules/auth/auth.routes.js
// This file defines the HTTP routes for authentication operations
// It connects HTTP endpoints to the authentication controller functions
// All authentication routes are mounted under /api/auth

// Import Express Router for defining routes
import { Router } from "express";
// Import validation middleware for request validation
import { validate } from "../../middleware/validate.js";
// Import validation schemas for authentication operations
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation.js";
// Import authentication controller functions
import { register, login, refreshToken, logout } from "./auth.controller.js";

// Create a new Express router instance
const router = Router();

// Register new user endpoint
// HTTP POST /api/auth/register
// Creates a new user account with email and password
router.post(
    "/register",
    validate(registerSchema), // Validate request body against register schema
    register // Call register controller function
);

// Login user endpoint
// HTTP POST /api/auth/login
// Authenticates user credentials and issues JWT tokens
router.post(
    "/login",
    validate(loginSchema), // Validate request body against login schema
    login // Call login controller function
);

// Refresh access token endpoint
// HTTP POST /api/auth/refresh
// Uses refresh token to get a new access token without re-authenticating
router.post(
    "/refresh",
    validate(refreshTokenSchema), // Validate request body against refresh token schema
    refreshToken // Call refreshToken controller function
);

// Logout user endpoint
// HTTP POST /api/auth/logout
// Revokes the refresh token to invalidate the user's session
router.post(
    "/logout",
    validate(refreshTokenSchema), // Validate request body against refresh token schema
    logout // Call logout controller function
);

// Export the router to be mounted in the main application
export default router;