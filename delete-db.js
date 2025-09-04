import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    await prisma.user.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.feature.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.projectMember.deleteMany({});
    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
