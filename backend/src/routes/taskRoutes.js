import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

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