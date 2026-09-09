import app from "./app.js";
import { env } from "./config/env.js";
import { verifyDatabaseConnection } from "./database/pool.js";
//funtion for waiting connection
async function start() {
    try {
        await verifyDatabaseConnection
        console.log("Database connected");
    }
    catch (error) {
        console.log("can not connect to database:", error.message);
        process.exit(1);

    }
}
//starting the server
app.listen(env.port, () => {
    console.log(`AVIPRO API running on port ${env.port}`);
});
start()