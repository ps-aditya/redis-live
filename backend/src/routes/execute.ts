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
  executeFlushAll,
  executeLPop,
  executeLLen,
  executeHSet,
  executeHGet,
  executeSAdd,
  executeSRem,
  getFullState,
} from "../services/redisService";

const router = Router();

// POST /execute
router.post("/execute", async (req: Request, res: Response) => {
  const { command, key, value, field } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: command",
    });
  }

  const cmd = command.toUpperCase();

  // FLUSHALL is the only command that doesn't need a key
  if (!key && cmd !== "FLUSHALL") {
    return res.status(400).json({
      success: false,
      error: "Missing required field: key",
    });
  }

  try {
    if (cmd === "FLUSHALL") {
      await executeFlushAll();
      return res.json({ success: true, command: cmd, flushed: true });
    }

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

    if (cmd === "LPOP") {
      const popped = await executeLPop(key);
      return res.json({ success: true, command: cmd, key, value: popped });
    }

    if (cmd === "LLEN") {
      const len = await executeLLen(key);
      return res.json({ success: true, command: cmd, key, len });
    }

    if (cmd === "HSET") {
      if (!field) {
        return res.status(400).json({ success: false, error: "HSET requires a field name" });
      }
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ success: false, error: "HSET requires a value" });
      }
      const added = await executeHSet(key, field, value);
      return res.json({ success: true, command: cmd, key, field, value, added });
    }

    if (cmd === "HGET") {
      if (!field) {
        return res.status(400).json({ success: false, error: "HGET requires a field name" });
      }
      const result = await executeHGet(key, field);
      return res.json({ success: true, command: cmd, key, field, value: result });
    }

    if (cmd === "SADD") {
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ success: false, error: "SADD requires a value" });
      }
      const added = await executeSAdd(key, value);
      return res.json({ success: true, command: cmd, key, value, added });
    }

    if (cmd === "SREM") {
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ success: false, error: "SREM requires a value" });
      }
      const removed = await executeSRem(key, value);
      return res.json({ success: true, command: cmd, key, value, removed });
    }

    return res.status(400).json({
      success: false,
      error: `Unsupported command: ${cmd}. Supported: SET, GET, DEL, EXISTS, EXPIRE, LPUSH, RPOP, LPOP, LLEN, HSET, HGET, SADD, SREM, FLUSHALL`,
    });

  } catch (error) {
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