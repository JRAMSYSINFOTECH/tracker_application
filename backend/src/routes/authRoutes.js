import express from "express";

import {
  signup,
  login,
  googleMobileLogin,
} from "../controllers/authController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

/**
 * Signup
 */
router.post(
  "/signup",
  upload.single("profile_pic"),
  signup
);

/**
 * Login
 */
router.post(
  "/login",
  login
);

/**
 * Google Mobile Login
 */
router.post(
  "/google-mobile",
  googleMobileLogin
);

export default router;