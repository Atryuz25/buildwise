import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// POST new audit
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date, activity, weather, siteNotes, items } = req.body;
    const engineerId = req.user.id;
    
    const reportDate = date ? new Date(date) : new Date();
    // Normalize to start of day for comparison
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Guard: Check if audit already exists from daily report
    const existingAudit = await prisma.materialAudit.findFirst({
      where: {
        projectId,
        engineerId,
        source: 'DAILY_REPORT',
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existingAudit) {
      return res.status(409).json({
        error: 'Audit already submitted via daily report for this date',
        source: 'DAILY_REPORT',
        auditId: existingAudit.id
      });
    }
    
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
          date: reportDate,
          activity,
          weather,
          siteNotes,
          overallRisk,
          source: 'MANUAL',
          items: {
            create: processedItems
          }
        },
        include: { items: true }
      });

      // Deduct from inventory and create Consumption Log
      for (const item of processedItems) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            currentStock: {
              decrement: item.actualUsed
            }
          }
        });

        await tx.inventoryLog.create({
          data: {
            materialId: item.materialId,
            type: 'CONSUMPTION',
            quantity: item.actualUsed,
            referenceId: audit.id,
            notes: `Consumed via Manual Audit`
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
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date, risk, engineerId } = req.query;

    const whereClause: any = { projectId };

    if (date) {
      const qDate = new Date(date as string);
      const start = new Date(qDate); start.setHours(0,0,0,0);
      const end = new Date(qDate); end.setHours(23,59,59,999);
      whereClause.date = { gte: start, lte: end };
    }

    if (risk) {
      whereClause.overallRisk = risk as string;
    }

    if (engineerId) {
      whereClause.engineerId = engineerId as string;
    }

    const audits = await prisma.materialAudit.findMany({
      where: whereClause,
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
