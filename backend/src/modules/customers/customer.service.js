import * as customerRepository from "./customer.repository.js";

// Find customer by phone (used during order placement to check if customer exists)
export async function findCustomerByPhone(phone) {
    return await customerRepository.findByPhone(phone);
}

// Create new customer (used during order placement for new customers)
export async function createCustomer({ fullName, phone, address, businessName, branchId }) {
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

// Get customer by ID (for tracking orders)
export async function getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
    }
    return customer;
}

// Get all customers (for admin purposes)
export async function getAllCustomers() {
    return await customerRepository.findAll();
}

// Update customer information
export async function updateCustomer(id, { fullName, phone, address, businessName }) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
    }

    // Check if phone is being changed and if new phone already exists
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

// Search customers by name or phone
export async function searchCustomers(searchTerm) {
    return await customerRepository.searchCustomers(searchTerm);
}

// Get customer order history
export async function getCustomerOrderHistory(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
    }
    return await customerRepository.getCustomerOrders(customerId);
}