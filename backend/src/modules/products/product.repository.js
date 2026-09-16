// src/modules/products/product.repository.js
// This file handles all database operations for products
// It provides the data access layer for the product service

// Import database connection pool for executing SQL queries
import { pool } from "../../database/pool.js"

// Get all products from the database
// Returns complete list ordered by creation date (newest first)
export async function findAll() {
    const [rows] = await pool.execute(
        "SELECT id, name, sku, selling_unit, price, minimum_stock, created_at, updated_at FROM products ORDER BY created_at DESC"
    );
    return rows; // Return all products
}

// Find product by ID (primary key)
// Used when fetching specific product details
export async function findById(id) {
    const [rows] = await pool.execute(
        "SELECT id, name, sku, selling_unit, price, minimum_stock, created_at, updated_at FROM products WHERE id = ? LIMIT 1",
        [id]
    );
    return rows[0] || null; // Return product or null if not found
}

// Find product by SKU (Stock Keeping Unit)
// SKU is the unique identifier for products
export async function findBySku(sku) {
    const [rows] = await pool.execute(
        "SELECT id FROM products WHERE sku = ? LIMIT 1",
        [sku]
    );
    return rows[0] || null; // Return product or null if not found
}

// Create a new product record in the database
// Used when adding new products to the inventory
export async function create({ name, sku, sellingUnit, price, minimumStock }) {
    const [result] = await pool.execute(
        `
    INSERT INTO products (name, sku, selling_unit, price, minimum_stock)
    VALUES (?, ?, ?, ?, ?)
    `,
        [name, sku, sellingUnit || null, price, minimumStock ?? 0] // Handle optional fields
    );
    return result.insertId; // Return the ID of the newly created product
}

// Update product information in the database
// Supports partial updates - only updates fields that are provided
export async function update(id, { name, sku, sellingUnit, price, minimumStock }) {
    const fields = []; // Array to store SQL field updates
    const values = []; // Array to store corresponding values

    // Build dynamic SQL based on which fields are provided
    if (name !== undefined) {
        fields.push('name = ?');
        values.push(name);
    }
    if (sku !== undefined) {
        fields.push('sku = ?');
        values.push(sku);
    }
    if (sellingUnit !== undefined) {
        fields.push('selling_unit = ?');
        values.push(sellingUnit);
    }
    if (price !== undefined) {
        fields.push('price = ?');
        values.push(price);
    }
    if (minimumStock !== undefined) {
        fields.push('minimum_stock = ?');
        values.push(minimumStock);
    }

    // If no fields to update, return false
    if (fields.length === 0) {
        return false; // No fields to update
    }

    // Add timestamp update and ID parameter
    fields.push('updated_at = CURRENT_TIMESTAMP(3)');
    values.push(id);

    // Execute the dynamic update query
    const [result] = await pool.execute(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0; // Return true if update was successful
}

// Delete product from the database
// Used when removing products from inventory
export async function deleteProduct(id) {
    const [result] = await pool.execute(
        "DELETE FROM products WHERE id = ?",
        [id]
    );
    return result.affectedRows > 0; // Return true if deletion was successful
}

// Search products by name
// Used for product lookup functionality
export async function searchByName(name) {
    const [rows] = await pool.execute(
        `
    SELECT id, name, sku, selling_unit, price, minimum_stock, created_at, updated_at
    FROM products
    WHERE name LIKE ?
    ORDER BY created_at DESC
    `,
        [`%${name}%`] // Search with wildcard for partial matches
    );
    return rows; // Return matching products
}