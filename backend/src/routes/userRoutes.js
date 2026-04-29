import express from "express";
import { updateUserProfile, getUserProfile } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// ✅ Get user profile
router.get("/profile", authMiddleware, getUserProfile);

// ✅ Update profile
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profile_pic"), 
  updateUserProfile
);

export default router;