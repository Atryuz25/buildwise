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

    const transformed = milestones.map(m => {
      let currentStatus = m.status;
      if (currentStatus !== 'PAID' && new Date(m.dueDate) < new Date()) {
        currentStatus = 'OVERDUE';
      }
      return {
        id: m.id,
        project: m.project.name,
        milestone: m.title,
        amount: m.amount,
        dueDate: new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: currentStatus
      };
    });

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
    const data: any = { status };
    if (status === 'PAID') {
      data.paidDate = new Date();
    }
    const milestone = await prisma.paymentMilestone.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, milestone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT unpay milestone (24h window)
router.put('/:id/unpay', async (req, res) => {
  try {
    const milestone = await prisma.paymentMilestone.findUnique({
      where: { id: req.params.id }
    });

    if (!milestone) return res.status(404).json({ error: 'Not found' });
    if (!milestone.paidDate) return res.status(400).json({ error: 'Not paid' });

    const hoursSincePaid = (new Date().getTime() - new Date(milestone.paidDate).getTime()) / (1000 * 60 * 60);
    
    if (hoursSincePaid > 24) {
      return res.status(403).json({ 
        error: 'Undo window expired — payment was marked over 24 hours ago' 
      });
    }

    const updated = await prisma.paymentMilestone.update({
      where: { id: req.params.id },
      data: { status: 'UPCOMING', paidDate: null }
    });

    res.json({ success: true, milestone: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
