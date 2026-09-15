// src/modules/processing/processing.repository.js
import { pool } from "../../database/pool.js";

// Orders a Processing Manager can act on: APPROVED (not started) or PROCESSING (in progress by them).
export async function findWorkQueue(actor) {
  let query = `
    SELECT
      p.id AS processing_id,
      p.status AS processing_status,
      p.assigned_to,
      p.started_at,
      p.completed_at,
      o.id AS order_id,
      o.order_code,
      o.status AS order_status,
      o.branch_id,
      o.total_amount,
      c.full_name AS customer_name,
      c.phone AS customer_phone
    FROM processing p
    JOIN orders o ON o.id = p.order_id
    JOIN customers c ON c.id = o.customer_id
    WHERE o.status IN ('APPROVED', 'PROCESSING')
  `;

  const params = [];

  if (actor.role !== "ADMIN") {
    query += " AND o.branch_id = ?";
    params.push(actor.branchId);
  }

  query += " ORDER BY o.approved_at ASC";

  const [rows] = await pool.execute(query, params);
  return rows;
}

export async function findByOrderId(orderId, actor) {
  let query = `
    SELECT
      p.id AS processing_id,
      p.status AS processing_status,
      p.assigned_to,
      p.notes,
      p.started_at,
      p.completed_at,
      o.id AS order_id,
      o.order_code,
      o.status AS order_status,
      o.branch_id
    FROM processing p
    JOIN orders o ON o.id = p.order_id
    WHERE p.order_id = ?
  `;

  const params = [orderId];

  if (actor.role !== "ADMIN") {
    query += " AND o.branch_id = ?";
    params.push(actor.branchId);
  }

  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

export async function addNote(orderId, note) {
  await pool.execute(
    "UPDATE processing SET notes = ? WHERE order_id = ?",
    [note, orderId]
  );
}