// src/database/seeds/seed.js
/**
 * Database seeding script
 * Populates the database with initial development data
 * 
 * Example usage:
 *   Run with: npm run db:seed
 *   This will execute all seed files to populate the database with sample data
 * 
 * Seed files are executed in order:
 *   1. branches.seed.js - Create branch locations
 *   2. staff.seed.js - Create staff users
 *   3. products.seed.js - Create sample products
 *   4. development.seed.js - Create additional development data
 */

import { pool } from "../pool.js";

async function runSeeds() {
    console.log("Starting database seeding...");

    try {
        // Import and run seed files in order
        const { seedBranches } = await import("./branches.seed.js");
        const { seedStaff } = await import("./staff.seed.js");
        const { seedProducts } = await import("./products.seed.js");
        const { seedDevelopmentData } = await import("./development.seed.js");

        console.log("Seeding branches...");
        await seedBranches();

        console.log("Seeding staff...");
        await seedStaff();

        console.log("Seeding products...");
        await seedProducts();

        console.log("Seeding development data...");
        await seedDevelopmentData();

        console.log("Database seeding completed successfully.");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runSeeds();