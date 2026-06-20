import type { Express } from "express";
import express from "express";

const app:Express = express()

app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        Credentials:true
    })
)

export default app
