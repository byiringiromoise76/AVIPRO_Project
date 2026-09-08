import {pool} from"../../database/pool.js"

//select all products
export async function findBySku(sku){
    const[rows]=await pool.execute(
        "select id from product sku = ? LIMIT 1",
        [sku]
    );
    return rows[0]||null;
}
//create new product
export async function createProduct({name,sku,sellingUnit,price,minimumstock}){
    const[restul]=await pool.execute(
        `INSERT INTO product(name,sku,sellingUnit,price,minimumStock) VALUES(?,?,?,?,?)`,
        [name,sku,sellingUnit,price,minimumStock]
    );
    return result.insertId;

}
//get product by Id
export async function findById(id){
    const[rows]=await pool.execute(
        `SELECT * FROM product WHERE id=?`,
        [id]
    );
    return rows[0]||null;
}
//update product
export async function updateProduct(id,{name,sku,sellingUnit,price,minimumstock}){
    const[restul]=await pool.execute(
        `UPDATE product SET name=?,sku=?,sellingUnit=?,price=?,minimumStock=? WHERE id=?`,
        [name,sku,sellingUnit,price,minimumStock,id]
    );
    return restul.affectedRows>0;
}
//delete product
export async function deleteProduct(id){
    const[restul]=await pool.execute(
        `DELETE FROM product WHERE id=?`,
        [id]
    );
    return restul.affectedRows>0;
}
