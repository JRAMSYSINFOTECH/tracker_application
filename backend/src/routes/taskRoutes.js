import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  checkOverlap,
  markOccurrence,
  getOccurrences
} from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Check Time Overlap (must be before /:id routes)
router.post("/check-overlap", authMiddleware, checkOverlap);

// ✅ Task Occurrences (per-day completion for recurring tasks)
router.post("/occurrence", authMiddleware, markOccurrence);
router.get("/occurrences", authMiddleware, getOccurrences);

// ✅ Create Task
router.post("/", authMiddleware, createTask);

// ✅ Get All Tasks
router.get("/", authMiddleware, getAllTasks);

// ✅ Get Single Task
router.get("/:id", authMiddleware, getTaskById);

// ✅ Update Task
router.put("/:id", authMiddleware, updateTask);

// ✅ Delete Task
router.delete("/:id", authMiddleware, deleteTask);

export default router;