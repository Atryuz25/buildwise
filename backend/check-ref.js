const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const refs = await prisma.aiReferencePhoto.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("REFERENCES:");
  console.dir(refs, {depth: null});
  process.exit(0);
}

check();
