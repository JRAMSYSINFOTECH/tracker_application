import express from "express";
import {
  getDashboardOverview,
  getTasks,
  getTodayPlan,
  getReminders,
  getPriorityStats,
  generateDailyPlan,
} from "../controllers/dashboardController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", authMiddleware, getDashboardOverview);
router.get("/tasks", authMiddleware, getTasks);
router.get("/reminders", authMiddleware, getReminders);
router.get("/priority-stats", authMiddleware, getPriorityStats);
router.post("/generate-plan", authMiddleware, generateDailyPlan);
router.get("/today-plan", authMiddleware, getTodayPlan);

export default router;