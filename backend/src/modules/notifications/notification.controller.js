// src/modules/notifications/notification.controller.js
import * as notificationService from "./notification.service.js";

export async function getAllNotifications(req, res, next) {
    try {
        const notifications = await notificationService.getAllNotifications();
        return res.status(200).json({ data: notifications });
    } catch (error) {
        next(error);
    }
}

export async function getNotificationById(req, res, next) {
    try {
        const notification = await notificationService.getNotificationById(req.params.id);
        return res.status(200).json({ data: notification });
    } catch (error) {
        next(error);
    }
}

export async function getUserNotifications(req, res, next) {
    try {
        const userId = req.params.userId || req.auth?.userId;
        const notifications = await notificationService.getUserNotifications(userId);
        return res.status(200).json({ data: notifications });
    } catch (error) {
        next(error);
    }
}

export async function getUnreadNotifications(req, res, next) {
    try {
        const userId = req.params.userId || req.auth?.userId;
        const notifications = await notificationService.getUnreadNotifications(userId);
        return res.status(200).json({ data: notifications });
    } catch (error) {
        next(error);
    }
}

export async function getOrderNotifications(req, res, next) {
    try {
        const notifications = await notificationService.getOrderNotifications(req.params.orderId);
        return res.status(200).json({ data: notifications });
    } catch (error) {
        next(error);
    }
}

export async function createNotification(req, res, next) {
    try {
        const { userId, orderId, title, message, type } = req.body;
        const notification = await notificationService.createNotification({
            userId,
            orderId,
            title,
            message,
            type
        });
        return res.status(201).json({ data: notification });
    } catch (error) {
        next(error);
    }
}

export async function markAsRead(req, res, next) {
    try {
        const notification = await notificationService.markNotificationAsRead(req.params.id);
        return res.status(200).json({ data: notification });
    } catch (error) {
        next(error);
    }
}

export async function markAllAsRead(req, res, next) {
    try {
        const userId = req.params.userId || req.auth?.userId;
        const result = await notificationService.markAllUserNotificationsAsRead(userId);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}

export async function deleteNotification(req, res, next) {
    try {
        const result = await notificationService.deleteNotification(req.params.id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}