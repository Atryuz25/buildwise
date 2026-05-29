import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get crews for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const crews = await prisma.crew.findMany({
      where: { projectId: req.params.projectId },
    });
    res.json(crews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crews' });
  }
});

export default router;
