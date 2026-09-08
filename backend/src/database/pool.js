// src/database/pool.js



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

export async function verifyDatabaseConnection() {
    const connection = await pool.getConnection(); // Borrow a connection
    try {
        await connection.query("SELECT 1"); // Simple test query
    } finally {
        connection.release(); // ALWAYS return the connection, even if an error occurred
    }
}