import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder
} from "../controllers/reminderController.js";

const router = express.Router();

router.post("/", authMiddleware, createReminder);
router.get("/", authMiddleware, getReminders);
router.put("/:id", authMiddleware, updateReminder);
router.delete("/:id", authMiddleware, deleteReminder);

export default router;