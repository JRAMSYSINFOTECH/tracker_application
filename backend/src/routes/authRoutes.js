import express from "express";
import { signup, login } from "../controllers/authController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/signup", upload.single("profile_pic"), signup);
router.post("/login", login);

export default router;