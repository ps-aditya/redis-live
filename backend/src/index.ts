// backend/src/index.ts

import express from "express";
import cors from "cors";
import { redisClient } from "./redis";
import executeRouter from "./routes/execute";

const app = express();

app.use(cors());
app.use(express.json());

// All routes live in their own files
app.use("/", executeRouter);

async function startServer() {
  await redisClient.connect();
  console.log("Connected to Redis");

  app.listen(3000, () => {
    console.log("RSE backend running on http://localhost:3000");
  });
}

startServer();