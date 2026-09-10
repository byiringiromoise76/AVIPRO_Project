import { Router } from "express";
// import { authenticate } from "../../middleware/authenticate.js";
// import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createCustomerSchema, updateCustomerSchema, searchCustomerSchema } from "./customer.validation.js";
import { createCustomer, getCustomerById, getAllCustomers, updateCustomer, searchCustomers, getCustomerOrderHistory } from "./customer.controller.js";

const router = Router();

// Create new customer (guest checkout - can be public or authenticated)
router.post(
    "/",
    // authenticate, // Optional: can be public for guest checkout
    validate(createCustomerSchema),
    createCustomer
);

// Get all customers (admin only)
router.get(
    "/",
    // authenticate,
    // authorize("ADMIN", "CUSTOMER_SERVICE"),
    getAllCustomers
);

// Search customers (admin only)
router.get(
    "/search",
    // authenticate,
    // authorize("ADMIN", "CUSTOMER_SERVICE"),
    validate(searchCustomerSchema),
    searchCustomers
);

// Get customer by ID (for tracking)
router.get(
    "/:id",
    // authenticate, // Optional: can be public for order tracking
    getCustomerById
);

// Get customer order history (for tracking)
router.get(
    "/:id/orders",
    // authenticate, // Optional: can be public for order tracking
    getCustomerOrderHistory
);

// Update customer information (admin only)
router.put(
    "/:id",
    // authenticate,
    // authorize("ADMIN", "CUSTOMER_SERVICE"),
    validate(updateCustomerSchema),
    updateCustomer
);

export default router;