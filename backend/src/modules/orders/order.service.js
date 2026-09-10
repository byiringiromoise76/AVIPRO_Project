// src/modules/orders/order.service.js
import { pool } from "../../database/pool.js";
import * as orderRepository from "./order.repository.js";

function generateOrderCode() {
  return `AV${Date.now().toString().slice(-8)}`;
}

// 1. Customer Service logs a request that came in outside the system.
export async function logOrder({ actor, customer, items }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const customerId = await orderRepository.findOrCreateCustomer(connection, {
      ...customer,
      branchId: actor.branchId,
    });

    const orderId = await orderRepository.createOrder(connection, {
      branchId: actor.branchId,
      customerId,
      loggedBy: actor.userId,
      orderCode: generateOrderCode(),
    });

    await orderRepository.addOrderItems(connection, orderId, items);
    await orderRepository.recalculateTotal(connection, orderId);
    await orderRepository.createStatusHistory(connection, orderId, actor.userId, null, "PENDING", "Order logged");

    await connection.commit();
    return { orderId, status: "PENDING" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// 2. Customer Service Manager approves.
export async function approveOrder({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"],
    fromStatus: "PENDING",
    toStatus: "APPROVED",
    afterUpdate: async (connection) => {
      await connection.execute(
        `INSERT INTO processing (order_id, status) VALUES (?, 'PENDING')`,
        [orderId]
      );
    },
  });
}

// 3. Processing Manager starts processing.
export async function startProcessing({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "PROCESSING"],
    fromStatus: "APPROVED",
    toStatus: "PROCESSING",
    afterUpdate: async (connection) => {
      // First check if processing record exists, if not create it
      const [existing] = await connection.execute(
        "SELECT id FROM processing WHERE order_id = ?",
        [orderId]
      );

      if (!existing[0]) {
        await connection.execute(
          `INSERT INTO processing (order_id, status) VALUES (?, 'IN_PROGRESS')`,
          [orderId]
        );
      } else {
        await connection.execute(
          `UPDATE processing SET status = 'IN_PROGRESS', started_at = UTC_TIMESTAMP(3) WHERE order_id = ?`,
          [orderId]
        );
      }
    },
  });
}

// 4. Processing Manager marks processing complete.
export async function completeProcessing({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "PROCESSING"],
    fromStatus: "PROCESSING",
    toStatus: "PROCESSING_COMPLETED",
    afterUpdate: async (connection) => {
      // Check if processing record exists
      const [existing] = await connection.execute(
        "SELECT id FROM processing WHERE order_id = ?",
        [orderId]
      );

      if (existing[0]) {
        await connection.execute(
          `UPDATE processing SET status = 'COMPLETED', completed_at = UTC_TIMESTAMP(3) WHERE order_id = ?`,
          [orderId]
        );
      }

      // Notify Customer Service the order is ready for their review.
      await connection.execute(
        `
        INSERT INTO notifications (order_id, user_id, title, message, type)
        SELECT ?, id, 'Processing complete', CONCAT('Order ', ?, ' is ready to prepare for delivery.'), 'ORDER_HANDOFF'
        FROM users WHERE role = 'CUSTOMER_SERVICE' AND is_active = TRUE
        `,
        [orderId, orderId]
      );
    },
  });
}

// 5. Customer Service Manager marks it ready for delivery.
export async function markReadyForDelivery({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"],
    fromStatus: "PROCESSING_COMPLETED",
    toStatus: "READY_FOR_DELIVERY",
  });
}

// 6. Customer Service Manager marks delivered — this closes the order.
export async function markDeliveredAndClose({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,
    actor,
    comment,
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"],
    fromStatus: "READY_FOR_DELIVERY",
    toStatus: "DELIVERED",
    extraFields: { delivered_at: new Date(), customer_confirmed: true },
  });
}

// Shared transition helper — every status change goes through this.
async function transitionOrder({ orderId, actor, comment, allowedRoles, fromStatus, toStatus, extraFields = {}, afterUpdate }) {
  if (!allowedRoles.includes(actor.role)) {
    const error = new Error("You do not have permission to perform this action");
    error.status = 403;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const order = await orderRepository.findByIdForUpdate(connection, orderId, actor);
    if (!order) {
      const error = new Error("Order not found or outside your branch");
      error.status = 404;
      throw error;
    }

    if (order.status !== fromStatus) {
      const error = new Error(`Order must be ${fromStatus} to perform this action (currently ${order.status})`);
      error.status = 409;
      throw error;
    }

    await orderRepository.setStatus(connection, orderId, toStatus, extraFields);
    await orderRepository.createStatusHistory(connection, orderId, actor.userId, fromStatus, toStatus, comment);

    if (afterUpdate) await afterUpdate(connection);

    await connection.commit();
    return { orderId, status: toStatus };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}