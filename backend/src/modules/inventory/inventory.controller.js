/**
 * src/modules/inventory/inventory.controller.js
 * 
 * HTTP handlers for inventory operations.
 */
import * as inventoryService from "./inventory.service.js";

/**
 * GET /api/inventory — Get all inventory.
 */
export async function getAllInventory(req, res, next) {
    try {
        const inventory = await inventoryService.getAllInventory();
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/inventory/:id — Get one inventory record.
 */
export async function getInventoryById(req, res, next) {
    try {
        const inventory = await inventoryService.getInventoryById(req.params.id);
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/inventory/branch/:branchId — Get inventory for a branch.
 */
export async function getInventoryByBranch(req, res, next) {
    try {
        const inventory = await inventoryService.getInventoryByBranch(req.params.branchId);
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/inventory/product/:productId — Get inventory for a product.
 */
export async function getInventoryByProduct(req, res, next) {
    try {
        const inventory = await inventoryService.getInventoryByProduct(req.params.productId);
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/inventory/low-stock/alerts — Get low-stock items (optional ?branchId=1).
 */
export async function getLowStockItems(req, res, next) {
    try {
        const branchId = req.query.branchId ? parseInt(req.query.branchId) : null;
        const inventory = await inventoryService.getLowStockItems(branchId);
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/inventory — Create inventory record.
 * 
 * Example body: { "productId": 1, "branchId": 1, "quantity": 50 }
 */
export async function createInventory(req, res, next) {
    try {
        const { productId, branchId, quantity } = req.body;
        const inventory = await inventoryService.createInventory({ productId, branchId, quantity });
        return res.status(201).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/inventory/:id — Update inventory quantities.
 */
export async function updateInventory(req, res, next) {
    try {
        const { quantityAvailable, quantityReserved } = req.body;
        const inventory = await inventoryService.updateInventory(req.params.id, {
            quantityAvailable,
            quantityReserved
        });
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/inventory/:id/adjust-stock — Adjust stock quantity.
 * 
 * Example body: { "quantity": -5 } or { "quantity": 20 }
 */
export async function adjustStock(req, res, next) {
    try {
        const { quantity } = req.body;
        const inventory = await inventoryService.adjustInventoryStock(req.params.id, quantity);
        return res.status(200).json({ data: inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/inventory/:id — Delete inventory record.
 */
export async function deleteInventory(req, res, next) {
    try {
        const result = await inventoryService.deleteInventory(req.params.id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}