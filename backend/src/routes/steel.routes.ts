import { Router } from 'express';
import { optimizeSteelCuts, CutRequest } from '../services/calculators/steelOptimizer';

const router = Router();

// Optimize steel cuts using FFD algorithm
router.post('/optimize', (req, res) => {
  try {
    const { standardLength, cuts } = req.body as { standardLength: number; cuts: CutRequest[] };
    
    if (!standardLength || !cuts || !Array.isArray(cuts)) {
      return res.status(400).json({ error: 'Invalid payload. Requires standardLength and cuts array.' });
    }

    const optimizationResult = optimizeSteelCuts(standardLength, cuts);
    res.json(optimizationResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to optimize cuts' });
  }
});

export default router;
