const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const latest = await prisma.pileMeasurement.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('LATEST:', latest);
}

run().finally(() => prisma.$disconnect());
