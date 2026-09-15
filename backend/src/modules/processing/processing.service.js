// src/modules/processing/processing.service.js
// Read/query logic lives here. Status transitions are owned by order.service.js
// (start/complete processing are really order-lifecycle transitions), so this
// module reuses them rather than duplicating the transaction logic.

import * as processingRepository from "./processing.repository.js";
import * as orderService from "../orders/order.service.js";

export async function getWorkQueue(actor) {
  return processingRepository.findWorkQueue(actor);
}

export async function getProcessingDetail(orderId, actor) {
  const record = await processingRepository.findByOrderId(orderId, actor);
  if (!record) {
    const error = new Error("Processing record not found or outside your branch");
    error.status = 404;
    throw error;
  }
  return record;
}

export async function addProcessingNote({ orderId, actor, note }) {
  // Confirm the order is visible to this actor before allowing the note.
  await getProcessingDetail(orderId, actor);
  await processingRepository.addNote(orderId, note);
  return { orderId, note };
}

export async function startProcessing({ orderId, actor, comment }) {
  return orderService.startProcessing({ orderId, actor, comment });
}

export async function completeProcessing({ orderId, actor, comment }) {
  return orderService.completeProcessing({ orderId, actor, comment });
}