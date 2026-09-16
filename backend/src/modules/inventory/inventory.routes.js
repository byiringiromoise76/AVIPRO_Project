/**
 * src/modules/inventory/inventory.routes.js
 * 
 * HTTP routes for inventory operations.
 * Views are available to all authenticated staff; writes are limited.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createInventorySchema, updateInventorySchema, adjustStockSchema } from "./inventory.validation.js";
import { getAllInventory, getInventoryById, getInventoryByBranch, getInventoryByProduct, getLowStockItems, createInventory, updateInventory, adjustStock, deleteInventory } from "./inventory.controller.js";

const router = Router();

// All inventory routes require authentication (any staff role)
router.use(authenticate, authorize("ADMIN", "SALES", "PROCESSING", "CUSTOMER_SERVICE"));

// GET /api/inventory — Get all inventory
router.get("/", getAllInventory);

// GET /api/inventory/:id — Get inventory by ID
router.get("/:id", getInventoryById);

// GET /api/inventory/branch/:branchId — Get inventory for a branch
router.get("/branch/:branchId", getInventoryByBranch);

// GET /api/inventory/product/:productId — Get inventory for a product
router.get("/product/:productId", getInventoryByProduct);

// GET /api/inventory/low-stock/alerts — Get low-stock items
router.get("/low-stock/alerts", getLowStockItems);

// Post routes: write operations require higher permissions.
// We use a separate middleware chain for write routes.
router.post("/", authorize("ADMIN", "PROCESSING"), validate(createInventorySchema), createInventory);

router.put("/:id", authorize("ADMIN", "PROCESSING"), validate(updateInventorySchema), updateInventory);

router.post("/:id/adjust-stock", authorize("ADMIN", "PROCESSING"), validate(adjustStockSchema), adjustStock);

router.delete("/:id", authorize("ADMIN"), deleteInventory);

export default router;