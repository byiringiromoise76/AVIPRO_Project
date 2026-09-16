/**
 * src/modules/notifications/notification.routes.js
 * 
 * HTTP routes for notifications.
 * All routes require authentication. Users typically only see their OWN notifications.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createNotificationSchema, markAsReadSchema } from "./notification.validation.js";
import { getAllNotifications, getNotificationById, getUserNotifications, getUnreadNotifications, getOrderNotifications, createNotification, markAsRead, markAllAsRead, deleteNotification } from "./notification.controller.js";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications — Get all notifications (ADMIN only)
router.get("/", authorize("ADMIN"), getAllNotifications);

// GET /api/notifications/:id — Get a notification by ID
router.get("/:id", getNotificationById);

// GET /api/notifications/user/:userId — Get all notifications for a user
router.get("/user/:userId", getUserNotifications);

// GET /api/notifications/user/:userId/unread — Get unread notifications for a user
router.get("/user/:userId/unread", getUnreadNotifications);

// GET /api/notifications/order/:orderId — Get notifications for an order
router.get("/order/:orderId", getOrderNotifications);

// POST /api/notifications — Create a notification (ADMIN/system)
router.post("/", authorize("ADMIN"), validate(createNotificationSchema), createNotification);

// PATCH /api/notifications/:id/read — Mark a notification as read
router.patch("/:id/read", validate(markAsReadSchema), markAsRead);

// PATCH /api/notifications/user/:userId/read-all — Mark all user notifications as read
router.patch("/user/:userId/read-all", markAllAsRead);

// DELETE /api/notifications/:id — Delete a notification
router.delete("/:id", deleteNotification);

export default router;