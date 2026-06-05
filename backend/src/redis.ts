import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://localhost:6379"
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});