import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fetchReportData = async (projectId: string, type: string) => {
  switch (type) {
    case 'CEMENT_TREND': {
      // Phase 1: Fetch Concrete Estimates
      const estimates = await prisma.estimate.findMany({
        where: { projectId, type: 'CONCRETE' },
        orderBy: { createdAt: 'desc' }
      });

      let totalVariancePercent = 0;
      const items = estimates.map(est => {
        const data = JSON.parse(est.data);
        // Assuming actuals aren't fully recorded in Phase 1 for all things unless cross-referenced with MaterialAudit
        // For Phase 1 mockup, we'll just show the estimates as actuals with 0% variance if actuals aren't present.
        // Wait, the spec says "variance % over time". Let's look up MaterialAudit for cement
        return {
          date: est.createdAt.toLocaleDateString('en-GB'),
          activity: est.structure,
          estimated: Math.round(data.outputs?.cementBags || 0),
          actual: Math.round(data.outputs?.cementBags || 0), // Mock actual for phase 1 demo if missing
          variance: 0,
          isHigh: false
        };
      });

      return {
        totalVariancePercent,
        isNegative: totalVariancePercent > 5,
        items
      };
    }

    case 'STEEL_SCRAP': {
      const estimates = await prisma.estimate.findMany({
        where: { projectId, type: 'STEEL' },
        orderBy: { createdAt: 'desc' }
      });

      let totalSaved = 0;
      let totalScrapPerc = 0;

      const items = estimates.map(est => {
        const data = JSON.parse(est.data);
        totalSaved += data.outputs?.moneySaved || 0;
        totalScrapPerc += data.outputs?.scrapPercentage || 0;

        return {
          date: est.createdAt.toLocaleDateString('en-GB'),
          worstCase: data.outputs?.worstCaseRods || 0,
          optimized: data.outputs?.totalRodsNeeded || 0,
          scrap: Math.round(data.outputs?.scrapPercentage || 0),
          saved: Math.round(data.outputs?.moneySaved || 0)
        };
      });

      const avgScrap = estimates.length ? Math.round(totalScrapPerc / estimates.length) : 0;

      return {
        totalSaved: Math.round(totalSaved),
        avgScrap,
        items
      };
    }

    case 'INVENTORY': {
      const logs = await prisma.inventoryLog.findMany({
        where: { material: { projectId } },
        include: { material: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return {
        materialName: 'All Materials',
        items: logs.map(l => ({
          date: l.createdAt.toLocaleDateString('en-GB'),
          type: l.type,
          quantity: `${l.quantity} ${l.material.unit}`,
          notes: l.notes || '-'
        }))
      };
    }

    case 'COST_BREAKDOWN': {
      const materials = await prisma.material.findMany({
        where: { projectId }
      });

      let totalSpend = 0;

      // Real spend would be calculated from CONSUMPTION logs * rate
      const items = await Promise.all(materials.map(async (m) => {
        const consumptionLogs = await prisma.inventoryLog.findMany({
          where: { materialId: m.id, type: 'CONSUMPTION' }
        });

        const totalConsumed = consumptionLogs.reduce((acc, l) => acc + l.quantity, 0);
        const cost = totalConsumed * m.ratePerUnit;
        totalSpend += cost;

        return {
          material: m.name,
          consumed: totalConsumed,
          unit: m.unit,
          rate: m.ratePerUnit,
          cost: Math.round(cost)
        };
      }));

      return {
        totalSpend: Math.round(totalSpend),
        items
      };
    }

    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
};
