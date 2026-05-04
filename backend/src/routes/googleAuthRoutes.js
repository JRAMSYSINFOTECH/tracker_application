import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();
const defaultFrontendUrl = process.env.FRONTEND_URL || "http://localhost:8081";

const getSafeFrontendUrl = (value) => {
  if (!value || typeof value !== "string") {
    return defaultFrontendUrl;
  }

  try {
    const url = new URL(value);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);

    if (isLocalhost && ["http:", "https:"].includes(url.protocol)) {
      return url.origin;
    }
  } catch {
    return defaultFrontendUrl;
  }

  return defaultFrontendUrl;
};

const getFrontendUrl = (req) => req.session?.googleReturnTo || defaultFrontendUrl;

router.get(
  "/google",
  (req, res, next) => {
    req.session.googleReturnTo = getSafeFrontendUrl(req.query.returnUrl);
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  (req, res, next) =>
    passport.authenticate("google", (err, user) => {
      const frontendUrl = getFrontendUrl(req);

      if (err || !user) {
        return res.redirect(
          `${frontendUrl}/login?googleError=Google%20login%20failed`
        );
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.redirect(
            `${frontendUrl}/login?googleError=Google%20login%20failed`
          );
        }

        next();
      });
    })(req, res, next),
  (req, res) => {
    const frontendUrl = getFrontendUrl(req);
    const token = jwt.sign(
      { id: req.user.user_id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    delete req.session.googleReturnTo;
    res.redirect(`${frontendUrl}/auth-callback?token=${encodeURIComponent(token)}`);
  }
);

export default router;
