import express from "express";
import { analyzeTask, generatePlan } from "../controllers/aiController.js";  // ✅ FIX
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analyze", authMiddleware, analyzeTask);
router.post("/generate-plan", authMiddleware, generatePlan);

export default router;