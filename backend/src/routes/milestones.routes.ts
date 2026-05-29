import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all milestones
router.get('/', async (req, res) => {
  try {
    const milestones = await prisma.paymentMilestone.findMany({
      include: { project: true },
      orderBy: { dueDate: 'asc' }
    });

    const transformed = milestones.map(m => ({
      id: m.id,
      project: m.project.name,
      milestone: m.title,
      amount: m.amount,
      dueDate: new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: m.status
    }));

    res.json(transformed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new milestone
router.post('/', async (req, res) => {
  try {
    const { projectId, title, amount, dueDate } = req.body;
    const milestone = await prisma.paymentMilestone.create({
      data: {
        projectId,
        title,
        amount: Number(amount),
        dueDate: new Date(dueDate)
      }
    });
    res.json({ success: true, milestone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH milestone status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const milestone = await prisma.paymentMilestone.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, milestone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
