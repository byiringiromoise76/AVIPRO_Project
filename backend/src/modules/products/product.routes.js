/**
 * src/modules/products/product.routes.js
 * 
 * HTTP routes for product operations.
 * All routes require authentication; writes are limited to ADMIN/SALES.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createProductSchema, updateProductSchema, searchProductSchema } from "./product.validation.js";
import { createProduct, getProducts, getproductbyId, updateProduct, deleteProduct, searchProductByName } from "./product.controller.js";

const router = Router();

// All product routes require authentication (any staff role)
router.use(authenticate, authorize("ADMIN", "SALES", "CUSTOMER_SERVICE", "PROCESSING"));

// GET /api/products — Get all products
router.get("/", getProducts);

// GET /api/products/search?name=term — Search products by name (must be before /:id!)
router.get("/search", validate(searchProductSchema), searchProductByName);

// GET /api/products/:id — Get a product by ID
router.get("/:id", getproductbyId);

// Write routes require ADMIN or SALES role
router.post("/", authorize("ADMIN", "SALES"), validate(createProductSchema), createProduct);

router.put("/:id", authorize("ADMIN", "SALES"), validate(updateProductSchema), updateProduct);

router.delete("/:id", authorize("ADMIN"), deleteProduct);

export default router;