// backend/src/routes/execute.ts

import { Router, Request, Response } from "express";
import {
  executeSet,
  executeGet,
  executeDel,
  executeExists,
  executeExpire,
  executeLPush,
  executeRPop,
  getFullState,
} from "../services/redisService";

const router = Router();

// POST /execute
router.post("/execute", async (req: Request, res: Response) => {
  const { command, key, value } = req.body;

  if (!command || !key) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: command, key",
    });
  }

  const cmd = command.toUpperCase();

  try {
    if (cmd === "SET") {
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ success: false, error: "SET requires a value" });
      }
      await executeSet(key, value);
      return res.json({ success: true, command: cmd, key, value });
    }

    if (cmd === "GET") {
      const result = await executeGet(key);
      return res.json({ success: true, command: cmd, key, value: result });
    }

    if (cmd === "DEL") {
      const deleted = await executeDel(key);
      return res.json({ success: true, command: cmd, key, deleted });
    }

    if (cmd === "EXISTS") {
      const exists = await executeExists(key);
      return res.json({ success: true, command: cmd, key, exists: exists === 1 });
    }

    if (cmd === "EXPIRE") {
      const seconds = parseInt(value, 10);
      if (isNaN(seconds) || seconds <= 0) {
        return res.status(400).json({ success: false, error: "EXPIRE requires a positive integer for seconds" });
      }
      const applied = await executeExpire(key, seconds);
      return res.json({ success: true, command: cmd, key, seconds, applied });
    }

    if (cmd === "LPUSH") {
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ success: false, error: "LPUSH requires a value" });
      }
      const length = await executeLPush(key, value);
      return res.json({ success: true, command: cmd, key, value, length });
    }

    if (cmd === "RPOP") {
      const popped = await executeRPop(key);
      return res.json({ success: true, command: cmd, key, value: popped });
    }

    return res.status(400).json({
      success: false,
      error: `Unsupported command: ${cmd}. Supported: SET, GET, DEL, EXISTS, EXPIRE, LPUSH, RPOP`,
    });

  } catch (error) {
    // Redis throws a typed error for WRONGTYPE operations
    const msg = String(error);
    if (msg.includes("WRONGTYPE")) {
      return res.status(400).json({
        success: false,
        error: `WRONGTYPE: This key holds a different type. Use the correct command for its type.`,
      });
    }
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /state
router.get("/state", async (_req: Request, res: Response) => {
  try {
    const state = await getFullState();
    return res.json({ success: true, state });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;