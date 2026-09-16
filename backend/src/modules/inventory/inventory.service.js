/**
 * src/modules/inventory/inventory.service.js
 * 
 * Business logic for inventory management.
 * Tracks stock levels across branches, provides low-stock alerts.
 * 
 * NOTE: Uses quantityAvailable (DB column: quantity_available) and
 * minimumStock comes from the products table (not inventory).
 */
import * as inventoryRepository from "./inventory.repository.js";

/**
 * Get all inventory records.
 * 
 * @returns {Promise<Array>} All inventory
 */
export async function getAllInventory() {
    return await inventoryRepository.findAll();
}

/**
 * Get one inventory record by ID, or throw 404.
 * 
 * @param {number} id - Record ID
 * @returns {Promise<Object>} Inventory record
 */
export async function getInventoryById(id) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
        const error = new Error("Inventory record not found");
        error.status = 404;
        throw error;
    }
    return inventory;
}

/**
 * Get inventory for a branch.
 * 
 * @param {number} branchId - Branch ID
 * @returns {Promise<Array>} Branch inventory
 */
export async function getInventoryByBranch(branchId) {
    return await inventoryRepository.findByBranch(branchId);
}

/**
 * Get inventory for a product (across all branches).
 * 
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Product inventory
 */
export async function getInventoryByProduct(productId) {
    return await inventoryRepository.findByProduct(productId);
}

/**
 * Get low-stock items for a branch (or all branches).
 * 
 * @param {number|null} branchId - Optional branch filter
 * @returns {Promise<Array>} Low-stock records
 */
export async function getLowStockItems(branchId) {
    return await inventoryRepository.getLowStockItems(branchId);
}

/**
 * Create inventory for a product at a branch.
 * Prevents duplicates (unique product+branch constraint).
 * 
 * @param {Object} data - { productId, branchId, quantity }
 * @returns {Promise<Object>} Created record
 */
export async function createInventory({ productId, branchId, quantity }) {
    // A product can only have ONE stock record per branch
    const existing = await inventoryRepository.findByProductAndBranch(productId, branchId);
    if (existing) {
        const error = new Error("Inventory record already exists for this product and branch");
        error.status = 409;
        throw error;
    }

    const id = await inventoryRepository.create({ productId, branchId, quantity });
    return await inventoryRepository.findById(id);
}

/**
 * Update inventory — partial update of available or reserved quantities.
 * 
 * @param {number} id - Record ID
 * @param {Object} data - { quantityAvailable, quantityReserved }
 * @returns {Promise<Object>} Updated record
 */
export async function updateInventory(id, { quantityAvailable, quantityReserved }) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
        const error = new Error("Inventory record not found");
        error.status = 404;
        throw error;
    }

    const updateData = {};
    if (quantityAvailable !== undefined) updateData.quantityAvailable = quantityAvailable;
    if (quantityReserved !== undefined) updateData.quantityReserved = quantityReserved;

    await inventoryRepository.update(id, updateData);
    return await inventoryRepository.findById(id);
}

/**
 * Adjust stock (add or remove). Prevents negative quantities.
 * 
 * @param {number} id - Record ID
 * @param {number} quantityChange - Positive to add, negative to remove
 * @returns {Promise<Object>} Updated record
 */
export async function adjustInventoryStock(id, quantityChange) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
        const error = new Error("Inventory record not found");
        error.status = 404;
        throw error;
    }

    // Don't allow negative stock (would be a business error)
    const newQuantity = existing.quantity_available + quantityChange;
    if (newQuantity < 0) {
        const error = new Error("Insufficient stock for this adjustment");
        error.status = 400;
        throw error;
    }

    await inventoryRepository.adjustStock(id, quantityChange);
    return await inventoryRepository.findById(id);
}

/**
 * Delete inventory record.
 * 
 * @param {number} id - Record ID
 * @returns {Promise<Object>} Confirmation message
 */
export async function deleteInventory(id) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
        const error = new Error("Inventory record not found");
        error.status = 404;
        throw error;
    }

    await inventoryRepository.deleteById(id);
    return { message: "Inventory record deleted successfully" };
}