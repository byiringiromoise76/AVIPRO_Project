import app from "./app.js";
import { env } from "./config/env.js";
import { verifyDatabaseConnection } from "./database/pool.js";

async function start() {
    try {
        await verifyDatabaseConnection();
        console.log("Database connected");

        const server = app.listen(env.port, '0.0.0.0', () => {
            console.log(`AVIPRO API running on port ${env.port}`);
        });

        // Keep the process alive using setInterval
        const keepAlive = setInterval(() => {
            // Do nothing, just keep the process alive
        }, 1000);

        process.on('SIGINT', () => {
            console.log('Shutting down gracefully...');
            clearInterval(keepAlive);
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.log("can not connect to database:", error.message);
        process.exit(1);
    }
}

start();