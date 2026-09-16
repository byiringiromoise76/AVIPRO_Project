// src/modules/audit/audit.controller.js
import * as auditService from "./audit.service.js";

export async function getAuditLogs(req, res, next) {
    try {
        const filters = {
            userId: req.query.userId ? parseInt(req.query.userId) : undefined,
            action: req.query.action,
            entityType: req.query.entityType,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        };
        const auditLogs = await auditService.getAuditLogs(filters);
        return res.status(200).json({ data: auditLogs });
    } catch (error) {
        next(error);
    }
}

export async function getAuditLogById(req, res, next) {
    try {
        const auditLog = await auditService.getAuditLogById(req.params.id);
        return res.status(200).json({ data: auditLog });
    } catch (error) {
        next(error);
    }
}

export async function getUserAuditLogs(req, res, next) {
    try {
        const userId = parseInt(req.params.userId);
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const auditLogs = await auditService.getUserAuditLogs(userId, limit);
        return res.status(200).json({ data: auditLogs });
    } catch (error) {
        next(error);
    }
}

export async function getAuditLogsByAction(req, res, next) {
    try {
        const action = req.params.action;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const auditLogs = await auditService.getAuditLogsByAction(action, limit);
        return res.status(200).json({ data: auditLogs });
    } catch (error) {
        next(error);
    }
}

export async function createAuditLog(req, res, next) {
    try {
        const { userId, action, entityType, entityId, ipAddress, userAgent, metadata } = req.body;
        const auditLog = await auditService.createAuditLog({
            userId,
            action,
            entityType,
            entityId,
            ipAddress,
            userAgent,
            metadata
        });
        return res.status(201).json({ data: auditLog });
    } catch (error) {
        next(error);
    }
}

export async function deleteAuditLog(req, res, next) {
    try {
        const result = await auditService.deleteAuditLog(req.params.id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}

export async function cleanupOldLogs(req, res, next) {
    try {
        const daysToKeep = req.query.days ? parseInt(req.query.days) : 90;
        const result = await auditService.cleanupOldAuditLogs(daysToKeep);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
}