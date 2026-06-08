import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * STEP 1
 * Start Google Login
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * STEP 2
 * Google Callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    session: false,
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        {
          user_id: req.user.user_id,
          email: req.user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.json({
        success: true,
        token,
        user: {
          user_id: req.user.user_id,
          name: req.user.name,
          email: req.user.email,
          profile_pic: req.user.profile_pic,
        },
      });
    } catch (error) {
      console.error(
        "Google Callback Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Google authentication failed",
      });
    }
  }
);

export default router;