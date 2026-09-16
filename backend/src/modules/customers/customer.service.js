/**
 * src/modules/customers/customer.service.js
 * 
 * Business logic for customer operations.
 * Customers are created during order placement for tracking purposes.
 * 
 * NOTE: No email field — customers are identified by phone number.
 */
import * as customerRepository from "./customer.repository.js";

/**
 * Find a customer by phone (used during order placement to avoid duplicates).
 * 
 * @param {string} phone - Phone number
 * @returns {Promise<Object|null>} Customer or null
 */
export async function findCustomerByPhone(phone) {
    return await customerRepository.findByPhone(phone);
}

/**
 * Create a new customer. Validates phone uniqueness first.
 * 
 * @param {Object} data - { fullName, phone, address, businessName, branchId }
 * @returns {Promise<Object>} Created customer
 */
export async function createCustomer({ fullName, phone, address, businessName, branchId }) {
    // Prevent duplicate customers with the same phone number
    const existing = await customerRepository.findByPhone(phone);
    if (existing) {
        const error = new Error("A customer with this phone number already exists");
        error.status = 409;
        throw error;
    }

    const id = await customerRepository.createCustomer(null, {
        fullName,
        phone,
        address,
        businessName,
        branchId
    });
    return customerRepository.findById(id);
}

/**
 * Get a customer by ID, or throw 404.
 * 
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} Customer
 */
export async function getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
    }
    return customer;
}

/**
 * Get all customers.
 * 
 * @returns {Promise<Array>} All customers
 */
export async function getAllCustomers() {
    return await customerRepository.findAll();
}

/**
 * Update a customer — partial update.
 * Validates phone uniqueness when phone is being changed.
 * 
 * @param {number} id - Customer ID
 * @param {Object} data - { fullName, phone, address, businessName }
 * @returns {Promise<Object>} Updated customer
 */
export async function updateCustomer(id, { fullName, phone, address, businessName }) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
    }

    // Check phone uniqueness when phone is being changed
    if (phone !== undefined && phone !== existing.phone) {
        const phoneExists = await customerRepository.findByPhone(phone);
        if (phoneExists) {
            const error = new Error("A customer with this phone number already exists");
            error.status = 409;
            throw error;
        }
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (businessName !== undefined) updateData.businessName = businessName;

    await customerRepository.updateCustomer(id, updateData);
    return customerRepository.findById(id);
}

/**
 * Search customers by name or phone.
 * 
 * @param {string} searchTerm - Search query
 * @returns {Promise<Array>} Matching customers
 */
export async function searchCustomers(searchTerm) {
    return await customerRepository.searchCustomers(searchTerm);
}

/**
 * Get a customer's order history.
 * 
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} Customer's orders
 */
export async function getCustomerOrderHistory(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
    }
    return await customerRepository.getCustomerOrders(customerId);
}