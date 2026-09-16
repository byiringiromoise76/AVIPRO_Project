/**
 * src/config/env.js
 * 
 * Central configuration file that loads environment variables from .env file.
 * All environment variables used across the app are accessed through this object.
 * 
 * WHY: Having a single config file makes it easy to see all env vars at a glance,
 * provides sensible defaults for development, and avoids scattering
 * process.env calls throughout the codebase.
 * 
 * Example usage:
 *   import { env } from "./config/env.js";
 *   console.log(env.port);        // 5000
 *   console.log(env.db.host);     // "localhost"
 *   console.log(env.jwt.secret);  // "your-secret-key..."
 */
import dotenv from "dotenv";

// Load .env file into process.env
dotenv.config();

export const env = {
    port: process.env.PORT || 3000,
    frontend: process.env.FRONTEND_URL || "http://localhost:3000",

    // Database configuration for MySQL connection pool
    db: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        name: process.env.DB_NAME || "avipro_db",
    },

    // JWT authentication configuration
    // These secrets MUST be changed in production for security
    jwt: {
        secret: process.env.JWT_ACCESS_SECRET || "your-secret-key-change-in-production",
        issuer: process.env.JWT_ISSUER || "avipro-api",
        audience: process.env.JWT_AUDIENCE || "avipro-dashboard",
        accessTokenTTL: process.env.ACCESS_TOKEN_TTL || "15m",
        refreshTokenDays: parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 7,
    },
};
