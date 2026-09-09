
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

export async function getProducts(req, res, next) {
  try {
    const products = await productService.getAllProducts();
    return res.status(200).json({ data: products });
  } catch (error) {
    next(error);
  }
}
//get product by Id
export async function getproductbyId(req,res,next){
  try{
    const products=await productService.getProductbyId(req.params.id);
    return res.status(200).json({data:products});
  }
  catch(error){
next(error);
  }

}
//update product
export async function updateProduct(req,res,next){
  try{
    const {name,sku,sellingUnit,price,minimumStock} = req.body;
    const product = await productService.updateProduct(req.params.id,{
      name,
      sku,
      sellingUnit,
      price,
      minimumStock
    });
    return res.status(200).json({data:product});
  }
  catch(error){
    next(error);
  }
}