// src/database/seeds/branches.seed.js
/**
 * Branch locations seed data
 * Creates sample branch locations for development/testing
 * 
 * Example usage:
 *   import { seedBranches } from './branches.seed.js';
 *   await seedBranches();
 * 
 * This creates sample branch locations with addresses and contact information
 */

import { pool } from "../pool.js";

export async function seedBranches() {
    const branches = [
        {
            name: "Main Branch",
            address: "123 Business Ave, Downtown",
            city: "New York",
            state: "NY",
            zipCode: "10001",
            phone: "+1-212-555-0100",
            email: "main@avipro.com",
            isActive: true
        },
        {
            name: "West Coast Branch",
            address: "456 Tech Blvd, Silicon Valley",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
            phone: "+1-415-555-0200",
            email: "westcoast@avipro.com",
            isActive: true
        },
        {
            name: "Midwest Branch",
            address: "789 Commerce St, Business District",
            city: "Chicago",
            state: "IL",
            zipCode: "60601",
            phone: "+1-312-555-0300",
            email: "midwest@avipro.com",
            isActive: true
        }
    ];

    for (const branch of branches) {
        try {
            await pool.execute(
                `INSERT INTO branches (name, address, city, state, zip_code, phone, email, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [branch.name, branch.address, branch.city, branch.state, branch.zipCode, branch.phone, branch.email, branch.isActive]
            );
            console.log(`Created branch: ${branch.name}`);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Branch already exists: ${branch.name}`);
            } else {
                throw error;
            }
        }
    }
}