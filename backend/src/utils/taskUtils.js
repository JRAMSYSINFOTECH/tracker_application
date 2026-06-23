import prisma from "../config/prisma.js";

// Helper: Mark plan as stale only if exists
export const markPlanAsStale = async (userId) => {
  const existingPlan = await prisma.dailyPlan.findFirst({
    where: {
      user_id: userId,
      status: "generated"
    }
  });

  if (existingPlan) {
    await prisma.dailyPlan.updateMany({
      where: {
        user_id: userId,
        status: "generated"
      },
      data: {
        status: "stale"
      }
    });
  }
};

export const spawnNextOccurrence = async (task) => {
  if (task.next_instance_created) return;
  if (!["daily", "weekly"].includes(task.repeat_frequency)) return;

  const currentDeadline = new Date(task.deadline);
  const nextDeadline = new Date(currentDeadline);

  if (task.repeat_frequency === "daily") {
    nextDeadline.setDate(nextDeadline.getDate() + 1);
  } else if (task.repeat_frequency === "weekly") {
    nextDeadline.setDate(nextDeadline.getDate() + 7);
  }

  // Create new task
  await prisma.task.create({
    data: {
      user_id: task.user_id,
      title: task.title,
      description: task.description,
      estimated_minutes: task.estimated_minutes,
      importance_hint: task.importance_hint,
      repeat_frequency: task.repeat_frequency,
      deadline: nextDeadline,
      status: "pending",
      next_instance_created: false
    }
  });

  // Mark original as having spawned next instance
  await prisma.task.update({
    where: { task_id: task.task_id },
    data: { next_instance_created: true }
  });

  await markPlanAsStale(task.user_id);
};
