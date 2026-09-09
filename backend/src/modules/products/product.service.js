import * as productRepository from "./product.repository.js"
// add new
export async function addProduct({ name, sku, sellingUnit, price, minimumStock }) {
    //
    const existing = await productRepository.findBySku(sku);
    if (existing) {
        const error = new Error("A product with this SKU aleady exixts");
        error.status = 409;
        throw error;
    }
    //add new procuts
    const id = await productRepository.createProduct(
        {
            name,
            sku,
            selling_unit: sellingUnit,
            price,
            minimum_stock: minimumStock
        }
    );
    return productRepository.findById(id);

}
//get all product
export async function getAllProducts() {
    return await productRepository.findAll();
}
//get product by Id
export async function getProductbyId(id){
    return await productRepository.findById(id);
}
//update product
export async function updateProduct(id){
    return await productRepository.UpdateProduct();
}
//delete product
export async function deleteProducts(id){
    return await productRepository.deleteProduct();
}
//search product name
export async function getProductByName(name){
    return await productRepository.getProductName();
}