import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const contractors = await prisma.contractor.findMany();
  console.log('Contractors bank details:');
  contractors.forEach(c => console.log(c.name, c.bankDetails));
  
  const milestones = await prisma.paymentMilestone.findMany();
  console.log('\nMilestones:');
  milestones.forEach(m => console.log(m.title, m.dueDate, m.status));
}

run().catch(console.error).finally(() => prisma.$disconnect());
