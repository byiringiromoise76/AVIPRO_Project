/**
 * src/utils/audit.js
 * 
 * Audit logging utility — records important user actions in the audit_logs table.
 * 
 * WHY audit logs? For security and accountability: if an admin deletes a user
 * or a price is changed, we want a permanent record of WHO did WHAT and WHEN.
 * The DB table's `metadata` column (JSON) can store extra context.
 * 
 * Example usage:
 *   import { writeAuditLog } from "./utils/audit.js";
 *
 *   await writeAuditLog({
 *     userId: req.auth.userId,
 *     action: "CREATE_ORDER",
 *     entityType: "order",
 *     entityId: orderId,
 *     ipAddress: req.ip,
 *     userAgent: req.get("user-agent"),
 *     metadata: { orderCode: "ORD-123" },
 *   });
 */
import { create } from "../modules/audit/audit.repository.js";

/**
 * Write an audit log entry.
 * All fields are optional (nulls stored) except the action.
 * 
 * @param {Object} data - { userId, action, entityType, entityId, ipAddress, userAgent, metadata }
 * @returns {Promise<number>} The ID of the created audit log
 */
export async function writeAuditLog(data) {
    return await create(data);
}