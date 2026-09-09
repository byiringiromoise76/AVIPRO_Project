// src/database/seeds/development.seed.js
/**
 * Development data seed
 * Creates additional development data like customers, sample orders, and inventory
 * 
 * Example usage:
 *   import { seedDevelopmentData } from './development.seed.js';
 *   await seedDevelopmentData();
 * 
 * This creates sample customers, orders, and inventory for development/testing
 */

import { pool } from "../pool.js";
import bcrypt from 'bcrypt';

export async function seedDevelopmentData() {
    console.log("Seeding development data...");

    // Create inventory for products at branches
    const [products] = await pool.execute("SELECT id FROM products");
    const [branches] = await pool.execute("SELECT id FROM branches");

    for (const product of products) {
        for (const branch of branches) {
            try {
                const quantity = Math.floor(Math.random() * 50) + 10; // Random quantity between 10-60
                await pool.execute(
                    `INSERT INTO inventory (product_id, quantity_available, branch_id)
                     VALUES (?, ?, ?)`,
                    [product.id, quantity, branch.id]
                );
                console.log(`Created inventory: Product ${product.id} at Branch ${branch.id} (${quantity} units)`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`Inventory already exists: Product ${product.id} at Branch ${branch.id}`);
                } else {
                    throw error;
                }
            }
        }
    }

    console.log("Development data seeding completed.");
}