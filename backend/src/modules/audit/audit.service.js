// src/modules/audit/audit.service.js
import * as auditRepository from "./audit.repository.js";

export async function getAuditLogs(filters = {}) {
  const { userId, action, entityType, startDate, endDate, limit } = filters;
  return await auditRepository.findAll({
    userId,
    action,
    entityType,
    startDate,
    endDate,
    limit: limit || 100
  });
}

export async function getAuditLogById(id) {
  const auditLog = await auditRepository.findById(id);
  if (!auditLog) {
    const error = new Error("Audit log not found");
    error.status = 404;
    throw error;
  }
  return auditLog;
}

export async function getUserAuditLogs(userId, limit = 50) {
  return await auditRepository.findByUserId(userId, limit);
}

export async function getAuditLogsByAction(action, limit = 50) {
  return await auditRepository.findByAction(action, limit);
}

export async function createAuditLog({ userId, action, entityType, entityId, ipAddress, userAgent, metadata }) {
  const id = await auditRepository.create({
    userId,
    action,
    entityType,
    entityId,
    ipAddress,
    userAgent,
    metadata
  });
  return await auditRepository.findById(id);
}

export async function deleteAuditLog(id) {
  const existing = await auditRepository.findById(id);
  if (!existing) {
    const error = new Error("Audit log not found");
    error.status = 404;
    throw error;
  }

  await auditRepository.deleteById(id);
  return { message: "Audit log deleted successfully" };
}

export async function cleanupOldAuditLogs(daysToKeep = 90) {
  const affected = await auditRepository.deleteOldLogs(daysToKeep);
  return { message: `Deleted ${affected} audit logs older than ${daysToKeep} days` };
}