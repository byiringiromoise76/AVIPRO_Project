import { z } from "zod";

const createNotificationSchema = z.object({
  body: z.object({
    userId: z.number().int().positive("User ID must be a positive integer"),
    orderId: z.number().int().positive("Order ID must be a positive integer").optional(),
    title: z.string().min(1, "Title is required").max(150, "Title must be less than 150 characters"),
    message: z.string().min(1, "Message is required").max(500, "Message must be less than 500 characters"),
    type: z.enum(["ORDER_HANDOFF", "PROCESSING_COMPLETE", "DELIVERY_UPDATE", "SYSTEM"], {
      errorMap: () => ({ message: "Type must be ORDER_HANDOFF, PROCESSING_COMPLETE, DELIVERY_UPDATE, or SYSTEM" })
    }).optional()
  })
});

const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  })
});

export { createNotificationSchema, markAsReadSchema };