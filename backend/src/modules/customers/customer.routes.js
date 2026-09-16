/**
 * src/modules/customers/customer.routes.js
 * 
 * HTTP routes for customer operations.
 * - POST (create) is public: guest checkout needs to create customers
 * - GET/PUT require authentication with staff roles
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createCustomerSchema, updateCustomerSchema, searchCustomerSchema } from "./customer.validation.js";
import { createCustomer, getCustomerById, getAllCustomers, updateCustomer, searchCustomers, getCustomerOrderHistory } from "./customer.controller.js";

const router = Router();

// POST /api/customers — Create customer (public: guest checkout)
router.post("/", validate(createCustomerSchema), createCustomer);

// GET /api/customers — Get all customers (staff only)
router.get("/", authenticate, authorize("ADMIN", "CUSTOMER_SERVICE", "SALES", "PROCESSING"), getAllCustomers);

// GET /api/customers/search?search=term — Search customers
router.get("/search", authenticate, authorize("ADMIN", "CUSTOMER_SERVICE", "SALES", "PROCESSING"), validate(searchCustomerSchema), searchCustomers);

// GET /api/customers/:id — Get customer by ID (public: order tracking)
router.get("/:id", getCustomerById);

// GET /api/customers/:id/orders — Get customer's order history (public: order tracking)
router.get("/:id/orders", getCustomerOrderHistory);

// PUT /api/customers/:id — Update customer (staff only)
router.put("/:id", authenticate, authorize("ADMIN", "CUSTOMER_SERVICE"), validate(updateCustomerSchema), updateCustomer);

export default router;