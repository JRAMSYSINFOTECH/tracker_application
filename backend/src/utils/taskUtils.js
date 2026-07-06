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
  if (!["daily", "weekly", "custom"].includes(task.repeat_frequency)) return;

  const currentDeadline = new Date(task.deadline);
  const nextDeadline = getNextOccurrenceDate(task, currentDeadline);

  if (!nextDeadline) return;

  // Create new task
  await prisma.task.create({
    data: {
      user_id: task.user_id,
      title: task.title,
      description: task.description,
      estimated_minutes: task.estimated_minutes,
      importance_hint: task.importance_hint,
      repeat_frequency: task.repeat_frequency,
      repeat_days: task.repeat_days || null,
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

/**
 * Given a task and its current deadline, compute the next occurrence date.
 * - daily:  +1 day, same time
 * - weekly: +7 days, same time
 * - custom: advance to the next matching day-of-week from repeat_days
 *           repeat_days is a comma-separated list of day indices (0=Sun ... 6=Sat)
 */
export const getNextOccurrenceDate = (task, fromDate) => {
  const from = new Date(fromDate);

  if (task.repeat_frequency === "daily") {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (task.repeat_frequency === "weekly") {
    const next = new Date(from);
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (task.repeat_frequency === "custom" && task.repeat_days) {
    const days = task.repeat_days
      .split(",")
      .map(d => parseInt(d.trim()))
      .filter(d => !isNaN(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);

    if (days.length === 0) return null;

    const currentDayOfWeek = from.getDay();

    // Find the next day in the list that is strictly after the current day
    const nextDay = days.find(d => d > currentDayOfWeek);

    const daysToAdd = nextDay !== undefined
      ? nextDay - currentDayOfWeek
      : 7 - currentDayOfWeek + days[0]; // wrap to next week

    const next = new Date(from);
    next.setDate(next.getDate() + daysToAdd);
    return next;
  }

  return null;
};

export const doesTaskOccurOnDate = (task, date) => {
  const taskDate = new Date(task.deadline);
  const targetDate = new Date(date);
  
  // Compare local year, month, day to see if targetDate is before taskDate
  const taskYear = taskDate.getFullYear();
  const taskMonth = taskDate.getMonth();
  const taskDay = taskDate.getDate();
  
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  // Create Date objects representing local midnights for comparison
  const taskMidnight = new Date(taskYear, taskMonth, taskDay);
  const targetMidnight = new Date(targetYear, targetMonth, targetDay);

  if (targetMidnight < taskMidnight) {
    return false; // Cannot occur before the task's start date
  }

  switch (task.repeat_frequency) {
    case "once":
      return taskYear === targetYear && taskMonth === targetMonth && taskDay === targetDay;

    case "daily":
      return true;

    case "weekly": {
      return taskDate.getDay() === targetDate.getDay();
    }

    case "custom": {
      if (!task.repeat_days) return false;
      const days = task.repeat_days
        .split(",")
        .map(d => parseInt(d.trim()))
        .filter(d => !isNaN(d));
      return days.includes(targetDate.getDay());
    }

    default:
      return false;
  }
};

