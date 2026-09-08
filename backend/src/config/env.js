import dotenv from "dotenv";

dotenv.config();

export const env = {
    port: process.env.PORT || 3000,
    frontend: process.env.FRONTEND_URL || "http://localhost:3000",
    db: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        name: process.env.DB_NAME || "avipro",
    },
};
