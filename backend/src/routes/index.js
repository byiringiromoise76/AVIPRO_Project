import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import productRoutes from "../modules/products/product.routes.js";
import customerRoutes from "../modules/customers/customer.routes.js";
import orderRoutes from "../modules/orders/order.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import processingRoutes from "../modules/processing/processing.routes.js";
import deliveryRoutes from "../modules/delivery/delivery.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import auditRoutes from "../modules/audit/audit.routes.js";

const router = Router();

// Mount authentication routes
// Example: POST /api/auth/login, POST /api/auth/register
router.use("/auth", authRoutes);

// Mount product routes
// Example: POST /api/products, GET /api/products/:id
router.use("/products", productRoutes);

// Mount customer routes
// Example: POST /api/customers, GET /api/customers/:id
router.use("/customers", customerRoutes);

// Mount order routes
// Example: POST /api/orders, GET /api/orders/:id
router.use("/orders", orderRoutes);

// Mount user routes
// Example: POST /api/users, GET /api/users/:id
router.use("/users", userRoutes);

// Mount inventory routes
// Example: POST /api/inventory, GET /api/inventory/:id
router.use("/inventory", inventoryRoutes);

// Mount processing routes
// Example: GET /api/processing/queue, GET /api/processing/:orderId
router.use("/processing", processingRoutes);

// Mount delivery routes
// Example: POST /api/delivery, GET /api/delivery/:id
router.use("/delivery", deliveryRoutes);

// Mount notification routes
// Example: GET /api/notifications, POST /api/notifications
router.use("/notifications", notificationRoutes);

// Mount audit routes
// Example: GET /api/audit, POST /api/audit
router.use("/audit", auditRoutes);

export default router;