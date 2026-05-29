import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// CONCRETE ESTIMATOR LOGIC
// Mix Ratios: cement:sand:aggregate
const MIX_RATIOS: Record<string, { c: number, s: number, a: number }> = {
  'M15': { c: 1, s: 2, a: 4 },
  'M20': { c: 1, s: 1.5, a: 3 },
  'M25': { c: 1, s: 1, a: 2 },
  'M30': { c: 1, s: 0.75, a: 1.5 }
};

router.post('/concrete', async (req, res) => {
  try {
    const { projectId, engineerId, structure, grade, volume, wastageBuffer, currentRates } = req.body;
    
    // Calculation Logic
    // Total dry volume is ~1.54 times wet volume
    const dryVolume = volume * 1.54;
    
    const ratio = MIX_RATIOS[grade] || MIX_RATIOS['M25'];
    const totalParts = ratio.c + ratio.s + ratio.a;
    
    // Cement: 1 bag = 0.0347 m3
    const cementVolume = (ratio.c / totalParts) * dryVolume;
    const cementBags = Math.ceil(cementVolume / 0.0347);
    
    // Sand & Aggregate in cft (1 m3 = 35.3147 cft)
    const sandCft = (ratio.s / totalParts) * dryVolume * 35.3147;
    const aggregateCft = (ratio.a / totalParts) * dryVolume * 35.3147;
    
    // Water: roughly 0.5 w/c ratio by weight. 1 bag cement = 50kg.
    const waterLiters = cementBags * 50 * 0.5;

    // Base Quantities
    let baseQty = {
      cement: cementBags,
      sand: sandCft,
      aggregate: aggregateCft,
      water: waterLiters
    };

    // Add wastage buffer
    const bufferMultiplier = 1 + (wastageBuffer / 100);
    const finalQty = {
      cement: Math.ceil(baseQty.cement * bufferMultiplier),
      sand: Number((baseQty.sand * bufferMultiplier).toFixed(2)),
      aggregate: Number((baseQty.aggregate * bufferMultiplier).toFixed(2)),
      water: Number((baseQty.water * bufferMultiplier).toFixed(2))
    };

    // Calculate Costs
    const cost = {
      cement: finalQty.cement * (currentRates.cement || 400),
      sand: finalQty.sand * (currentRates.sand || 60),
      aggregate: finalQty.aggregate * (currentRates.aggregate || 50),
    };
    const totalCost = cost.cement + cost.sand + cost.aggregate;

    // Save Estimate
    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        engineerId,
        type: 'CONCRETE',
        structure,
        totalCost,
        data: JSON.stringify({ inputs: req.body, baseQty, finalQty, cost })
      }
    });

    res.json({ success: true, estimate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/concrete', async (req, res) => {
  const { projectId } = req.query;
  try {
    const estimates = await prisma.estimate.findMany({
      where: { projectId: projectId as string, type: 'CONCRETE' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(estimates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// STEEL OPTIMIZER LOGIC - FIRST FIT DECREASING (FFD)
router.post('/steel', async (req, res) => {
  try {
    const { projectId, engineerId, standardLength, pricePerKg, weightPerM, cuts } = req.body;
    
    // cuts: Array<{ length: number, qty: number }>
    // FFD Algorithm
    // 1. Flatten into single array of all cut lengths
    let requestedCuts: number[] = [];
    cuts.forEach((c: any) => {
      for (let i = 0; i < c.qty; i++) {
        requestedCuts.push(c.length);
      }
    });

    // 2. Sort descending
    requestedCuts.sort((a, b) => b - a);

    // 3. Pack into rods
    let rods: { remaining: number, cuts: number[] }[] = [];
    
    for (let cut of requestedCuts) {
      if (cut > standardLength) {
        return res.status(400).json({ error: `Cut length ${cut}m exceeds standard rod length ${standardLength}m` });
      }

      let placed = false;
      for (let rod of rods) {
        if (rod.remaining >= cut) {
          rod.remaining -= cut;
          rod.cuts.push(cut);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rods.push({
          remaining: standardLength - cut,
          cuts: [cut]
        });
      }
    }

    // Calculations
    const rodsNeeded = rods.length;
    const totalSteelLength = rodsNeeded * standardLength;
    const totalUsedLength = totalSteelLength - rods.reduce((acc, rod) => acc + rod.remaining, 0);
    const scrapLength = totalSteelLength - totalUsedLength;
    
    const scrapPct = (scrapLength / totalSteelLength) * 100;
    
    const totalCost = rodsNeeded * standardLength * weightPerM * pricePerKg;
    
    // Unoptimized cost (if they just bought enough rods to cover total linear meters directly + 15% random waste)
    // Actually, "random cutting" usually results in 10-15% waste minimum. 
    // We can simulate an unoptimized naive scenario: one cut per rod if possible, or worst-case.
    // For simplicity, let's say naive random cutting wastes 15% on average.
    const unoptimizedWastePct = 15;
    const unoptimizedCost = (totalUsedLength * 1.15) * weightPerM * pricePerKg;
    const rupeesSaved = Math.max(0, unoptimizedCost - totalCost);

    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        engineerId,
        type: 'STEEL',
        structure: 'Steel Optimization',
        totalCost,
        data: JSON.stringify({ 
          rodsNeeded, 
          scrapPct, 
          rupeesSaved, 
          rodsConfig: rods, 
          totalCost 
        })
      }
    });

    res.json({ success: true, estimate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/steel', async (req, res) => {
  const { projectId } = req.query;
  try {
    const estimates = await prisma.estimate.findMany({
      where: { projectId: projectId as string, type: 'STEEL' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(estimates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
