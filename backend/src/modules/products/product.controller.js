
import * as productService from "./product.service.js";

//body requesting

export async function createProduct(req, res, next) {
  try {
    const { name, sku, sellingUnit, price, minimumStock } = req.body;

    const product = await productService.addProduct({
      name,
      sku,
      sellingUnit,
      price,
      minimumStock,
    });

    return res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}
