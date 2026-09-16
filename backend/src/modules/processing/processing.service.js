// src/modules/processing/processing.service.js
// This file handles business logic for processing operations
// Status transitions (start/complete processing) are owned by order.service.js
// This module reuses them rather than duplicating the transaction logic
// Processing represents the middle stage of order lifecycle where orders are prepared

// Import processing repository functions for database operations
import * as processingRepository from "./processing.repository.js";
// Import order service for status transition logic
import * as orderService from "../orders/order.service.js";

// Get the work queue - all pending and in-progress processing records
// Returns list of orders that need to be processed or are currently being processed
// Used by processing managers to see their workload
export async function getWorkQueue(actor) {
  return processingRepository.findWorkQueue();
}

// Get processing details for a specific order
// Returns the processing record with complete information
// Used to view the current status and details of order processing
export async function getProcessingDetail(orderId, actor) {
  const record = await processingRepository.findByOrderId(orderId);
  if (!record) {
    const error = new Error("Processing record not found");
    error.status = 404; // HTTP 404 Not Found
    throw error;
  }
  return record;
}

// Add a processing note to an order
// Used by processing staff to add notes about the processing work
// Confirms the order is visible to the actor before allowing the note
export async function addProcessingNote({ orderId, actor, note }) {
  // Confirm the order is visible to this actor before allowing the note
  await getProcessingDetail(orderId, actor);
  // Add the note to the processing record
  await processingRepository.addNote(orderId, note);
  // Return confirmation with order ID and note
  return { orderId, note };
}

// Start processing an order
// This delegates to order service to handle the status transition
// Status transition: APPROVED → PROCESSING
export async function startProcessing({ orderId, actor, comment }) {
  return orderService.startProcessing({ orderId, actor, comment });
}

// Complete processing of an order
// This delegates to order service to handle the status transition
// Status transition: PROCESSING → PROCESSING_COMPLETED
export async function completeProcessing({ orderId, actor, comment }) {
  return orderService.completeProcessing({ orderId, actor, comment });
}