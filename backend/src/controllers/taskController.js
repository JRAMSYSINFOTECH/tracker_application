import prisma from "../config/prisma.js";

import { markPlanAsStale, spawnNextOccurrence, doesTaskOccurOnDate } from "../utils/taskUtils.js";


// ✅ Create Task
export const createTask = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const {
      title,
      deadline,
      estimated_minutes,
      status,
      repeat_frequency,
      repeat_days,
      description,
      importance_hint
    } = req.body;


    if (!title || !deadline) {
      return res.status(400).json({
        message: "Title and deadline are required"
      });
    }
    console.log("STATUS:", status);
    console.log(req.body);
    // ✅ Deadline validation
    if (
      status !== "completed" &&
      new Date(deadline) < new Date()
    ) {
      return res.status(400).json({
        message: "Deadline cannot be in the past"
      });
    }

    if (estimated_minutes && estimated_minutes < 0) {
      return res.status(400).json({
        message: "Estimated time must be positive"
      });
    }
    const user_id = req.user.user_id;
    const task = await prisma.task.create({
      data: {
        user_id,
        title,
        description: description || null,
        importance_hint: importance_hint || null,
        deadline,
        estimated_minutes: estimated_minutes || 60,
        status,
        repeat_frequency: repeat_frequency || "once",
        repeat_days: repeat_days || null
      },
    });

    if (req.body.reminder) {
      await prisma.reminder.create({
        data: {
          task_id: task.task_id,
          remind_at: new Date(deadline),
          frequency: repeat_frequency || "once"
        }
      });
    }

    await markPlanAsStale(userId);

    res.status(201).json({
      message: "Task created successfully",
      task
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get All Tasks
export const getAllTasks = async (req, res) => {
  const userId = req.user.user_id;
  const { status, priority, search } = req.query;

  try {
    const where = { user_id: userId };

    if (status) where.status = status;
    if (priority) where.importance_hint = priority;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { created_at: "desc" }
    });

    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get Single Task
export const getTaskById = async (req, res) => {
  const userId = req.user.user_id;
  const taskId = parseInt(req.params.id);

  try {
    const task = await prisma.task.findFirst({
      where: {
        task_id: taskId,
        user_id: userId
      }
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Task
export const updateTask = async (req, res) => {
  const userId = req.user.user_id;
  const taskId = parseInt(req.params.id);

  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        task_id: taskId,
        user_id: userId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedTask = await prisma.task.update({
      where: { task_id: taskId },
      data: {
        ...(req.body.title && { title: req.body.title }),
        ...(req.body.description && { description: req.body.description }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.importance_hint && { importance_hint: req.body.importance_hint }),
        ...(req.body.estimated_minutes && { estimated_minutes: req.body.estimated_minutes }),
        ...(req.body.deadline && { deadline: new Date(req.body.deadline) }),
        ...(req.body.repeat_frequency && { repeat_frequency: req.body.repeat_frequency }),
        ...(req.body.repeat_days !== undefined && { repeat_days: req.body.repeat_days })
      }
    });

    if (req.body.deadline || req.body.repeat_frequency) {
      const existingReminder = await prisma.reminder.findFirst({
        where: { task_id: taskId }
      });
      if (existingReminder) {
        await prisma.reminder.update({
          where: { reminder_id: existingReminder.reminder_id },
          data: {
            ...(req.body.deadline && { remind_at: new Date(req.body.deadline) }),
            ...(req.body.repeat_frequency && { frequency: req.body.repeat_frequency })
          }
        });
      }
    }

    if (updatedTask.status === "completed") {
      await spawnNextOccurrence(updatedTask);
    }

    await markPlanAsStale(userId);

    res.json({
      message: "Task updated successfully",
      task: updatedTask
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Delete Task
export const deleteTask = async (req, res) => {
  const userId = req.user.user_id;
  const taskId = parseInt(req.params.id);

  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        task_id: taskId,
        user_id: userId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({
      where: { task_id: taskId }
    });

    await markPlanAsStale(userId);

    res.json({ message: "Task deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Check Time Overlap
export const checkOverlap = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const { deadline, estimated_minutes, exclude_task_id } = req.body;

    if (!deadline || !estimated_minutes) {
      return res.status(400).json({
        message: "deadline and estimated_minutes are required"
      });
    }

    const startTime = new Date(deadline);
    const endTime = new Date(startTime.getTime() + Number(estimated_minutes) * 60 * 1000);

    const userTasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        status: { notIn: ["completed", "missed"] },
        ...(exclude_task_id && { task_id: { not: Number(exclude_task_id) } })
      }
    });

    const targetDate = new Date(deadline);
    const overlapping = [];

    for (const task of userTasks) {
      if (doesTaskOccurOnDate(task, targetDate)) {
        const taskDate = new Date(task.deadline);
        const occStart = new Date(targetDate);
        occStart.setHours(taskDate.getHours(), taskDate.getMinutes(), taskDate.getSeconds(), taskDate.getMilliseconds());
        const occEnd = new Date(occStart.getTime() + (task.estimated_minutes || 60) * 60 * 1000);

        if (occStart < endTime && occEnd > startTime) {
          overlapping.push({
            task_id: task.task_id,
            title: task.title,
            start: occStart,
            end: occEnd
          });
        }
      }
    }

    if (overlapping.length > 0) {
      return res.json({
        hasOverlap: true,
        conflicts: overlapping
      });
    }

    res.json({ hasOverlap: false, conflicts: [] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Mark Task Occurrence (per-day completion for recurring tasks)
export const markOccurrence = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const { task_id, occurrence_date, status } = req.body;

    if (!task_id || !occurrence_date || !status) {
      return res.status(400).json({ message: "task_id, occurrence_date and status are required" });
    }

    const validStatuses = ["pending", "completed", "skipped"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Verify task belongs to this user
    const task = await prisma.task.findFirst({
      where: { task_id: Number(task_id), user_id: userId }
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Upsert occurrence record
    const occurrence = await prisma.taskOccurrence.upsert({
      where: {
        task_id_occurrence_date: {
          task_id: Number(task_id),
          occurrence_date: new Date(occurrence_date)
        }
      },
      create: {
        task_id: Number(task_id),
        occurrence_date: new Date(occurrence_date),
        status
      },
      update: { status }
    });

    res.json({ message: "Occurrence updated", occurrence });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Task Occurrences for a date range
export const getOccurrences = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const occurrences = await prisma.taskOccurrence.findMany({
      where: {
        occurrence_date: {
          gte: dateStart,
          lte: dateEnd
        },
        task: { user_id: userId }
      },
      include: {
        task: { select: { title: true, repeat_frequency: true } }
      }
    });

    res.json(occurrences);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};