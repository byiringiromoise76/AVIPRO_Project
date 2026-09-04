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

    // Create sample customers
    const customers = [
        {
            name: "John Smith",
            email: "john.smith@example.com",
            phone: "+1-555-0101",
            address: "123 Oak Street, Springfield, IL 62701"
        },
        {
            name: "Jane Doe",
            email: "jane.doe@example.com",
            phone: "+1-555-0102",
            address: "456 Maple Avenue, Springfield, IL 62702"
        },
        {
            name: "Robert Johnson",
            email: "robert.j@example.com",
            phone: "+1-555-0103",
            address: "789 Pine Road, Springfield, IL 62703"
        }
    ];

    for (const customer of customers) {
        try {
            await pool.execute(
                `INSERT INTO customers (name, email, phone, address, is_active)
                 VALUES (?, ?, ?, ?, TRUE)`,
                [customer.name, customer.email, customer.phone, customer.address]
            );
            console.log(`Created customer: ${customer.name}`);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Customer already exists: ${customer.email}`);
            } else {
                throw error;
            }
        }
    }

    // Create inventory for products at branches
    const [products] = await pool.execute("SELECT id FROM products");
    const [branches] = await pool.execute("SELECT id FROM branches");

    for (const product of products) {
        for (const branch of branches) {
            try {
                const quantity = Math.floor(Math.random() * 50) + 10; // Random quantity between 10-60
                await pool.execute(
                    `INSERT INTO inventory (product_id, quantity, branch_id)
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