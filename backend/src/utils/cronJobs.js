import cron from "node-cron";
import prisma from "../config/prisma.js";

cron.schedule("* * * * *", async () => {
  console.log("⏳ Checking reminders...");

  try {
    const now = new Date();

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