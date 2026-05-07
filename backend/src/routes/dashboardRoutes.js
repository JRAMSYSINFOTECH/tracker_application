import express from "express";
import {
  getDashboardOverview,
  getTasks,
  getTodayPlan,
  getReminders,
  getPriorityStats
} from "../controllers/dashboardController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", authMiddleware, getDashboardOverview);
router.get("/tasks", authMiddleware, getTasks);
router.get("/reminders", authMiddleware, getReminders);
router.get("/priority-stats", authMiddleware, getPriorityStats);
router.get("/today-plan", authMiddleware, getTodayPlan);

export default router;