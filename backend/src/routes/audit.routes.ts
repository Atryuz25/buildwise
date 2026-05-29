import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST new audit
router.post('/', async (req, res) => {
  try {
    const { projectId, engineerId, date, activity, weather, siteNotes, items } = req.body;
    
    // items: Array<{ materialId, estimatedQty, actualUsed }>
    
    // 1. Calculate variances and overall risk
    let maxVariance = 0;
    const processedItems = items.map((item: any) => {
      let variancePercent = 0;
      if (item.estimatedQty > 0) {
        variancePercent = ((item.actualUsed - item.estimatedQty) / item.estimatedQty) * 100;
      }
      
      let riskFlag = 'Healthy';
      if (variancePercent > 15) riskFlag = 'High risk';
      else if (variancePercent > 5) riskFlag = 'Warning';

      if (variancePercent > maxVariance) maxVariance = variancePercent;

      return {
        materialId: item.materialId,
        estimatedQty: item.estimatedQty,
        actualUsed: item.actualUsed,
        variancePercent,
        riskFlag
      };
    });

    let overallRisk = 'Healthy';
    if (maxVariance > 15) overallRisk = 'High risk';
    else if (maxVariance > 5) overallRisk = 'Warning';

    // 2. Transaction to create Audit and deduct from Inventory
    const result = await prisma.$transaction(async (tx) => {
      // Create audit
      const audit = await tx.materialAudit.create({
        data: {
          projectId,
          engineerId,
          date: date ? new Date(date) : new Date(),
          activity,
          weather,
          siteNotes,
          overallRisk,
          items: {
            create: processedItems
          }
        },
        include: { items: true }
      });

      // Deduct from inventory
      for (const item of processedItems) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            currentStock: {
              decrement: item.actualUsed
            }
          }
        });
      }

      return audit;
    });

    res.json({ success: true, audit: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET audits for a project
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const audits = await prisma.materialAudit.findMany({
      where: { projectId: projectId as string },
      include: {
        items: { include: { material: true } },
        engineer: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(audits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
