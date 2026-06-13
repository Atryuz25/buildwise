const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

async function run() {
  const project = await prisma.project.findFirst();
  const projectId = project.id;
  const engineerId = '5bc1708a-3627-475d-88cb-bdc5e116ffbd'; // Seeded user

  // 1. Verify Overdue Milestone
  await prisma.paymentMilestone.create({
    data: {
      projectId,
      title: 'Past Due Milestone',
      amount: 1000,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'UPCOMING'
    }
  });
  const ms = await prisma.paymentMilestone.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log('Created past due milestone in DB. Status in DB is:', ms.status);

  // 2. Efficiency logic manual calc
  const crews = await prisma.crew.findMany({ include: { outputs: true, attendances: true } });
  if (crews.length > 0) {
    const c = crews[0];
    const totalTarget = c.outputs.reduce((acc, o) => acc + o.targetQty, 0);
    const totalActual = c.outputs.reduce((acc, o) => acc + o.actualQty, 0);
    const outputRatio = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    
    let expectedWorkers = c.attendances.length * c.size;
    let actualWorkers = c.attendances.reduce((acc, a) => acc + a.presentCount, 0);
    const attendanceRatio = expectedWorkers > 0 ? (actualWorkers / expectedWorkers) * 100 : 0;
    
    const efficiency = Math.round((outputRatio * 0.6) + (attendanceRatio * 0.4));
    console.log(`Manual Efficiency for Crew ${c.id}: (${outputRatio.toFixed(1)} * 0.6) + (${attendanceRatio.toFixed(1)} * 0.4) = ${efficiency}%`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
