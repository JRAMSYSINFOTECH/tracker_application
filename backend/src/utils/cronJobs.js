import cron from "node-cron";
import prisma from "../config/prisma.js";
import { spawnNextOccurrence, getNextOccurrenceDate } from "./taskUtils.js";

cron.schedule("* * * * *", async () => {
  console.log("⏳ Checking reminders...");

  try {
    const now = new Date();

    // ✅ Only mark NON-recurring tasks as missed when their deadline passes.
    // Recurring tasks (daily, weekly, custom) should never be permanently missed —
    // they get a new deadline via spawnNextOccurrence instead.
    const missedTasksList = await prisma.task.findMany({
      where: {
        deadline: { lt: now },
        status: { in: ["pending", "in_progress"] },
        repeat_frequency: "once"  // ← Only one-off tasks become "missed"
      }
    });

    if (missedTasksList.length > 0) {
      await prisma.task.updateMany({
        where: {
          task_id: { in: missedTasksList.map(t => t.task_id) }
        },
        data: { status: "missed" }
      });

      console.log(`❌ Marked ${missedTasksList.length} once tasks as missed.`);
    }

    // ✅ For recurring tasks with a passed deadline, spawn next occurrence
    const overdueRecurringTasks = await prisma.task.findMany({
      where: {
        deadline: { lt: now },
        status: { in: ["pending", "in_progress"] },
        repeat_frequency: { in: ["daily", "weekly", "custom"] },
        next_instance_created: false
      }
    });

    for (const task of overdueRecurringTasks) {
      console.log(`🔄 Spawning next occurrence for recurring task: ${task.title}`);
      await spawnNextOccurrence(task);
    }

    // ✅ Handle due reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        remind_at: { lte: now },
        is_active: true
      },
      include: {
        task: {
          select: { title: true, repeat_frequency: true, repeat_days: true, deadline: true }
        }
      }
    });

    for (const reminder of reminders) {
      if (!reminder.is_active) continue;

      console.log(`🔔 Reminder: ${reminder.task.title}`);

      if (reminder.frequency === "once") {
        // One-shot: deactivate permanently
        await prisma.reminder.update({
          where: { reminder_id: reminder.reminder_id },
          data: { is_active: false }
        });
      } else if (reminder.frequency === "daily") {
        // Daily: advance remind_at by exactly 1 day
        const nextRemindAt = new Date(reminder.remind_at);
        nextRemindAt.setDate(nextRemindAt.getDate() + 1);
        await prisma.reminder.update({
          where: { reminder_id: reminder.reminder_id },
          data: { remind_at: nextRemindAt }
        });
      } else if (reminder.frequency === "weekly") {
        // Weekly: advance remind_at by 7 days
        const nextRemindAt = new Date(reminder.remind_at);
        nextRemindAt.setDate(nextRemindAt.getDate() + 7);
        await prisma.reminder.update({
          where: { reminder_id: reminder.reminder_id },
          data: { remind_at: nextRemindAt }
        });
      } else if (reminder.frequency === "custom") {
        // Custom: advance to the next matching day from task's repeat_days
        const mockTask = {
          repeat_frequency: "custom",
          repeat_days: reminder.task.repeat_days
        };
        const nextDate = getNextOccurrenceDate(mockTask, reminder.remind_at);
        if (nextDate) {
          await prisma.reminder.update({
            where: { reminder_id: reminder.reminder_id },
            data: { remind_at: nextDate }
          });
        } else {
          // No valid next day found — deactivate
          await prisma.reminder.update({
            where: { reminder_id: reminder.reminder_id },
            data: { is_active: false }
          });
        }
      }
    }

  } catch (err) {
    console.error("Cron error:", err.message);
  }
});