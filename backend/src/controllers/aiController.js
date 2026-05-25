import prisma from "../config/prisma.js";
import axios from "axios";


// ================= 🛠️ REMOVE OVERLAPS =================
function removeTimeOverlaps(plan) {

  plan.sort((a, b) =>
    new Date(a.start) - new Date(b.start)
  );

  for (let i = 1; i < plan.length; i++) {

    const prev = plan[i - 1];
    const curr = plan[i];

    const prevEnd = new Date(prev.end);
    const currStart = new Date(curr.start);
    const currEnd = new Date(curr.end);

    if (currStart < prevEnd) {

      const duration = currEnd - currStart;

      curr.start = new Date(prevEnd);

      curr.end = new Date(
        prevEnd.getTime() + duration
      );
    }
  }

  return plan;
}


// ================= 🔁 AI RETRY =================
async function callAIWithRetry(prompt, retries = 2) {

  for (let attempt = 1; attempt <= retries; attempt++) {

    try {

      console.log(`🤖 AI Attempt ${attempt}`);

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-oss-120b:free",

          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          headers: {
            Authorization:
              `Bearer ${process.env.OPENROUTER_API_KEY}`,

            "Content-Type": "application/json"
          }
        }
      );

      let text =
        response.data.choices[0].message.content;

      // 🧹 remove markdown
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(text);

      const plan = Array.isArray(parsed)
        ? parsed
        : parsed.schedule;

      if (!Array.isArray(plan) || plan.length === 0) {

        throw new Error("Invalid AI plan");
      }

      return plan;

    } catch (err) {

      console.warn(
        `⚠️ AI attempt ${attempt} failed:`,
        err.message
      );

      await new Promise(res =>
        setTimeout(res, 1000)
      );

      if (attempt === retries) {

        throw new Error(
          "AI failed after retries"
        );
      }
    }
  }
}


// ================= 🧠 CONFIDENCE =================
function calculateConfidence(task, isAI) {

  let score = 0.5;

  const now = new Date();

  const deadline = new Date(task.deadline);

  const hoursLeft =
    (deadline - now) / (1000 * 60 * 60);

  // urgency
  if (hoursLeft < 24) {
    score += 0.3;
  }
  else if (hoursLeft < 72) {
    score += 0.2;
  }

  // priority
  if (task.importance_hint === "high") {
    score += 0.2;
  }
  else if (task.importance_hint === "medium") {
    score += 0.1;
  }

  // AI boost
  if (isAI) {
    score += 0.1;
  }

  return Math.min(score, 1);
}


// ================= ANALYZE TASK =================
export const analyzeTask = async (req, res) => {

  const userId = req.user.user_id;

  const { task_id } = req.body;

  try {

    const task = await prisma.task.findFirst({
      where: {
        task_id: parseInt(task_id),
        user_id: userId
      }
    });

    if (!task) {

      return res.status(404).json({
        message: "Task not found"
      });
    }

    let priority = "low";

    let reason = "";

    let score = 0.5;

    const title = task.title.toLowerCase();

    const description =
      (task.description || "").toLowerCase();

    if (
      title.includes("urgent") ||
      description.includes("urgent")
    ) {

      priority = "high";

      reason = "Contains urgent keyword";

      score = 0.9;
    }

    const now = new Date();

    const deadline = new Date(task.deadline);

    const diffHours =
      (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 24) {

      priority = "high";

      reason = "Deadline within 24 hours";

      score = 0.85;
    }
    else if (diffHours < 72) {

      priority = "medium";

      reason = "Deadline within 3 days";

      score = 0.7;
    }

    const analysis =
      await prisma.aiTaskAnalysis.create({
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

    res.status(500).json({
      error: err.message
    });
  }
};


// ================= GENERATE PLAN =================
export const generatePlan = async (req, res) => {

  const userId = req.user.user_id;

  try {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // ================= TASKS =================
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        status: "pending"
      },
      orderBy: [
        { importance_hint: "desc" },
        { deadline: "asc" }
      ]
    });

    // ================= FIXED EVENTS =================
    const fixedEvents =
      await prisma.fixedEvent.findMany({
        where: {
          user_id: userId
        },
        orderBy: {
          start_time: "asc"
        }
      });

    if (tasks.length === 0) {

      return res.status(400).json({
        message: "No pending tasks"
      });
    }

    // ================= FORMAT TASKS =================
    const taskData = tasks.map(task => ({
      task_id: task.task_id,
      title: task.title,
      duration:
        task.estimated_minutes || 60,
      priority: task.importance_hint,
      deadline: task.deadline
    }));


    // ================= FORMAT EVENTS =================
    const eventData = fixedEvents.map(event => ({
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      type: event.event_type
    }));


    // ================= PLAN =================
    let plan = await prisma.dailyPlan.findUnique({
      where: {
        user_id_plan_date: {
          user_id: userId,
          plan_date: today
        }
      }
    });

    if (plan) {

      await prisma.dailyPlanItem.deleteMany({
        where: {
          plan_id: plan.plan_id
        }
      });
    }
    else {

      plan = await prisma.dailyPlan.create({
        data: {
          user_id: userId,
          plan_date: today,
          status: "generated"
        }
      });
    }


    // ================= AI =================
    let aiPlan = [];

    let usedAI = true;

    try {

      const prompt = `
You are an intelligent AI productivity scheduler.

Create a realistic daily schedule.

RULES:
1. Do NOT overlap tasks
2. Respect fixed events
3. Add 10 minute breaks between tasks
4. Schedule only pending tasks
5. Return ONLY valid JSON array
6. No markdown
7. No explanation
8. Avoid scheduling during fixed events
9. Tasks must not overlap meetings
10. Start after fixed events if needed

TASKS:
${JSON.stringify(taskData, null, 2)}

FIXED EVENTS:
${JSON.stringify(eventData, null, 2)}

RETURN FORMAT:
[
  {
    "task_id": 1,
    "start": "2026-05-06T09:00:00Z",
    "end": "2026-05-06T10:00:00Z"
  }
]
`;

      aiPlan = await callAIWithRetry(
        prompt,
        2
      );

    } catch (err) {

      console.warn(
        "⚠️ Using fallback plan"
      );

      usedAI = false;

      let currentTime = new Date();

      aiPlan = tasks.map(task => {

        const start = new Date(currentTime);

        const end = new Date(currentTime);

        end.setMinutes(
          end.getMinutes() +
          (task.estimated_minutes || 60)
        );

        currentTime = new Date(end);

        currentTime.setMinutes(
          currentTime.getMinutes() + 10
        );

        return {
          task_id: task.task_id,
          start,
          end
        };
      });
    }


    // ================= REMOVE EVENT OVERLAPS =================
    const noConflictPlan = aiPlan.filter(item => {

      const itemStart = new Date(item.start);

      const itemEnd = new Date(item.end);

      const hasConflict = fixedEvents.some(event => {

        const eventStart =
          new Date(event.start_time);

        const eventEnd =
          new Date(event.end_time);

        return (
          itemStart < eventEnd &&
          itemEnd > eventStart
        );
      });

      return !hasConflict;
    });


    // ================= REMOVE DUPLICATES =================
    const seen = new Set();

    let filteredPlan =
      noConflictPlan.filter(item => {

        if (!item.task_id) {
          return false;
        }

        if (seen.has(item.task_id)) {
          return false;
        }

        seen.add(item.task_id);

        return true;
      });


    // ================= FIX OVERLAPS =================
    filteredPlan =
      removeTimeOverlaps(filteredPlan);


    // ================= SAVE =================
    const planItems =
      filteredPlan.map((item, index) => {

        const task =
          tasks.find(
            t => t.task_id === item.task_id
          );

        return {
          plan_id: plan.plan_id,
          task_id: item.task_id,

          start_time:
            new Date(item.start),

          end_time:
            new Date(item.end),

          slot_order: index + 1,

          item_status: "scheduled",

          confidence_score:
            calculateConfidence(
              task,
              usedAI
            )
        };
      });


    await prisma.dailyPlanItem.createMany({
      data: planItems
    });


    await prisma.dailyPlan.update({
      where: {
        plan_id: plan.plan_id
      },
      data: {
        status: "generated",
        generated_at: new Date()
      }
    });


    const finalPlan =
      await prisma.dailyPlan.findUnique({
        where: {
          plan_id: plan.plan_id
        },
        include: {
          items: {
            include: {
              task: true
            },
            orderBy: {
              slot_order: "asc"
            }
          }
        }
      });


    // ================= PROGRESS =================
    const total =
      finalPlan.items.length;

    const completed =
      finalPlan.items.filter(
        item =>
          item.item_status ===
          "completed"
      ).length;

    const progress =
      total === 0
        ? 0
        : (completed / total) * 100;


    // ================= RESPONSE =================
    res.json({
      message: "AI plan generated",
      progress: Math.round(progress),
      fixed_events: fixedEvents,
      plan: finalPlan
    });

  } catch (err) {

    console.error(
      "PLAN ERROR:",
      err
    );

    res.status(500).json({
      error: "Failed to generate plan"
    });
  }
};