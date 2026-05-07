import prisma from "../config/prisma.js";

export const updatePlanItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("ID:", id); // debug

  try {
    const item = await prisma.dailyPlanItem.update({
      where: { plan_item_id: parseInt(id) },
      data: {
        item_status: status
      }
    });

    if (status === "completed") {
      await prisma.task.update({
        where: { task_id: item.task_id },
        data: { status: "completed" }
      });
    }

    res.json({ message: "Updated", item });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};