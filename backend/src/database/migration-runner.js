// src/database/migration-runner.js

/**
 * DATABASE MIGRATION RUNNER
 * ========================
 * A migration is a SQL file that changes your database (creates tables, adds columns, etc.)
 * This file reads all .sql files from the migrations/ folder and runs any that haven't been run yet.
 * 
 * WHAT IS A "MIGRATION"?
 * Think of migrations like a to-do list for your database.
 * - Migration 001: "Create the users table"
 * - Migration 002: "Create the products table"
 * - Migration 003: "Add email column to users table"
 * Each migration runs ONCE. We track which ones ran in a "schema_migrations" table.
 * 
 * HOW TO RUN:
 *   npm run db:migrate
 */

import fs from "node:fs";             // fs = File System. Lets us read/write files on the computer.
import path from "node:path";         // path = helps us build file paths that work on Windows, Mac, and Linux.
import { fileURLToPath } from "node:url"; // Needed because ES Modules don't have __dirname by default (see below).
import { pool } from "./pool.js";     // Our database connection pool.

/**
 * WHY DO WE NEED fileURLToPath AND __dirname?
 * 
 * In old JavaScript (CommonJS), there's a special variable called __dirname
 * that gives you the folder where the current file is located.
 * 
 * BUT in modern JavaScript (ES Modules - what this project uses),
 * __dirname does NOT exist. So we have to create it ourselves:
 * 
 * 1. import.meta.url  -> gives us the file URL like "file:///C:/project/src/database/migration-runner.js"
 * 2. fileURLToPath()  -> converts that URL to a normal path like "C:/project/src/database/migration-runner.js"
 * 3. path.dirname()   -> extracts just the folder like "C:/project/src/database"
 * 
 * Now __dirname = "C:/project/src/database" (the folder this file lives in)
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build the full path to the migrations folder
// Example result: "C:/project/src/database/migrations"
const migrationsDir = path.join(__dirname, "migrations");

/**
 * Ensures the schema_migrations table exists for tracking applied migrations
 * This table is used to track which migration files have been executed
 * 
 * Example:
 *   Creates table with columns: id, version, applied_at
 */
async function ensureMigrationsTableExists(connection) {
    // Bootstraps itself the first time it runs, before anything else
    const bootstrapPath = path.join(migrationsDir, "000_create_schema_migrations.sql");
    const sql = fs.readFileSync(bootstrapPath, "utf8");
    await connection.query(sql);
}

/**
 * Retrieves the set of migration versions that have already been applied
 * Returns a Set of filenames that have been executed
 * 
 * Example return: Set(['001_create_users.sql', '002_create_products.sql'])
 */
async function getAppliedVersions(connection) {
    const [rows] = await connection.query("SELECT version FROM schema_migrations");
    return new Set(rows.map((r) => r.version));
}

/**
 * Main migration execution function
 * Runs all pending migrations in alphabetical order
 * 
 * Example workflow:
 *   1. Connect to database
 *   2. Ensure migrations table exists
 *   3. Get list of applied migrations
 *   4. Apply any new migrations
 *   5. Track each applied migration
 */
async function run() {
    const connection = await pool.getConnection();

    try {
        await ensureMigrationsTableExists(connection);
        const applied = await getAppliedVersions(connection);

        // Get all SQL migration files sorted alphabetically
        const files = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith(".sql"))
            .sort();

        // Process each migration file
        for (const file of files) {
            if (applied.has(file)) {
                console.log(`skip:   ${file} (already applied)`);
                continue;
            }

            const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

            console.log(`apply:  ${file}`);
            await connection.query(sql);
            await connection.execute(
                "INSERT INTO schema_migrations (version) VALUES (?)",
                [file]
            );
        }

        console.log("Migrations complete.");
    } finally {
        connection.release();
        await pool.end();
    }
}

// Execute migrations and handle errors
run().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
