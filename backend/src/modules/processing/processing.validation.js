import { z } from "zod";

const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, "Note is required").max(500, "Note must be less than 500 characters")
  }),
  params: z.object({
    orderId: z.string().transform((val) => parseInt(val, 10))
  })
});

const transitionSchema = z.object({
  body: z.object({
    comment: z.string().max(255, "Comment must be less than 255 characters").optional()
  }),
  params: z.object({
    orderId: z.string().transform((val) => parseInt(val, 10))
  })
});

export { addNoteSchema, transitionSchema };