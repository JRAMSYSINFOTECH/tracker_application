import prisma from "../config/prisma.js";


// ================= CREATE EVENT =================
export const createFixedEvent = async (req, res) => {
  const userId = req.user.user_id;

  try {

    const {
      title,
      description,
      start_time,
      end_time,
      event_type
    } = req.body;

    const event = await prisma.fixedEvent.create({
      data: {
        user_id: userId,
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        event_type
      }
    });

    res.json({
      message: "Fixed event created",
      event
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
};


// ================= GET EVENTS =================
export const getFixedEvents = async (req, res) => {

  const userId = req.user.user_id;

  try {

    const events = await prisma.fixedEvent.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        start_time: "asc"
      }
    });

    res.json(events);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
};


// ================= DELETE EVENT =================
export const deleteFixedEvent = async (req, res) => {

  const { id } = req.params;

  try {

    await prisma.fixedEvent.delete({
      where: {
        event_id: parseInt(id)
      }
    });

    res.json({
      message: "Event deleted"
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
};