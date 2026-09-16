// Check the actual database schema
import mysql from "mysql2/promise";
import { env } from "./src/config/env.js";

const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
});

async function checkSchema() {
    try {
        console.log("Checking database schema...\n");

        // Check orders table
        const [ordersColumns] = await pool.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
            ORDER BY ORDINAL_POSITION
        `, [env.db.name]);
        
        console.log("Orders table columns:");
        ordersColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
        });

        // Check if customers table exists
        const [customersColumns] = await pool.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers'
            ORDER BY ORDINAL_POSITION
        `, [env.db.name]);
        
        console.log("\nCustomers table columns:");
        customersColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
        });

        // Check if users table exists
        const [usersColumns] = await pool.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `, [env.db.name]);
        
        console.log("\nUsers table columns:");
        usersColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
        });

    } catch (error) {
        console.error("Error checking schema:", error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();