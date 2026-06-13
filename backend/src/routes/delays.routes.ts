import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId, cause, severity, startDate, endDate, crewId } = req.query;

    const where: Prisma.DelayWhereInput = {
      ...(projectId && { projectId: String(projectId) }),
      ...(cause && { cause: String(cause) }),
      ...(severity && { severity: String(severity) }),
      ...(crewId && { crewId: String(crewId) }),
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(String(startDate));
      if (endDate) where.date.lte = new Date(String(endDate));
    }

    const delays = await prisma.delay.findMany({
      where,
      include: {
        crew: {
          include: {
            contractor: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(delays);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, crewId, cause, severity, impactDays, impactCost, notes, date } = req.body;
    
    const delay = await prisma.delay.create({
      data: {
        projectId,
        crewId,
        cause,
        severity,
        impactDays: impactDays ? Number(impactDays) : 0,
        impactCost: impactCost ? Number(impactCost) : 0,
        notes,
        date: date ? new Date(date) : new Date()
      }
    });

    res.json({ success: true, delay });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
