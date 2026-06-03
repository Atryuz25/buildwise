import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    // Scaffold implementation for labour costs
    res.json({ message: 'Labour cost API is mocked/scaffolded for Phase 3.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
