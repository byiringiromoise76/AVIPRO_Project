import { pool } from "../../database/pool.js"

//select all products
export async function findAll() {
    const [rows] = await pool.execute(
        "SELECT * FROM products"
    );
    return rows;
}

export async function findBySku(sku) {
    const [rows] = await pool.execute(
        "select id from products WHERE sku = ? LIMIT 1",
        [sku]
    );
    return rows[0] || null;
}
//create new product
export async function createProduct({ name, sku, selling_unit, price, minimum_stock }) {
    const [result] = await pool.execute(
        `INSERT INTO products(name,sku,selling_unit,price,minimum_stock) VALUES(?,?,?,?,?)`,
        [name, sku, selling_unit || null, price, minimum_stock ?? 0]
    );
    return result.insertId;

}
//get product by Id
export async function findById(id) {
    const [rows] = await pool.execute(
        `SELECT * FROM products WHERE id=?`,
        [id]
    );
    return rows[0] || null;
}
//update product
export async function UpdateProduct(id, { name, sku, selling_unit, price, minimum_stock }) {
    const fields = [];
    const values = [];

    if (name !== undefined) {
        fields.push('name = ?');
        values.push(name);
    }
    if (sku !== undefined) {
        fields.push('sku = ?');
        values.push(sku);
    }
    if (selling_unit !== undefined) {
        fields.push('selling_unit = ?');
        values.push(selling_unit);
    }
    if (price !== undefined) {
        fields.push('price = ?');
        values.push(price);
    }
    if (minimum_stock !== undefined) {
        fields.push('minimum_stock = ?');
        values.push(minimum_stock);
    }

    if (fields.length === 0) {
        return false; // No fields to update
    }

    values.push(id);
    const [result] = await pool.execute(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0;
}
//delete product
export async function deleteProduct(id) {
    const [result] = await pool.execute(
        `DELETE FROM products WHERE id=?`,
        [id]
    );
    return result.affectedRows > 0;
}
//search for the product name (case-insensitive)
export async function getProductName(name) {
    const [rows] = await pool.execute(
        `SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)`, [`%${name}%`]
    );
    return rows;
}