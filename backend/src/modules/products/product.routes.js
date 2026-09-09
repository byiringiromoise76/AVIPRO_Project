import { Router } from "express";
// import { authenticate } from "../../middleware/authenticate.js";
// import { authorize } from "../../middleware/authorize.js";
// import { validate } from "../../middleware/validate.js";
// import { createProductSchema } from "./product.validation.js";
import { createProduct, getProducts,getproductbyId,updateProduct } from "./product.controller.js";

const router = Router();
router.post(
    "/",
    // authenticate,
    // authorize("ADMIN", "SALES"),
    // validate(createProductSchema),
    createProduct
);
//get all products
router.get(
    "/",
    // authenticate,
    // authorize("ADMIN", "SALES"),
    getProducts
);
//get product by Id
router.get("/:id",
    getproductbyId
)
//update product
router.put("/:id",
    updateProduct
);
export default router;