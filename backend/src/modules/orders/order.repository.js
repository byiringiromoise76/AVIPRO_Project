// src/modules/orders/order.repository.js
export async function findOrCreateCustomer(connection, { fullName, phone, address, businessName, branchId }) {
  const [existing] = await connection.execute(
    "SELECT id FROM customers WHERE phone = ? LIMIT 1",
    [phone]
  );

  if (existing[0]) return existing[0].id;

  const [result] = await connection.execute(
    `
    INSERT INTO customers (branch_id, full_name, phone, address, business_name)
    VALUES (?, ?, ?, ?, ?)
    `,
    [branchId, fullName, phone, address, businessName || null]
  );

  return result.insertId;
}

export async function createOrder(connection, { branchId, customerId, loggedBy, orderCode }) {
  const [result] = await connection.execute(
    `
    INSERT INTO orders (branch_id, customer_id, customer_service_id, order_code, status)
    VALUES (?, ?, ?, ?, 'PENDING')
    `,
    [branchId, customerId, loggedBy, orderCode]
  );
  return result.insertId;
}

export async function addOrderItems(connection, orderId, items) {
  for (const item of items) {
    await connection.execute(
      `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
      `,
      [orderId, item.productId, item.quantity, item.unitPrice]
    );
  }
}

export async function recalculateTotal(connection, orderId) {
  await connection.execute(
    `
    UPDATE orders o
    SET total_amount = (
      SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = ?
    )
    WHERE o.id = ?
    `,
    [orderId, orderId]
  );
}

export async function findByIdForUpdate(connection, orderId, actor) {
  let query = `SELECT id, branch_id, status FROM orders WHERE id = ?`;
  const params = [orderId];

  // For testing without auth, always return the order
  if (actor && actor.role !== "ADMIN") {
    query += " AND branch_id = ?";
    params.push(actor.branchId);
  }

  query += " FOR UPDATE";
  const [rows] = await connection.execute(query, params);
  return rows[0];
}

export async function setStatus(connection, orderId, status, extraFields = {}) {
  const fields = ["status = ?"];
  const params = [status];

  for (const [column, value] of Object.entries(extraFields)) {
    fields.push(`${column} = ?`);
    params.push(value);
  }

  params.push(orderId);

  await connection.execute(
    `UPDATE orders SET ${fields.join(", ")}, updated_at = UTC_TIMESTAMP(3) WHERE id = ?`,
    params
  );
}

export async function createStatusHistory(connection, orderId, userId, oldStatus, newStatus, comment) {
  await connection.execute(
    `
    INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, comment)
    VALUES (?, ?, ?, ?, ?)
    `,
    [orderId, userId, oldStatus, newStatus, comment || null]
  );
}