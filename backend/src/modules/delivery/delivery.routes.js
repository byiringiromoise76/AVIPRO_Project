/**
 * src/modules/delivery/delivery.routes.js
 * 
 * HTTP routes for delivery operations.
 * All routes require authentication (ADMIN or CUSTOMER_SERVICE).
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createDeliverySchema, updateDeliverySchema } from "./delivery.validation.js";
import { getAllDeliveries, getDeliveryById, getDeliveryByOrderId, getDeliveriesByStatus, createDelivery, updateDelivery, deleteDelivery } from "./delivery.controller.js";

const router = Router();

// All delivery routes require authentication with staff roles
router.use(authenticate, authorize("ADMIN", "CUSTOMER_SERVICE"));

// GET /api/delivery — Get all deliveries
router.get("/", getAllDeliveries);

// GET /api/delivery/:id — Get a delivery by ID
router.get("/:id", getDeliveryById);

// GET /api/delivery/order/:orderId — Get delivery by order
router.get("/order/:orderId", getDeliveryByOrderId);

// GET /api/delivery/status/:status — Get deliveries by status
router.get("/status/:status", getDeliveriesByStatus);

// POST /api/delivery — Create a delivery
router.post("/", validate(createDeliverySchema), createDelivery);

// PUT /api/delivery/:id — Update a delivery
router.put("/:id", validate(updateDeliverySchema), updateDelivery);

// DELETE /api/delivery/:id — Delete a delivery (ADMIN only)
router.delete("/:id", authorize("ADMIN"), deleteDelivery);

export default router;