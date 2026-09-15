// src/modules/orders/order.routes.js
import { Router } from "express";
// import { authenticate } from "../../middleware/authenticate.js";
// import { authorize } from "../../middleware/authorize.js";
import * as orderController from "./order.controller.js";

const router = Router();

// Get all orders
router.get("/",
      // authorize("ADMIN", "SALES", "CUSTOMER_SERVICE"),
      orderController.getAllOrders);

// Customer Service / Sales logs a request that came in outside the system.
router.post("/",
      // authorize("ADMIN", "SALES", "CUSTOMER_SERVICE"),
      orderController.logOrder);

// Customer Service Manager approves the request.
router.patch("/:id/approve",
      // authorize("ADMIN", "CUSTOMER_SERVICE"),
      orderController.approveOrder);

// Processing Manager works the order.
router.patch("/:id/start-processing",
      // authorize("ADMIN", "PROCESSING"),
      orderController.startProcessing);
router.patch("/:id/complete-processing",
      // authorize("ADMIN", "PROCESSING"),
      orderController.completeProcessing);

// Customer Service Manager closes the loop.
router.patch("/:id/ready-for-delivery",
      // authorize("ADMIN", "CUSTOMER_SERVICE"),
      orderController.markReadyForDelivery);
router.patch("/:id/delivered",
      // authorize("ADMIN", "CUSTOMER_SERVICE"),
      orderController.markDeliveredAndClose);

export default router;