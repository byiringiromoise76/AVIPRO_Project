import * as productRepository from "./product.repository.js"
// add new 
export async function addProduct({ name, sku, sellingUnit, price, minimumStock }){
    //
    const existing=await productRepository.findBySku(sku);
    if(existing){
        const error=new Error("A product with this SKU aleady exixts");
        error.status=409;
        throw error;
    }
    //add new procuts
    const id =await productRepository.createProduct(
    {    name,
        sku,
        sellingUnit,
        price,
        minimumStock}
    );
    return productRepository.findById(id);

}