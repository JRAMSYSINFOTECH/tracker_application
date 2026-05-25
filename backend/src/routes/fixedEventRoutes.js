import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createFixedEvent,
  getFixedEvents,
  deleteFixedEvent
} from "../controllers/fixedEventController.js";

const router = express.Router();

router.post("/", authMiddleware, createFixedEvent);

router.get("/", authMiddleware, getFixedEvents);

router.delete("/:id", authMiddleware, deleteFixedEvent);

export default router;