// src/database/seeds/products.seed.js
/**
 * Products seed data
 * Creates sample products for development/testing
 * 
 * Example usage:
 *   import { seedProducts } from './products.seed.js';
 *   await seedProducts();
 * 
 * This creates sample products with different categories and selling units
 */

import { pool } from "../pool.js";

export async function seedProducts() {
    const products = [
        {
            name: "Wireless Mouse",
            sku: "MOU-001",
            selling_unit: "PIECE",
            price: 29.99,
            minimum_stock: 10
        },
        {
            name: "Mechanical Keyboard",
            sku: "KEY-001",
            selling_unit: "PIECE",
            price: 89.99,
            minimum_stock: 5
        },
        {
            name: "USB-C Hub",
            sku: "HUB-001",
            selling_unit: "PIECE",
            price: 49.99,
            minimum_stock: 8
        },
        {
            name: "27-inch Monitor",
            sku: "MON-001",
            selling_unit: "PIECE",
            price: 299.99,
            minimum_stock: 3
        },
        {
            name: "Laptop Stand",
            sku: "STA-001",
            selling_unit: "PIECE",
            price: 39.99,
            minimum_stock: 15
        },
        {
            name: "Webcam HD",
            sku: "CAM-001",
            selling_unit: "PIECE",
            price: 79.99,
            minimum_stock: 6
        },
        {
            name: "Office Chair",
            sku: "CHR-001",
            selling_unit: "PIECE",
            price: 199.99,
            minimum_stock: 4
        },
        {
            name: "Desk Lamp LED",
            sku: "LMP-001",
            selling_unit: "PIECE",
            price: 34.99,
            minimum_stock: 12
        },
        {
            name: "Notebook Pack",
            sku: "NBK-001",
            selling_unit: "BOX",
            price: 14.99,
            minimum_stock: 20
        },
        {
            name: "Pen Set Premium",
            sku: "PEN-001",
            selling_unit: "BOX",
            price: 19.99,
            minimum_stock: 25
        }
    ];

    for (const product of products) {
        try {
            await pool.execute(
                `INSERT INTO products (name, sku, selling_unit, price, minimum_stock, is_active)
                 VALUES (?, ?, ?, ?, ?, TRUE)`,
                [product.name, product.sku, product.selling_unit, product.price, product.minimum_stock]
            );
            console.log(`Created product: ${product.name} (${product.sku})`);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Product already exists: ${product.sku}`);
            } else {
                throw error;
            }
        }
    }
}