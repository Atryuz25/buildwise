import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST output log
router.post('/', async (req, res) => {
  try {
    const { crewId, projectId, actualQty, date } = req.body;
    
    // Fetch crew to get target
    const crew = await prisma.crew.findUnique({ where: { id: crewId } });
    if (!crew) return res.status(404).json({ error: 'Crew not found' });

    const targetQty = crew.targetQty || 0;
    const unit = crew.targetUnit || 'units';

    // Calculate variance
    let variancePct = 0;
    if (targetQty > 0) {
      variancePct = (actualQty / targetQty) * 100;
    } else {
      variancePct = actualQty > 0 ? 100 : 0; // If no target but actual exists
    }

    const output = await prisma.outputRecord.create({
      data: {
        crewId,
        projectId,
        actualQty: Number(actualQty),
        targetQty,
        variancePct,
        unit,
        date: date ? new Date(date) : new Date()
      }
    });

    res.json({ success: true, output });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET output history
router.get('/:projectId', async (req, res) => {
  try {
    const outputs = await prisma.outputRecord.findMany({
      where: { projectId: req.params.projectId },
      include: {
        crew: {
          include: { contractor: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const transformed = outputs.map(o => {
      // ≥90% green, 70–90% amber, <70% red
      let status = 'red';
      if (o.variancePct >= 90) status = 'green';
      else if (o.variancePct >= 70) status = 'amber';

      return {
        id: o.id,
        date: new Date(o.date).toISOString().split('T')[0],
        crewName: `${o.crew.tradeType} Crew`,
        contractorName: o.crew.contractor.name,
        actualQty: o.actualQty,
        targetQty: o.targetQty,
        unit: o.unit,
        variancePct: Math.round(o.variancePct),
        status
      };
    });

    res.json(transformed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
