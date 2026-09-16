// EXAMPLE OF DETAILED CODE COMMENTS FOR THE AVIPRO PROJECT
// This file demonstrates the commenting pattern used throughout the project

/**
 * ORDER CREATION FLOW WITH DETAILED COMMENTS
 * =============================================
 * 
 * When a customer wants to create an order, the following flow happens:
 * 
 * 1. HTTP Request → 2. Controller → 3. Service → 4. Repository → 5. Database
 * 
 * Step 1: HTTP Request (POST /api/orders)
 * - Customer sends order data including customer info and items
 * - Request is validated using Zod schema
 * - Request is routed to order controller
 * 
 * Step 2: Controller Layer (order.controller.js)
 * - Extracts request data (customer info, items)
 * - Handles authentication (if present)
 * - Calls service layer for business logic
 * - Returns HTTP response with order details
 * 
 * Step 3: Service Layer (order.service.js)
 * - Determines order type (direct customer vs sales agent)
 * - Finds or creates customer record
 * - Generates unique order code
 * - Creates order record with proper attribution
 * - Adds order items
 * - Calculates total amount
 * - Handles database transactions (commit/rollback)
 * - Returns complete order with related information
 * 
 * Step 4: Repository Layer (order.repository.js)
 * - Executes SQL queries against database
 * - Handles raw database operations
 * - Returns data to service layer
 * 
 * Step 5: Database (MySQL)
 * - Stores customer records
 * - Stores order records
 * - Stores order items
 * - Maintains referential integrity
 */

// ============================================================
// ORDER SERVICE EXAMPLE WITH DETAILED COMMENTS
// ============================================================

// Import order repository functions for database operations
import * as orderRepository from "./order.repository.js";
// Import database connection pool for direct database access
import { pool } from "../../database/pool.js";

// Main branch ID constant - all orders go through main branch for centralized processing
// This ensures all orders are processed in one location regardless of where they originate
const MAIN_BRANCH_ID = 1;

/**
 * Create a new order in the system
 * @param {Object} params - Order creation parameters
 * @param {Object} params.actor - User creating the order (null for guest customers)
 * @param {Object} params.customer - Customer information
 * @param {string} params.customer.fullName - Customer's full name
 * @param {string} params.customer.phone - Customer's phone number (unique identifier)
 * @param {string} params.customer.address - Customer's delivery address
 * @param {string} [params.customer.businessName] - Optional business name for B2B customers
 * @param {string} [params.customer.email] - Optional email for business customers
 * @param {Array} params.items - Array of order items
 * @param {number} params.items[].productId - Product ID to order
 * @param {number} params.items[].quantity - Quantity of product
 * @param {number} params.items[].unitPrice - Price per unit
 * @returns {Object} Created order with full details including customer and sales agent info
 */
export async function logOrder({ actor, customer, items }) {
  // Get a database connection from the connection pool
  // Connection pooling is important for performance and resource management
  const connection = await pool.getConnection();

  try {
    // Start a database transaction to ensure all operations succeed or fail together
    // This prevents partial data corruption if any step fails
    await connection.beginTransaction();

    // Use main branch for order processing (centralized system design)
    // All orders are processed through the main branch regardless of origin
    const mainBranchId = MAIN_BRANCH_ID;

    // Determine if this is a direct customer order (no actor or customer role)
    // Guest customers don't have authentication, so actor will be null
    const isDirectCustomerOrder = !actor || actor.role === 'CUSTOMER';
    
    // Determine if this is a business order (has business name)
    // Business orders might get different treatment in future enhancements
    const isBusinessOrder = customer.businessName && customer.businessName.trim() !== '';

    // Find existing customer by phone number or create new customer
    // Phone number is used as the unique identifier for customers
    // This prevents duplicate customer records for the same person
    const customerId = await orderRepository.findOrCreateCustomer(connection, {
      fullName: customer.fullName,      // Customer's full name
      phone: customer.phone,            // Phone number (unique identifier)
      address: customer.address,        // Delivery address
      businessName: customer.businessName, // Optional business name for B2B
      email: customer.email,            // Optional email for business customers
      branchId: mainBranchId          // All customers stored in main branch
    });

    // Generate unique order code using timestamp and random string
    // Format: ORD-{timestamp}-{random_string}
    // Example: ORD-1634567890-ABCDEF123
    const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create the order record in the database
    // This creates the main order record with all attribution information
    const orderId = await orderRepository.createOrder(connection, {
      branchId: mainBranchId,              // Order assigned to main branch
      customerId,                         // Link to customer record
      loggedBy: actor?.userId || null,    // User who logged the order (null for guests)
      salespersonId: isDirectCustomerOrder ? null : actor.userId, // Sales agent attribution
      orderCode                            // Unique order identifier
    });

    // Add all order items to the order_items table
    // Each item is stored separately to support proper inventory and pricing
    await orderRepository.addOrderItems(connection, orderId, items);

    // Calculate and update the total order amount from all items
    // This ensures the order total always matches the sum of (quantity × unit_price)
    await orderRepository.recalculateTotal(connection, orderId);

    // Commit the transaction to save all changes to database
    // If this succeeds, all changes are permanent
    await connection.commit();

    // Fetch the complete order with related information
    // This includes customer details, sales agent info, branch information
    const order = await orderRepository.findByIdWithDetails(orderId);
    return order; // Return the created order with full details
  } catch (error) {
    // If any error occurs, rollback the transaction
    // This undoes all changes made during this transaction
    await connection.rollback();
    // Re-throw the error for the controller to handle (error middleware)
    throw error;
  } finally {
    // Always release the database connection back to the pool
    // This is critical for connection pool performance
    connection.release();
  }
}

/**
 * Core function to handle order status transitions
 * This ensures all status changes follow the same pattern with proper error handling
 * 
 * @param {Object} params - Transition parameters
 * @param {number} params.orderId - The order to transition
 * @param {Object} params.actor - The user performing the transition
 * @param {string} [params.comment] - Optional comment about the transition
 * @param {Array} params.allowedRoles - Roles allowed to perform this transition
 * @param {string} params.fromStatus - Current required status
 * @param {string} params.toStatus - Target status after transition
 * @param {Object} params.extraFields - Additional fields to update (timestamps, user IDs)
 * @param {Function} [params.afterUpdate] - Optional callback after status update
 * @returns {Object} Transition result with status information
 */
async function transitionOrder({ orderId, actor, comment, allowedRoles, fromStatus, toStatus, extraFields = {}, afterUpdate }) {
  // Get database connection for transaction
  const connection = await pool.getConnection();

  try {
    // Start transaction to ensure atomic operation
    // Either all changes succeed or none do
    await connection.beginTransaction();

    // Get order with row-level lock to prevent concurrent modifications
    // FOR UPDATE locks the row until transaction completes
    const order = await orderRepository.findByIdForUpdate(connection, orderId, actor);

    // Check if order exists
    if (!order) {
      const error = new Error("Order not found");
      error.status = 404; // HTTP 404 Not Found
      throw error;
    }

    // Validate that order is in the correct status for this transition
    // Orders must follow the status flow: PENDING → APPROVED → PROCESSING → DELIVERED
    if (order.status !== fromStatus) {
      const error = new Error(`Order must be in ${fromStatus} status to transition to ${toStatus}`);
      error.status = 400; // HTTP 400 Bad Request
      throw error;
    }

    // Update the order status and any additional fields
    // extraFields can include timestamps, user IDs, etc.
    await orderRepository.setStatus(connection, orderId, toStatus, extraFields);
    
    // Create a record in order status history for audit trail
    // This maintains a complete history of all status changes
    await orderRepository.createStatusHistory(connection, orderId, actor.userId, fromStatus, toStatus, comment);

    // Execute any additional operations after status update
    // This is used for side effects like creating processing records or sending notifications
    if (afterUpdate) {
      await afterUpdate(connection);
    }

    // Commit transaction to save all changes
    await connection.commit();

    // Return the transition result for API response
    return {
      orderId,       // The order ID that was transitioned
      fromStatus,    // Previous status before transition
      toStatus,      // New status after transition
      updatedBy: actor.userId, // User who made the change
      comment        // Optional comment about the transition
    };
  } catch (error) {
    // Rollback transaction on any error
    // This ensures data consistency
    await connection.rollback();
    throw error;
  } finally {
    // Always release connection back to pool
    // Essential for connection pool performance
    connection.release();
  }
}

/**
 * Approve a pending order and move it to processing queue
 * Only ADMIN and CUSTOMER_SERVICE roles can approve orders
 * 
 * @param {Object} params - Approval parameters
 * @returns {Object} Approval result with status information
 */
export async function approveOrder({ orderId, actor, comment }) {
  return transitionOrder({
    orderId,                    // The order to approve
    actor,                      // The user performing the approval
    comment,                    // Optional approval notes
    allowedRoles: ["ADMIN", "CUSTOMER_SERVICE"], // Roles that can approve
    fromStatus: "PENDING",     // Order must be in PENDING status
    toStatus: "APPROVED",      // New status after approval
    extraFields: { 
      approved_at: new Date(),           // Set approval timestamp
      customer_service_id: actor.userId  // Record who approved it
    },
    afterUpdate: async (connection) => {
      // Create a processing record for the approved order
      // This moves the order into the processing queue
      await connection.execute(
        `INSERT INTO processing (order_id, status) VALUES (?, 'PENDING')`,
        [orderId]
      );
    },
  });
}

// ============================================================
// KEY CONCEPTS EXPLAINED
// ============================================================

/**
 * TRANSACTIONS
 * ============
 * Database transactions ensure that a series of operations either all succeed or all fail.
 * This is critical for data integrity, especially in order processing where:
 * - Customer creation must succeed before order creation
 * - Order creation must succeed before adding items
 * - All items must be added before calculating total
 * 
 * If any step fails, the entire transaction is rolled back (undone).
 */

/**
 * CONNECTION POOLING
 * ==================
 * Instead of creating a new database connection for each request,
 * we use a pool of reusable connections. This improves performance
 * by:
 * - Reducing connection overhead
 * - Limiting maximum concurrent connections
 * - Reusing connections efficiently
 * 
 * Always release connections back to the pool in the finally block.
 */

/**
 * STATUS FLOW
 * ===========
 * Orders follow a strict status flow:
 * PENDING → APPROVED → PROCESSING → PROCESSING_COMPLETED → READY_FOR_DELIVERY → DELIVERED
 * 
 * Each transition has specific requirements:
 * - Only certain roles can perform each transition
 * - Orders must be in the correct status to transition
 * - Some transitions trigger side effects (notifications, processing records)
 */

/**
 * ERROR HANDLING
 * ===============
 * Errors are handled at multiple levels:
 * 1. Repository: Database errors (duplicate keys, constraint violations)
 * 2. Service: Business logic errors (invalid status, missing data)
 * 3. Controller: HTTP errors (400, 404, 409 status codes)
 * 4. Middleware: Global error handling and logging
 * 
 * HTTP Status Codes:
 * - 200: Success
 * - 201: Created (for POST requests)
 * - 400: Bad Request (validation errors)
 * - 404: Not Found (resource doesn't exist)
 * - 409: Conflict (duplicate data)
 * - 500: Internal Server Error (unexpected errors)
 */

/**
 * MAIN BRANCH SYSTEM
 * ===================
 * All orders are processed through the main branch (ID: 1) regardless of origin.
 * This provides:
 * - Centralized order processing
 * - Unified inventory management
 * - Consistent customer experience
 * - Simplified reporting and analytics
 * 
 * However, we still track:
 * - Which sales agent created the order
 * - Which branch the sales agent is from
 * - Customer information and history
 */

// ============================================================
// END OF COMMENTED EXAMPLE
// ============================================================