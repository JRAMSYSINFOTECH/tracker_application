import prisma from "../config/prisma.js";

// ✅ 1. Overview
export const getDashboardOverview = async (req, res) => {
  const userId = req.user.id;

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
  const userId = req.user.id;
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
  const userId = req.user.id;

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
  item_status: true,
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
  const userId = req.user.id;

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
  const userId = req.user.id;

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


// ✅ 6. Generate Daily Plan (NO TIME SLOTS)
export const generateDailyPlan = async (req, res) => {
  const userId = req.user.id;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🔹 1. Get tasks (exclude completed)
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        status: {
          not: "completed"
        }
      },
      orderBy: [
        { importance_hint: "desc" }, // high → low
        { deadline: "asc" }
      ]
    });

    if (tasks.length === 0) {
      return res.json({ message: "No tasks to plan" });
    }

    // 🔹 2. Create or find today's plan
    let plan = await prisma.dailyPlan.findFirst({
      where: {
        user_id: userId,
        plan_date: today
      }
    });

    if (!plan) {
      plan = await prisma.dailyPlan.create({
        data: {
          user_id: userId,
          plan_date: today
        }
      });
    }

    // 🔹 3. Clear old plan
    await prisma.dailyPlanItem.deleteMany({
      where: { plan_id: plan.plan_id }
    });

    // 🔥 4. Only ORDER tasks (NO TIME)
    const items = tasks.map((task, index) => ({
      plan_id: plan.plan_id,
      task_id: task.task_id,
      slot_order: index + 1
    }));

    // 🔹 5. Save
    await prisma.dailyPlanItem.createMany({
      data: items
    });

    res.json({
      message: "Daily plan generated successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};