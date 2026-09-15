// src/modules/processing/processing.routes.js
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { addNoteSchema, transitionSchema } from "./processing.validation.js";
import * as processingController from "./processing.controller.js";

const router = Router();

router.use(authenticate, authorize("ADMIN", "PROCESSING", "CUSTOMER_SERVICE"));

// Processing Manager's work queue — approved orders waiting to be processed.
router.get("/", processingController.listQueue);

// Detail view of one order's processing record.
router.get("/:orderId", processingController.getDetail);

router.patch("/:orderId/notes", validate(addNoteSchema), processingController.addNote);

// Restricted further to ADMIN/PROCESSING only for the actual transitions.
router.patch(
  "/:orderId/start",
  authorize("ADMIN", "PROCESSING"),
  validate(transitionSchema),
  processingController.start
);

router.patch(
  "/:orderId/complete",
  authorize("ADMIN", "PROCESSING"),
  validate(transitionSchema),
  processingController.complete
);

export default router;