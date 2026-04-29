import prisma from "../config/prisma.js";

// ✅ Create Reminder
export const createReminder = async (req, res) => {
  const userId = req.user.id;

  try {
    const { task_id, remind_at, frequency } = req.body;

    // ✅ 1. Validate
    if (!task_id || !remind_at || !frequency) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const validFrequencies = ["once", "daily", "weekly", "custom"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        message: "Invalid frequency"
      });
    }

    // ✅ 2. Check task ownership
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

    // ✅ 3. Create reminder
    const reminder = await prisma.reminder.create({
      data: {
        task_id: parseInt(task_id),
        remind_at: new Date(remind_at),
        frequency
      }
    });

    res.status(201).json({
      message: "Reminder created",
      reminder
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get Due Reminders (FIX 1 applied)
export const getReminders = async (req, res) => {
  const userId = req.user.id;

  try {
    const now = new Date(); // ✅ FIX (store once)

    const reminders = await prisma.reminder.findMany({
      where: {
        is_active: true,
        remind_at: {
          lte: now   // ✅ only due reminders
        },
        task: {
          user_id: userId
        }
      },
      include: {
        task: {
          select: {
            title: true,
            deadline: true,
            status: true
          }
        }
      },
      orderBy: {
        remind_at: "asc"
      }
    });

    res.json(reminders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Update Reminder (FIX 2 applied)
export const updateReminder = async (req, res) => {
  const userId = req.user.id;
  const reminderId = Number(req.params.id);

if (!reminderId) {
  return res.status(400).json({ message: "Invalid reminder ID" });
}

  try {
    const { remind_at, frequency } = req.body;

// ✅ 1. Validate fields
if (!remind_at || !frequency) {
  return res.status(400).json({
    message: "remind_at and frequency are required"
  });
}

// ✅ 2. Validate date format (ADD HERE)
const remindDate = new Date(remind_at);

if (isNaN(remindDate)) {
  return res.status(400).json({
    message: "Invalid date format"
  });
}

// ✅ 3. Validate frequency
const validFrequencies = ["once", "daily", "weekly", "custom"];
if (!validFrequencies.includes(frequency)) {
  return res.status(400).json({
    message: "Invalid frequency"
  });
  }

    // ✅ Check ownership
    const reminder = await prisma.reminder.findFirst({
      where: {
        reminder_id: reminderId,
        task: {
          user_id: userId
        }
      }
    });

    if (!reminder) {
      return res.status(404).json({
        message: "Reminder not found"
      });
    }

    // ✅ Update (FIX: Reactivate reminder)
    const updatedReminder = await prisma.reminder.update({
      where: { reminder_id: reminderId },
      data: {
        remind_at: remindDate,
        frequency,
        is_active: true   // ✅ FIX (reactivate)
      }
    });

    res.json({
      message: "Reminder updated successfully",
      reminder: updatedReminder
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Delete Reminder
export const deleteReminder = async (req, res) => {
  const userId = req.user.id;
  const reminderId = parseInt(req.params.id);

  try {
    // ✅ Check ownership
    const reminder = await prisma.reminder.findFirst({
      where: {
        reminder_id: reminderId,
        task: {
          user_id: userId
        }
      }
    });

    if (!reminder) {
      return res.status(404).json({
        message: "Reminder not found"
      });
    }

    // ✅ Delete
    await prisma.reminder.delete({
      where: { reminder_id: reminderId }
    });

    res.json({
      message: "Reminder deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};