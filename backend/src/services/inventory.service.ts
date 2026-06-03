import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const calculateBurnRateAndDays = async (materialId: string, currentStock: number) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await prisma.inventoryLog.findMany({
    where: {
      materialId,
      type: 'CONSUMPTION',
      createdAt: { gte: sevenDaysAgo }
    }
  });

  const totalConsumed = logs.reduce((sum, l) => sum + l.quantity, 0);
  const burnRate7Day = totalConsumed / 7;

  let daysRemaining = null;
  if (burnRate7Day > 0) {
    daysRemaining = currentStock / burnRate7Day;
  }

  return { burnRate7Day, daysRemaining };
};
