// src/modules/customers/customer.repository.js
import { pool } from "../../database/pool.js";

export async function findByPhone(phone) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, phone, address, business_name FROM customers WHERE phone = ? LIMIT 1",
    [phone]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, phone, address, business_name, branch_id FROM customers WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

export async function findAll() {
  const [rows] = await pool.execute(
    "SELECT id, full_name, phone, address, business_name, branch_id FROM customers ORDER BY created_at DESC"
  );
  return rows;
}

export async function createCustomer(connection, { fullName, phone, address, businessName, branchId }) {
  const db = connection || pool;
  const [result] = await db.execute(
    `
    INSERT INTO customers (branch_id, full_name, phone, address, business_name)
    VALUES (?, ?, ?, ?, ?)
    `,
    [branchId, fullName, phone, address, businessName || null]
  );
  return result.insertId;
}

export async function updateCustomer(id, { fullName, phone, address, businessName }) {
  const fields = [];
  const values = [];

  if (fullName !== undefined) {
    fields.push('full_name = ?');
    values.push(fullName);
  }
  if (phone !== undefined) {
    fields.push('phone = ?');
    values.push(phone);
  }
  if (address !== undefined) {
    fields.push('address = ?');
    values.push(address);
  }
  if (businessName !== undefined) {
    fields.push('business_name = ?');
    values.push(businessName || null);
  }

  if (fields.length === 0) {
    return false; // No fields to update
  }

  fields.push('updated_at = CURRENT_TIMESTAMP(3)');
  values.push(id);

  const [result] = await pool.execute(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

export async function searchCustomers(searchTerm) {
  const [rows] = await pool.execute(
    `
    SELECT id, full_name, phone, address, business_name, branch_id 
    FROM customers 
    WHERE full_name LIKE ? OR phone LIKE ? OR business_name LIKE ?
    ORDER BY created_at DESC
    `,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  );
  return rows;
}

export async function getCustomerOrders(customerId) {
  const [rows] = await pool.execute(
    `
    SELECT o.id, o.order_code, o.status, o.total_amount, o.created_at, o.delivered_at
    FROM orders o
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
    `,
    [customerId]
  );
  return rows;
}