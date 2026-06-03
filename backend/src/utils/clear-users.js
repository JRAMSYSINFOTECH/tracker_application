import prisma from "../config/prisma.js";

async function main() {
  try {
    // Delete dependent tables first due to foreign keys
    await prisma.dailyPlanItem.deleteMany({});
    await prisma.dailyPlan.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.aiTaskAnalysis.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.fixedEvent.deleteMany({});
    
    // Now delete users
    const result = await prisma.user.deleteMany({});
    console.log(`Successfully deleted ${result.count} users.`);
  } catch (error) {
    console.error("Error clearing users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
