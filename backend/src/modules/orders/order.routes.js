/**
 * src/modules/orders/order.routes.js
 * 
 * HTTP routes for order operations.
 * - POST (create) is public: supports guest checkout
 * - Views require authentication
 * - Status transitions are restricted by role
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createOrderSchema, transitionOrderSchema } from "./order.validation.js";
import * as orderController from "./order.controller.js";

const router = Router();

// POST /api/orders — Create/log an order (public: guest checkout + staff)
router.post("/", validate(createOrderSchema), orderController.logOrder);

// GET /api/orders — Get all orders (staff only)
router.get("/", authenticate, authorize("ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"), orderController.getAllOrders);

// GET /api/orders/:id — Get order by ID (staff only)
router.get("/:id", authenticate, authorize("ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"), orderController.getOrderById);

// GET /api/orders/:id/items — Get order items (staff only)
router.get("/:id/items", authenticate, authorize("ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"), orderController.getOrderItems);

// GET /api/orders/:id/history — Get order status history (staff only)
router.get("/:id/history", authenticate, authorize("ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"), orderController.getOrderHistory);

// PATCH /api/orders/:id/approve — Customer Service approves the request
router.patch("/:id/approve",
    authenticate, authorize("ADMIN", "CUSTOMER_SERVICE"),
    validate(transitionOrderSchema), orderController.approveOrder);

// PATCH /api/orders/:id/start-processing — Processing Manager starts the work
router.patch("/:id/start-processing",
    authenticate, authorize("ADMIN", "PROCESSING"),
    validate(transitionOrderSchema), orderController.startProcessing);

// PATCH /api/orders/:id/complete-processing — Processing Manager finishes the work
router.patch("/:id/complete-processing",
    authenticate, authorize("ADMIN", "PROCESSING"),
    validate(transitionOrderSchema), orderController.completeProcessing);

// PATCH /api/orders/:id/ready-for-delivery — Customer Service prepares hand-off
router.patch("/:id/ready-for-delivery",
    authenticate, authorize("ADMIN", "CUSTOMER_SERVICE"),
    validate(transitionOrderSchema), orderController.markReadyForDelivery);

// PATCH /api/orders/:id/delivered — Customer Service closes the order
router.patch("/:id/delivered",
    authenticate, authorize("ADMIN", "CUSTOMER_SERVICE"),
    validate(transitionOrderSchema), orderController.markDeliveredAndClose);

export default router;