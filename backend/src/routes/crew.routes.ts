import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get crews for a project
router.get('/:projectId', async (req, res) => {
  try {
    const crews = await prisma.crew.findMany({
      where: { projectId: req.params.projectId },
      include: {
        contractor: true,
        outputs: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    res.json(crews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crews' });
  }
});
// Create a new crew
router.post('/', async (req, res) => {
  try {
    const { projectId, contractorId, tradeType, size, dailyRate } = req.body;
    const crew = await prisma.crew.create({
      data: {
        projectId,
        contractorId,
        tradeType,
        size: Number(size),
        dailyRate: Number(dailyRate)
      }
    });
    res.json(crew);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set output target
router.post('/:id/output-target', async (req, res) => {
  try {
    const { targetQty, targetUnit } = req.body;
    const crew = await prisma.crew.update({
      where: { id: req.params.id },
      data: {
        targetQty: Number(targetQty),
        targetUnit
      }
    });
    res.json(crew);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
