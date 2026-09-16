/**
 * src/modules/audit/audit.routes.js
 * 
 * HTTP routes for audit logs.
 * All routes require authentication — most are ADMIN-only.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createAuditLogSchema, getAuditLogsSchema } from "./audit.validation.js";
import { getAuditLogs, getAuditLogById, getUserAuditLogs, getAuditLogsByAction, createAuditLog, deleteAuditLog, cleanupOldLogs } from "./audit.controller.js";

const router = Router();

// All audit routes require authentication; most are ADMIN-only
router.use(authenticate, authorize("ADMIN"));

// GET /api/audit — Get audit logs with filters
router.get("/", validate(getAuditLogsSchema), getAuditLogs);

// GET /api/audit/:id — Get audit log by ID
router.get("/:id", getAuditLogById);

// GET /api/audit/user/:userId — Get audit logs for a specific user
router.get("/user/:userId", getUserAuditLogs);

// GET /api/audit/action/:action — Get audit logs by action type
router.get("/action/:action", getAuditLogsByAction);

// POST /api/audit — Create an audit log (system/internal use)
router.post("/", validate(createAuditLogSchema), createAuditLog);

// DELETE /api/audit/:id — Delete an audit log
router.delete("/:id", deleteAuditLog);

// DELETE /api/audit/cleanup — Clean up old audit logs (?days=90)
router.delete("/cleanup", cleanupOldLogs);

export default router;