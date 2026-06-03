import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();

// GET master rates for a specific city
router.get('/:city', authenticate, async (req, res) => {
  try {
    const { city } = req.params;

    const rate = await prisma.materialRate.findUnique({
      where: { city }
    });

    if (!rate) {
      return res.status(404).json({ error: 'Rates not found for the specified city' });
    }

    res.json(rate);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all available cities (useful for the onboarding dropdown)
router.get('/', authenticate, async (req, res) => {
  try {
    const rates = await prisma.materialRate.findMany({
      select: { city: true }
    });
    
    res.json(rates.map(r => r.city));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
