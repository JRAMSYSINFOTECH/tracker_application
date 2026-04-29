import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import "./utils/cronJobs.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ FIX: session + passport BEFORE routes
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes AFTER passport setup
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/auth", googleAuthRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

export default app;