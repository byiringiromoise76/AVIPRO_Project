import { z } from "zod";

const createAuditLogSchema = z.object({
  body: z.object({
    userId: z.number().int().positive("User ID must be a positive integer").optional(),
    action: z.string().min(1, "Action is required").max(100, "Action must be less than 100 characters"),
    entityType: z.string().max(100, "Entity type must be less than 100 characters").optional(),
    entityId: z.number().int().positive("Entity ID must be a positive integer").optional(),
    ipAddress: z.string().max(45, "IP address must be less than 45 characters").optional(),
    userAgent: z.string().max(500, "User agent must be less than 500 characters").optional(),
    metadata: z.record(z.any()).optional()
  })
});

const getAuditLogsSchema = z.object({
  query: z.object({
    userId: z.string().transform((val) => parseInt(val, 10)).optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional()
  })
});

export { createAuditLogSchema, getAuditLogsSchema };