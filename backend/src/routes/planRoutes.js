import express from "express";
import { updatePlanItemStatus } from "../controllers/planController.js";

const router = express.Router();

router.put("/update/:id", updatePlanItemStatus); // ✅ THIS LINE

export default router;