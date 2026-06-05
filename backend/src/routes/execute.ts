// backend/src/routes/execute.ts

import { Router, Request, Response } from "express";
import {
  executeSet,
  executeGet,
  executeDel,
  executeExists,
  getFullState,
} from "../services/redisService";

const router = Router();

// POST /execute — run a Redis command
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
      if (!value) {
        return res.status(400).json({
          success: false,
          error: "SET requires a value",
        });
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

    return res.status(400).json({
      success: false,
      error: `Unsupported command: ${cmd}. Supported: SET, GET, DEL, EXISTS`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

// GET /state — full Redis keyspace snapshot
router.get("/state", async (_req: Request, res: Response) => {
  try {
    const state = await getFullState();
    return res.json({ success: true, state });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;