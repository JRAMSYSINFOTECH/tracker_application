import cron from "node-cron";
import prisma from "../config/prisma.js";
import { spawnNextOccurrence } from "./taskUtils.js";

cron.schedule("* * * * *", async () => {
  console.log("⏳ Checking reminders...");

  try {
    const now = new Date();

    // Mark tasks as missed if deadline has passed
    const missedTasksList = await prisma.task.findMany({
      where: {
        deadline: {
          lt: now
        },
        status: {
          in: ["pending", "in_progress"]
        }
      }
    });

    if (missedTasksList.length > 0) {
      await prisma.task.updateMany({
        where: {
          task_id: {
            in: missedTasksList.map(t => t.task_id)
          }
        },
        data: {
          status: "missed"
        }
      });

      console.log(`❌ Marked ${missedTasksList.length} tasks as missed.`);

      // Spawn next occurrences for missed recurring tasks
      for (const task of missedTasksList) {
        await spawnNextOccurrence(task);
      }
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        remind_at: {
          lte: now  
        },
        is_active: true
      },
      include: {
        task: {
          select: { title: true }
        }
      }
    });

    for (const reminder of reminders) {

  // ✅ Prevent duplicate triggering
  if (!reminder.is_active) continue;

  // ✅ Deactivate first (important)
  if (reminder.frequency === "once") {
    await prisma.reminder.update({
      where: { reminder_id: reminder.reminder_id },
      data: { is_active: false }
    });
  }

  console.log(`🔔 Reminder: ${reminder.task.title}`);
}

  } catch (err) {
    console.error("Cron error:", err.message);
  }
});