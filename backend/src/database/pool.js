// src/database/pool.js

/**
 * WHAT IS A CONNECTION POOL? (BEGINNER EXPLANATION)
 * =================================================
 * Normally, to talk to a database you need to:
 * 1. Open a connection (like calling someone)
 * 2. Send a query (like having a conversation)
 * 3. Close the connection (like hanging up)
 * 
 * This is SLOW because opening connections takes time.
 * 
 * A CONNECTION POOL is like a phone bank:
 * - It keeps 10 connections open and ready to use
 * - When you need to query the database, you "borrow" a connection
 * - When you're done, you "return" it (don't close it!)
 * - If all connections are busy, it waits for one to become free
 * 
 * This is MUCH faster than creating a new connection every time.
 * 
 * Example usage in repository files:
 *   import { pool } from '../database/pool.js';
 *   const [rows] = await pool.execute('SELECT * FROM users');
 */

import { env } from "../config/env.js";
import mysql from "mysql2/promise";

// Create the connection pool with our database settings
export const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,    // If all connections are busy, wait instead of failing
    connectionLimit: 10,         // Keep up to 10 connections ready at once
    queueLimit: 0,               // No limit on how many queries can wait in line
    timezone: "Z",               // Use UTC for all timestamps (avoids timezone bugs)
});

/**
 * DATABASE HEALTH CHECK
 * =====================
 * Called once when the server starts to make sure we can reach the database.
 * If this fails, the server won't start (better to know early than crash later).
 * 
 * How it works:
 * - Borrows a connection from the pool
 * - Runs "SELECT 1" (a simple query that always works if DB is up)
 * - Returns the connection to the pool
 */
export async function verifyDatabaseConnection() {
    const connection = await pool.getConnection(); // Borrow a connection
    try {
        await connection.query("SELECT 1"); // Simple test query
    } finally {
        connection.release(); // ALWAYS return the connection, even if an error occurred
    }
}