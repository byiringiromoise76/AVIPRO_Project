/**
 * src/modules/customers/customer.controller.js
 * 
 * HTTP handlers for customer operations.
 * Extracts data from Express requests and delegates to the customer service.
 */
import * as customerService from "./customer.service.js";

/**
 * POST /api/customers — Create a new customer (guest checkout).
 * 
 * Example body:
 *   { "fullName": "Jane Doe", "phone": "0712345678", "address": "123 Main St", "branchId": 1 }
 */
export async function createCustomer(req, res, next) {
    try {
        const { fullName, phone, address, businessName } = req.body;
        const branchId = req.auth?.branchId || 1; // Default to main branch if no auth

        const customer = await customerService.createCustomer({
            fullName,
            phone,
            address,
            businessName,
            branchId
        });
        return res.status(201).json({ data: customer });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/customers/:id — Get a customer by ID.
 */
export async function getCustomerById(req, res, next) {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        return res.status(200).json({ data: customer });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/customers — Get all customers.
 */
export async function getAllCustomers(req, res, next) {
    try {
        const customers = await customerService.getAllCustomers();
        return res.status(200).json({ data: customers });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/customers/:id — Update customer information.
 */
export async function updateCustomer(req, res, next) {
    try {
        const { fullName, phone, address, businessName } = req.body;
        const customer = await customerService.updateCustomer(req.params.id, {
            fullName,
            phone,
            address,
            businessName
        });
        return res.status(200).json({ data: customer });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/customers/search?search=term — Search customers by name/phone.
 */
export async function searchCustomers(req, res, next) {
    try {
        const { search } = req.query;
        const customers = await customerService.searchCustomers(search);
        return res.status(200).json({ data: customers });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/customers/:id/orders — Get a customer's order history.
 */
export async function getCustomerOrderHistory(req, res, next) {
    try {
        const orders = await customerService.getCustomerOrderHistory(req.params.id);
        return res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
}