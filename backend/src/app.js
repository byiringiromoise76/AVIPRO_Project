import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http"

import { env } from "./config/env.js"
import apiRoutes from "./routes/index.js"

const app = express();

//remove x-powered-by header to prevent hackers
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());

// connects the frontend http for linking baackend and frontend
app.use(cors(
    {
        origin: env.frontend,
        credentials: true,
    }
));

app.use(express.json({ limit: "10mb" }))
app.use(cookieParser());
app.use(pinoHttp());
// run the end points
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "avipro-api" });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});


//server shown below
app.use((error, req, res, next) => {
    req.log?.error(error); // Log the full error details for developers
    const status = error.status || 500;
    res.status(status).json({
        message: status === 500 ? "Internal server error" : error.message,
    });
});

// export the app
export default app;