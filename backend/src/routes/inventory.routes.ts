import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';
import { calculateBurnRateAndDays } from '../services/inventory.service';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// GET all inventory items for project
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const materials = await prisma.material.findMany({
      where: { projectId }
    });

    const enrichedMaterials = await Promise.all(materials.map(async (m) => {
      const { burnRate7Day, daysRemaining } = await calculateBurnRateAndDays(m.id, m.currentStock);
      return {
        ...m,
        burnRate7Day,
        daysRemaining
      };
    }));

    res.json(enrichedMaterials);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT inline update to stock or threshold
router.put('/:materialId', authenticate, async (req, res) => {
  try {
    const { materialId } = req.params;
    const { currentStock, minThreshold } = req.body;

    const data: any = {};
    if (currentStock !== undefined) data.currentStock = currentStock;
    if (minThreshold !== undefined) data.minThreshold = minThreshold;

    const updated = await prisma.material.update({
      where: { id: materialId },
      data
    });

    res.json({ success: true, material: updated });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST new delivery (log + increment stock)
router.post('/:materialId/delivery', authenticate, async (req, res) => {
  try {
    const { materialId } = req.params;
    const { quantity, supplierName, invoice, notes } = req.body;

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.inventoryLog.create({
        data: {
          materialId,
          type: 'DELIVERY',
          quantity: qty,
          referenceId: invoice || supplierName || null,
          notes: notes || `Delivered by ${supplierName}`
        }
      });

      const updatedMaterial = await tx.material.update({
        where: { id: materialId },
        data: {
          currentStock: { increment: qty },
          lastUpdated: new Date()
        }
      });

      return { log, updatedMaterial };
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET logs for a specific material
router.get('/:materialId/logs', authenticate, async (req, res) => {
  try {
    const { materialId } = req.params;

    const logs = await prisma.inventoryLog.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(logs);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
