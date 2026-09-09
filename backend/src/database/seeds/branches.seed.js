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
            location: "123 Business Ave, Downtown, New York, NY 10001"
        },
        {
            name: "West Coast Branch",
            location: "456 Tech Blvd, Silicon Valley, San Francisco, CA 94105"
        },
        {
            name: "Midwest Branch",
            location: "789 Commerce St, Business District, Chicago, IL 60601"
        }
    ];

    for (const branch of branches) {
        try {
            await pool.execute(
                `INSERT INTO branches (name, location)
                 VALUES (?, ?)`,
                [branch.name, branch.location]
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