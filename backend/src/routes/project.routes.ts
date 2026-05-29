import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all projects (scoped to user in real app, returning all for now)
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: true
      }
    });
    // Transform to match frontend expectations
    const transformed = projects.map(p => ({
      id: p.id,
      name: p.name,
      location: p.location,
      type: p.type,
      budget: p.budget,
      spent: p.spent,
      progress: p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0,
      status: p.status,
    }));
    res.json(transformed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new project
router.post('/', async (req, res) => {
  try {
    const { name, location, type, budget } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        location,
        type,
        budget: Number(budget),
        spent: 0,
        status: 'Active',
        startDate: new Date()
      }
    });
    const progress = 0;
    res.json({
      id: project.id,
      name: project.name,
      location: project.location,
      type: project.type,
      budget: project.budget,
      spent: project.spent,
      progress,
      status: project.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
