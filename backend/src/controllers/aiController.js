import prisma from "../config/prisma.js";

export const analyzeTask = async (req, res) => {
  const userId = req.user.id;
  const { task_id } = req.body;

  try {
    const task = await prisma.task.findFirst({
      where: {
        task_id: parseInt(task_id),
        user_id: userId
      }
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    let priority = "low";
    let reason = "";
    let score = 0.5;

    const title = task.title.toLowerCase();
    const description = (task.description || "").toLowerCase();

    // 🔥 1. Keyword-based
    if (title.includes("urgent") || description.includes("urgent")) {
      priority = "high";
      reason = "Contains urgent keyword";
      score = 0.9;
    }

    // 🔥 2. Deadline-based
    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 24) {
      priority = "high";
      reason = "Deadline within 24 hours";
      score = 0.85;
    } else if (diffHours < 72) {
      priority = "medium";
      reason = "Deadline within 3 days";
      score = 0.7;
    }

    // 🔥 Save analysis
    const analysis = await prisma.aiTaskAnalysis.create({
      data: {
        task_id: task.task_id,
        predicted_priority: priority,
        reason,
        confidence_score: score
      }
    });

    res.json({
      message: "AI analysis completed",
      analysis
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};