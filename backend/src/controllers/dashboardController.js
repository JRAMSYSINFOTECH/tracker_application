import prisma from "../config/prisma.js";

// ✅ 1. Overview
export const getDashboardOverview = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [total, pending, inProgress, completed, missed] = await Promise.all([
      prisma.task.count({ where: { user_id: userId } }),
      prisma.task.count({ where: { user_id: userId, status: "pending" } }),
      prisma.task.count({ where: { user_id: userId, status: "in_progress" } }),
      prisma.task.count({ where: { user_id: userId, status: "completed" } }),
      prisma.task.count({ where: { user_id: userId, status: "missed" } }),
    ]);

    res.json({ total, pending, inProgress, completed, missed });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ 2. Tasks list (search + filter)
export const getTasks = async (req, res) => {
  const userId = req.user.user_id;
  const { search, status, priority } = req.query;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        ...(status && { status }),
        ...(priority && { importance_hint: priority }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } }
          ]
        })
      },
      orderBy: { created_at: "desc" }
    });

    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ 3. Today Plan (NO TIME SLOTS)
export const getTodayPlan = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const plan = await prisma.dailyPlanItem.findMany({
      where: {
        plan: {
          user_id: userId,
          plan_date: {
            gte: today,
            lt: tomorrow
          }
        }
      },
      select: {
  plan_item_id: true,
  task_id: true,
  slot_order: true,
  start_time: true,
  end_time: true,
  item_status: true,
  confidence_score: true,
  task: {
    select: {
      title: true,
      deadline: true,
      status: true,
      importance_hint: true
    }
  }
},
      orderBy: {
        slot_order: "asc"   // ✅ IMPORTANT
      }
    });

    res.json(plan);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ 4. Reminders
export const getReminders = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        task: {
          user_id: userId
        },
        is_active: true
      },
      include: { task: true }
    });

    res.json(reminders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ 5. Priority Graph
export const getPriorityStats = async (req, res) => {
const userId = req.user.user_id;

  try {
    const [high, medium, low] = await Promise.all([
      prisma.task.count({ where: { user_id: userId, importance_hint: "high" } }),
      prisma.task.count({ where: { user_id: userId, importance_hint: "medium" } }),
      prisma.task.count({ where: { user_id: userId, importance_hint: "low" } })
    ]);

    res.json({ high, medium, low });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
