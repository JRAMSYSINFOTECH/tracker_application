import prisma from "./src/config/prisma.js";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      user_id: true,
      name: true,
      email: true,
      profile_pic: true,
    }
  });
  console.log("Users in Database:");
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
