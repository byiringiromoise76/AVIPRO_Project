import { Router } from "express";

// import authRoutes from "../modules/auth/auth.routes.js";
import productRoutes from "../modules/products/product.routes.js";

// Not yet built — uncomment as each module is finished:
// import userRoutes from "../modules/users/user.routes.js";
// import customerRoutes from "../modules/customers/customer.routes.js";
// import inventoryRoutes from "../modules/inventory/inventory.routes.js";
// import orderRoutes from "../modules/orders/order.routes.js";
// import processingRoutes from "../modules/processing/processing.routes.js";
// import deliveryRoutes from "../modules/delivery/delivery.routes.js";
// import notificationRoutes from "../modules/notifications/notification.routes.js";

const router = Router();

// Mount authentication routes
// Example: POST /api/auth/login, POST /api/auth/register
// router.use("/auth", authRoutes);

// Mount product routes
// Example: POST /api/products, GET /api/products/:id
router.use("/products", productRoutes);

// Uncomment these as modules are completed:
// router.use("/users", userRoutes);
// router.use("/customers", customerRoutes);
// router.use("/inventory", inventoryRoutes);
// router.use("/orders", orderRoutes);
// router.use("/processing", processingRoutes);
// router.use("/delivery", deliveryRoutes);
// router.use("/notifications", notificationRoutes);

export default router;