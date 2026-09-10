import * as customerService from "./customer.service.js";

// Create new customer (guest checkout - customer provides details during order)
export async function createCustomer(req, res, next) {
    try {
        const { fullName, phone, address, businessName } = req.body;
        const branchId = req.auth?.branchId || 1; // Default to branch 1 if no auth

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

// Get customer by ID (for tracking purposes)
export async function getCustomerById(req, res, next) {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        return res.status(200).json({ data: customer });
    } catch (error) {
        next(error);
    }
}

// Get all customers (admin purposes)
export async function getAllCustomers(req, res, next) {
    try {
        const customers = await customerService.getAllCustomers();
        return res.status(200).json({ data: customers });
    } catch (error) {
        next(error);
    }
}

// Update customer information
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

// Search customers by name or phone
export async function searchCustomers(req, res, next) {
    try {
        const { search } = req.query;
        const customers = await customerService.searchCustomers(search);
        return res.status(200).json({ data: customers });
    } catch (error) {
        next(error);
    }
}

// Get customer order history
export async function getCustomerOrderHistory(req, res, next) {
    try {
        const orders = await customerService.getCustomerOrderHistory(req.params.id);
        return res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
}