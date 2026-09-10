import { Router } from "express";
// import { authenticate } from "../../middleware/authenticate.js";
// import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createProductSchema, updateProductSchema, searchProductSchema } from "./product.validation.js";
import { createProduct, getProducts, getproductbyId, updateProduct, deleteProduct, searchProductByName } from "./product.controller.js";

const router = Router();
router.post(
    "/",
    // authenticate,
    // authorize("ADMIN", "SALES"),
    validate(createProductSchema),
    createProduct
);
//get all products
router.get(
    "/",
    // authenticate,
    // authorize("ADMIN", "SALES"),
    getProducts
);
//search product by name - must come before /:id
router.get("/search",
    validate(searchProductSchema),
    searchProductByName
);
//get product by Id
router.get("/:id",
    getproductbyId
)
//update product
router.put("/:id",
    validate(updateProductSchema),
    updateProduct
);
//delete product
router.delete("/:id",
    deleteProduct
);
export default router;