import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get project summary KPIs
router.get('/project/:projectId/summary', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        materials: true,
        audits: {
          orderBy: { date: 'desc' },
          take: 5,
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Calculate overall health
    const lowStockCount = project.materials.filter(m => m.currentStock <= m.minThreshold).length;
    
    // In a real scenario, this aggregates variance data over the week
    const weeklyVariance = 5.2; // Mock

    res.json({
      budget: project.budget,
      spent: project.spent,
      lowStockCount,
      weeklyVariance,
      recentAudits: project.audits
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
