/**
 * src/app.js
 * 
 * Express application setup — the middleware chain and routing.
 * This is where the whole app is assembled.
 * 
 * Order matters in Express:
 *   1. Security middleware (helmet, cors)   → protect requests
 *   2. Body parsing (json, cookie)          → read request data
 *   3. Logging                              → see what's happening
 *   4. Routes                               → handle API calls
 *   5. Error handler                        → catch all errors last
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiters.js";

const app = express();

// Remove X-Powered-By header (reveals the server framework to attackers)
app.disable("x-powered-by");

// Enable trust proxy — needed for correct IP detection behind reverse proxies/load balancers
app.set("trust proxy", 1);

// Security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet());

// CORS: allow the frontend to call this API (credentials for cookies)
app.use(cors({
    origin: env.frontend,
    credentials: true,
}));

// Parse JSON bodies (limit 10mb to allow larger payloads if needed)
app.use(express.json({ limit: "10mb" }));
// Parse cookies from request headers
app.use(cookieParser());

// Request logging (pino for structured logs) + simple method/url log
app.use(pinoHttp());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Global rate limiting — max 500 requests per 15 min per IP
app.use("/api", apiLimiter);

// Health check endpoint (no auth needed)
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "avipro-api" });
});

// Mount all API routes under /api
app.use("/api", apiRoutes);

// 404 catch-all — if no route matched, return a friendly error
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Centralized error handler — all next(error) calls end up here
app.use(errorHandler);

export default app;