// backend/src/index.ts
import express from "express";
import cors from "cors";
import { redisClient } from "./redis";
import executeRouter from "./routes/execute";

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.use("/", executeRouter);

const PORT = process.env.PORT || 3000;

async function startServer() {
  await redisClient.connect();
  console.log("Connected to Redis");
  app.listen(PORT, () => {
    console.log(`RSE backend running on port ${PORT}`);
  });
}

startServer();