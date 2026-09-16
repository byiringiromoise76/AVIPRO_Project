// src/modules/notifications/notification.service.js
// This file handles business logic for notification management operations
// It manages user notifications for order events, processing updates, and delivery status
// Notifications keep users informed about important system events

// Import notification repository functions for database operations
import * as notificationRepository from "./notification.repository.js";

// Get all notifications from the database
// Returns complete list of all notifications in the system
// Used by admins to view all system notifications
export async function getAllNotifications() {
    return await notificationRepository.findAll();
}

// Get notification by ID (primary key)
// Used when fetching specific notification details
export async function getNotificationById(id) {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
        const error = new Error("Notification not found");
        error.status = 404; // HTTP 404 Not Found
        throw error;
    }
    return notification;
}

// Get all notifications for a specific user
// Returns all notifications addressed to a particular user
// Used by users to view their notification history
export async function getUserNotifications(userId) {
    return await notificationRepository.findByUserId(userId);
}

// Get unread notifications for a specific user
// Returns only notifications that haven't been read yet
// Used to show notification badges and alerts
export async function getUnreadNotifications(userId) {
    return await notificationRepository.findUnreadByUserId(userId);
}

// Get all notifications for a specific order
// Returns all notifications related to a particular order
// Used to track notification history for an order
export async function getOrderNotifications(orderId) {
    return await notificationRepository.findByOrderId(orderId);
}

// Create a new notification
// Used throughout the system to notify users of important events
// Notification types include: ORDER_HANDOFF, PROCESSING_COMPLETE, READY_FOR_DELIVERY, etc.
export async function createNotification({ userId, orderId, title, message, type }) {
    // Create notification record in database
    const id = await notificationRepository.create({
        userId,   // User to receive the notification
        orderId,  // Related order (optional)
        title,    // Notification title
        message,  // Notification message content
        type      // Notification type for categorization
    });
    // Return the created notification with full details
    return await notificationRepository.findById(id);
}

// Mark a specific notification as read
// Used when a user views a notification
export async function markNotificationAsRead(id) {
    const existing = await notificationRepository.findById(id);
    if (!existing) {
        const error = new Error("Notification not found");
        error.status = 404; // HTTP 404 Not Found
        throw error;
    }

    // Mark notification as read in database
    await notificationRepository.markAsRead(id);
    // Return updated notification with read status
    return await notificationRepository.findById(id);
}

// Mark all notifications as read for a specific user
// Used when a user clears all their notifications
export async function markAllUserNotificationsAsRead(userId) {
    // Mark all unread notifications for this user as read
    const affected = await notificationRepository.markAllAsReadForUser(userId);
    // Return count of affected notifications
    return { message: `Marked ${affected} notifications as read` };
}

// Delete a notification
// Used when a user wants to remove a notification
export async function deleteNotification(id) {
    const existing = await notificationRepository.findById(id);
    if (!existing) {
        const error = new Error("Notification not found");
        error.status = 404; // HTTP 404 Not Found
        throw error;
    }

    await notificationRepository.deleteById(id);
    return { message: "Notification deleted successfully" };
}