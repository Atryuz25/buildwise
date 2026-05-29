import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all rates (global for now, can be per city)
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    let rates = await prisma.materialRate.findUnique({ where: { city } });
    if (!rates) {
      // Create defaults
      rates = await prisma.materialRate.create({
        data: {
          city,
          cement: 420,
          steel: 65,
          sand: 70,
          aggregate: 70
        }
      });
    }
    res.json(rates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update rates
router.patch('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { cement, steel, sand, aggregate } = req.body;
    const updated = await prisma.materialRate.update({
      where: { city },
      data: { cement, steel, sand, aggregate }
    });
    res.json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
