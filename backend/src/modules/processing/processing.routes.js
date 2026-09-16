/**
 * src/modules/processing/processing.routes.js
 * 
 * HTTP routes for the processing work queue.
 * Viewable by staff; transitions restricted to ADMIN/PROCESSING.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { addNoteSchema, transitionSchema } from "./processing.validation.js";
import * as processingController from "./processing.controller.js";

const router = Router();

// All processing routes require authentication
router.use(authenticate, authorize("ADMIN", "PROCESSING", "CUSTOMER_SERVICE"));

// GET /api/processing — Processing Manager's work queue
router.get("/", processingController.listQueue);

// GET /api/processing/:orderId — Detail view of one order's processing record
router.get("/:orderId", processingController.getDetail);

// PATCH /api/processing/:orderId/notes — Add a processing note
router.patch("/:orderId/notes", validate(addNoteSchema), processingController.addNote);

// PATCH /api/processing/:orderId/start — Start processing (ADMIN/PROCESSING only)
router.patch("/:orderId/start",
    authorize("ADMIN", "PROCESSING"),
    validate(transitionSchema), processingController.start);

// PATCH /api/processing/:orderId/complete — Complete processing (ADMIN/PROCESSING only)
router.patch("/:orderId/complete",
    authorize("ADMIN", "PROCESSING"),
    validate(transitionSchema), processingController.complete);

export default router;