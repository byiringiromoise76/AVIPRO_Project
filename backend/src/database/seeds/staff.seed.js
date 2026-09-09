// src/database/seeds/staff.seed.js
/**
 * Staff users seed data
 * Creates sample staff users with different roles for development/testing
 * 
 * Example usage:
 *   import { seedStaff } from './staff.seed.js';
 *   await seedStaff();
 * 
 * This creates sample staff users with different roles (ADMIN, MANAGER, SALES, STAFF)
 * Default password for all users: "password123" (should be changed in production)
 */

import { pool } from "../pool.js";
import bcrypt from 'bcrypt';

export async function seedStaff() {
    const staff = [
        {
            email: "admin@avipro.com",
            password: "password123",
            name: "System Administrator",
            role: "ADMIN",
            branchId: 1
        },
        {
            email: "manager@avipro.com",
            password: "password123",
            name: "Branch Manager",
            role: "ADMIN",
            branchId: 1
        },
        {
            email: "sales@avipro.com",
            password: "password123",
            name: "Sales Representative",
            role: "SALES",
            branchId: 1
        },
        {
            email: "staff@avipro.com",
            password: "password123",
            name: "Warehouse Staff",
            role: "PROCESSING",
            branchId: 1
        },
        {
            email: "west.manager@avipro.com",
            password: "password123",
            name: "West Coast Manager",
            role: "ADMIN",
            branchId: 2
        },
        {
            email: "west.sales@avipro.com",
            password: "password123",
            name: "West Coast Sales",
            role: "SALES",
            branchId: 2
        }
    ];

    for (const user of staff) {
        try {
            const passwordHash = await bcrypt.hash(user.password, 10);
            await pool.execute(
                `INSERT INTO users (email, password_hash, full_name, role, branch_id, is_active)
                 VALUES (?, ?, ?, ?, ?, TRUE)`,
                [user.email, passwordHash, user.name, user.role, user.branchId]
            );
            console.log(`Created staff user: ${user.email} (${user.role})`);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`Staff user already exists: ${user.email}`);
            } else {
                throw error;
            }
        }
    }
}