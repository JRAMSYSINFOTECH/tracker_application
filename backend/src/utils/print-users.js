import prisma from "../config/prisma.js";

async function main() {
  try {
    const users = await prisma.user.findMany({});
    console.log("Current users in DB:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error reading database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
