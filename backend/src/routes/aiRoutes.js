import express from "express";
import {
  analyzeReschedule,
  analyzeTask,
  generatePlan,
  rescheduleItem
} from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analyze", authMiddleware, analyzeTask);
router.post("/generate-plan", authMiddleware, generatePlan);
router.post("/analyze-reschedule", authMiddleware, analyzeReschedule);
router.post("/reschedule-item", authMiddleware, rescheduleItem);

export default router;
