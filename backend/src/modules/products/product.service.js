// src/modules/products/product.service.js
// This file handles business logic for product operations
// It manages product creation, updates, inventory integration, and search functionality

// Import product repository functions for database operations
import * as productRepository from "./product.repository.js";

// Add a new product to the system
// Validates that SKU is unique before creating product
// Used when adding new products to the inventory
export async function addProduct({ name, sku, sellingUnit, price, minimumStock }) {
    // Check if product with this SKU already exists (prevent duplicates)
    const existing = await productRepository.findBySku(sku);
    if (existing) {
        const error = new Error("A product with this SKU already exists");
        error.status = 409; // HTTP 409 Conflict
        throw error;
    }

    // Create product record in database
    const id = await productRepository.create({
        name,        // Product name
        sku,         // Stock Keeping Unit (unique identifier)
        sellingUnit, // Unit of measurement (PIECE, KG, BOX)
        price,       // Unit price
        minimumStock // Minimum stock level for alerts
    });
    // Return the created product with full details
    return productRepository.findById(id);
}

// Get all products from the database
// Returns complete list of all products in the system
export async function getAllProducts() {
    return await productRepository.findAll();
}

// Get product by ID (primary key)
// Used when fetching specific product details
export async function getProductbyId(id) {
    const product = await productRepository.findById(id);
    if (!product) {
        const error = new Error("Product not found");
        error.status = 404; // HTTP 404 Not Found
        throw error;
    }
    return product;
}

// Update product information
// Supports partial updates - only updates fields that are provided
// Used when modifying product details or prices
export async function updateProduct(id, { name, sku, sellingUnit, price, minimumStock }) {
    const existing = await productRepository.findById(id);
    if (!existing) {
        const error = new Error("Product not found");
        error.status = 404; // HTTP 404 Not Found
        throw error;
    }

    // Check if SKU is being changed and if new SKU already exists
    if (sku && sku !== existing.sku) {
        const skuExists = await productRepository.findBySku(sku);
        if (skuExists) {
            const error = new Error("A product with this SKU already exists");
            error.status = 409; // HTTP 409 Conflict
            throw error;
        }
    }

    // Build update data object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (sellingUnit !== undefined) updateData.sellingUnit = sellingUnit;
    if (price !== undefined) updateData.price = price;
    if (minimumStock !== undefined) updateData.minimumStock = minimumStock;

    // Update product in database
    await productRepository.update(id, updateData);
    // Return updated product with full details
    return productRepository.findById(id);
}

// Delete product from the system
// Used when removing products from inventory
export async function deleteProducts(id) {
    const existing = await productRepository.findById(id);
    if (!existing) {
        const error = new Error("Product not found");
        error.status = 404; // HTTP 404 Not Found
        throw error;
    }

    await productRepository.deleteProduct(id);
    return { message: "Product deleted successfully" };
}

// Search products by name
// Used for product lookup functionality
export async function getProductByName(name) {
    return await productRepository.searchByName(name);
}