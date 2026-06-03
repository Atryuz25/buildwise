import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import dailyReportRoutes from './dailyReport.routes';
import inventoryRoutes from './inventory.routes';
import auditRoutes from './audit.routes';
import estimatesRoutes from './estimates.routes';
import weatherRoutes from './weather.routes';
import reportsRoutes from './reports.routes';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();

router.use('/:projectId/daily-reports', dailyReportRoutes);
router.use('/:projectId/inventory', inventoryRoutes);
router.use('/:projectId/audits', auditRoutes);
router.use('/:projectId/estimates', estimatesRoutes);
router.use('/:projectId/weather', weatherRoutes);
router.use('/:projectId/reports', reportsRoutes);

// GET project setup status
router.get('/:projectId/setup-status', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if at least 4 materials have rates > 0
    const ratesCount = await prisma.material.count({
      where: {
        projectId,
        ratePerUnit: { gt: 0 }
      }
    });

    res.json({ hasRates: ratesCount >= 4 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all projects
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: req.user.id }
        }
      },
      include: { members: true }
    });
    
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
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, location, type, budget } = req.body;
    
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
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

      // Assign creator as ADMIN
      await tx.projectMember.create({
        data: {
          projectId: proj.id,
          userId: req.user.id,
          role: 'ADMIN'
        }
      });

      return proj;
    });

    res.json({
      id: project.id,
      name: project.name,
      location: project.location,
      type: project.type,
      budget: project.budget,
      spent: project.spent,
      progress: 0,
      status: project.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project basics
router.put('/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, location, type, budget, status, endDate } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (location) data.location = location;
    if (type) data.type = type;
    if (budget) data.budget = Number(budget);
    if (status) data.status = status;
    if (endDate) data.endDate = new Date(endDate);

    const project = await prisma.project.update({
      where: { id: projectId },
      data
    });

    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add member
router.post('/:projectId/members', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { phone, role, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const memberRole = role || 'SITE_ENGINEER';

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { phone } });
      
      // Auto-provision placeholder if missing
      if (!user) {
        user = await tx.user.create({
          data: {
            phone,
            name: name || null,
            role: memberRole,
            isProvisioned: false
          }
        });
      }

      // Check if already member
      const existing = await tx.projectMember.findFirst({
        where: { projectId, userId: user.id }
      });

      if (existing) {
        return { user, member: existing, isNew: false };
      }

      const member = await tx.projectMember.create({
        data: {
          projectId,
          userId: user.id,
          role: memberRole
        }
      });

      return { user, member, isNew: true };
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove member
router.delete('/:projectId/members/:userId', authenticate, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Optional: add guard so a user cannot remove themselves if they are the only ADMIN
    
    await prisma.projectMember.deleteMany({
      where: { projectId, userId }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT batch upsert material rates (Onboarding Step 3)
router.put('/:projectId/rates', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rates } = req.body; // Array of { name, ratePerUnit, unit }

    if (!rates || !Array.isArray(rates)) {
      return res.status(400).json({ error: 'Rates array is required' });
    }

    const upserted = [];
    for (const rate of rates) {
      const material = await prisma.material.upsert({
        where: {
          projectId_name: {
            projectId,
            name: rate.name
          }
        },
        update: {
          ratePerUnit: rate.ratePerUnit,
          unit: rate.unit || 'units'
        },
        create: {
          projectId,
          name: rate.name,
          ratePerUnit: rate.ratePerUnit,
          unit: rate.unit || 'units'
        }
      });
      upserted.push(material);
    }

    res.json({ success: true, materials: upserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
