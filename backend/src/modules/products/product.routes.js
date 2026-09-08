import { Router } from "express";
// import { authenticate } from "../../middleware/authenticate.js";
// import { authorize } from "../../middleware/authorize.js";
// import { validate } from "../../middleware/validate.js";
// import { createProductSchema } from "./product.validation.js";
import { createProduct } from "./product.controller.js";

const router = Router();
router.post(
    "/",
    // authenticate,
    // authorize("ADMIN", "SALES"),
    // validate(createProductSchema),
    createProduct
);

export default router;