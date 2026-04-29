import prisma from "../config/prisma.js";

// ✅ Create Task
export const createTask = async (req, res) => {
  const userId = req.user.id;

  try {
    const {
      title,
      description,
      deadline,
      estimated_minutes,
      importance_hint
    } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({
        message: "Title and deadline are required"
      });
    }

    if (estimated_minutes && estimated_minutes < 0) {
      return res.status(400).json({
        message: "Estimated time must be positive"
      });
    }
    
    const task = await prisma.task.create({
      data: {
        user_id: userId,
        title,
        description,
        deadline: new Date(deadline),
        estimated_minutes,
        importance_hint
      }
    });

    res.status(201).json({
      message: "Task created successfully",
      task
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get All Tasks (with filters)
export const getAllTasks = async (req, res) => {
  const userId = req.user.id;

  const { status, priority, search } = req.query;

  try {
    const where = {
      user_id: userId
    };

    // 🔹 Status filter
    if (status) {
      where.status = status;
    }

    // 🔹 Priority filter
    if (priority) {
      where.importance_hint = priority;
    }

    // 🔹 Search filter (title)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        created_at: "desc"
      }
    });

    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get Single Task
export const getTaskById = async (req, res) => {
  const userId = req.user.id;
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

//UpdateTask
export const updateTask = async (req, res) => {
  const userId = req.user.id;
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
        ...(req.body.deadline && { deadline: new Date(req.body.deadline) })
      }
    });

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
  const userId = req.user.id;
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

    res.json({ message: "Task deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};