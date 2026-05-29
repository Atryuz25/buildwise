import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MaterialService } from '../services/material.service';

const router = Router();
const prisma = new PrismaClient();

// Get inventory for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { currentStock: 'asc' } // Lowest stock first
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add delivery
router.post('/:id/delivery', async (req, res) => {
  const { amount, invoiceRef } = req.body;
  try {
    const material = await MaterialService.addDelivery(req.params.id, Number(amount), invoiceRef);
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add delivery' });
  }
});

// Update thresholds
router.patch('/:id/threshold', async (req, res) => {
  const { minThreshold } = req.body;
  try {
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: { minThreshold: Number(minThreshold) }
    });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update threshold' });
  }
});

export default router;
