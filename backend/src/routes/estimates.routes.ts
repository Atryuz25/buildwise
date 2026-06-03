import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

const MIX_RATIOS: Record<string, { cement: number, sand: number, aggregate: number }> = {
  'M15': { cement: 1, sand: 2,   aggregate: 4   },
  'M20': { cement: 1, sand: 1.5, aggregate: 3   },
  'M25': { cement: 1, sand: 1,   aggregate: 2   },
  'M30': { cement: 1, sand: 0.75,aggregate: 1.5 },
  'M35': { cement: 1, sand: 0.5, aggregate: 1   },
};

// GET history of estimates for project
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query; // CONCRETE or STEEL

    const where: any = { projectId };
    if (type) {
      where.type = String(type).toUpperCase();
    }

    const estimates = await prisma.estimate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Parse the JSON data back into objects for the frontend
    const parsed = estimates.map(est => ({
      ...est,
      data: JSON.parse(est.data)
    }));

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Concrete Estimate
router.post('/concrete', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { structure, unit, length, width, thickness, grade, wastageBuffer } = req.body;

    // Convert input dimensions to Metres if they are in Feet
    const multiplier = unit === 'Feet' ? 0.3048 : 1;
    const L = Number(length) * multiplier;
    const W = Number(width) * multiplier;
    const T = Number(thickness) * multiplier;

    const wetVolume = L * W * T;
    const dryVolume = wetVolume * 1.54;

    const parsedGrade = grade.split(' ')[0]; // Extract "M25" from "M25 (1:1:2)" just in case UI still sends suffix
    const ratio = MIX_RATIOS[parsedGrade];
    if (!ratio) {
      return res.status(400).json({ error: `Invalid concrete grade: ${parsedGrade}` });
    }

    const totalRatio = ratio.cement + ratio.sand + ratio.aggregate;

    let cementBags = (dryVolume * ratio.cement / totalRatio) / 0.0347; // 0.0347m3 per bag
    let sandCft = (dryVolume * ratio.sand / totalRatio) * 35.3147; // m3 to cft
    let aggCft = (dryVolume * ratio.aggregate / totalRatio) * 35.3147;
    let waterLitres = cementBags * 30; // Approx 30L per bag

    // Apply wastage buffer
    const bufferMultiplier = 1 + (Number(wastageBuffer) / 100);
    cementBags *= bufferMultiplier;
    sandCft *= bufferMultiplier;
    aggCft *= bufferMultiplier;
    waterLitres *= bufferMultiplier; // Usually water isn't considered "wasted" this way, but strictly following scaling logic

    // Fetch material rates for project to calculate cost
    const materials = await prisma.material.findMany({
      where: { projectId, name: { in: ['cement', 'sand', 'aggregate'] } }
    });
    
    // Map rates (fallback to 0 if not set)
    const getRate = (name: string) => {
      const mat = materials.find(m => m.name.toLowerCase() === name);
      return mat ? mat.ratePerUnit : 0;
    };

    const cementCost = cementBags * getRate('cement');
    const sandCost = sandCft * getRate('sand');
    const aggCost = aggCft * getRate('aggregate');
    const totalCost = cementCost + sandCost + aggCost;

    const resultData = {
      inputs: { structure, unit, length, width, thickness, grade: parsedGrade, wastageBuffer },
      outputs: {
        wetVolume,
        dryVolume,
        cementBags,
        sandCft,
        aggCft,
        waterLitres,
        costs: {
          cement: cementCost,
          sand: sandCost,
          aggregate: aggCost,
          total: totalCost
        }
      }
    };

    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        engineerId: req.user.id,
        type: 'CONCRETE',
        structure: structure || 'Unknown',
        totalCost,
        data: JSON.stringify(resultData)
      }
    });

    res.json({ success: true, estimate: { ...estimate, data: resultData } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Steel Optimizer (FFD Algorithm)
router.post('/steel', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { standardRodLength, requirements } = req.body; 
    // requirements: Array<{ length: number, quantity: number }>

    if (!standardRodLength || !requirements || !Array.isArray(requirements)) {
      return res.status(400).json({ error: 'standardRodLength and requirements array are required' });
    }

    // Baseline: worst case (1 rod per cut)
    const worstCaseRods = requirements.reduce((acc, r) => acc + r.quantity, 0);

    // Flatten requirements
    const pieces: number[] = [];
    for (const reqObj of requirements) {
      for (let i = 0; i < reqObj.quantity; i++) {
        pieces.push(Number(reqObj.length));
      }
    }

    // Sort descending for FFD
    pieces.sort((a, b) => b - a);

    const rods: { used: number[], remaining: number }[] = [];

    // FFD Bin Packing
    for (const piece of pieces) {
      if (piece > standardRodLength) {
        return res.status(400).json({ error: `Piece length ${piece} exceeds standard rod length ${standardRodLength}` });
      }

      let placed = false;
      for (const rod of rods) {
        if (rod.remaining >= piece) {
          rod.used.push(piece);
          rod.remaining -= piece;
          placed = true;
          break;
        }
      }

      if (!placed) {
        rods.push({
          used: [piece],
          remaining: standardRodLength - piece
        });
      }
    }

    const totalRodsNeeded = rods.length;
    const totalScrap = rods.reduce((acc, rod) => acc + rod.remaining, 0);
    const scrapPercentage = (totalScrap / (totalRodsNeeded * standardRodLength)) * 100;

    // Financial calculations
    const steelMaterial = await prisma.material.findFirst({
      where: { projectId, name: { contains: 'steel', mode: 'insensitive' } }
    });
    // Assuming rate is per kg. We need weight of rod.
    // If rate is given directly per rod on frontend (pricePerRod input):
    const pricePerRod = req.body.pricePerRod || (steelMaterial ? steelMaterial.ratePerUnit * standardRodLength * 0.617 : 0); // approx weight assumption if not passed
    
    const worstCaseCost = worstCaseRods * pricePerRod;
    const optimizedCost = totalRodsNeeded * pricePerRod;
    const moneySaved = worstCaseCost - optimizedCost;

    const resultData = {
      inputs: { standardRodLength, requirements, pricePerRod },
      outputs: {
        totalRodsNeeded,
        worstCaseRods,
        totalScrap,
        scrapPercentage,
        worstCaseCost,
        optimizedCost,
        moneySaved,
        cuttingPlan: rods
      }
    };

    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        engineerId: req.user.id,
        type: 'STEEL',
        structure: 'Steel Optimizer',
        totalCost: optimizedCost,
        data: JSON.stringify(resultData)
      }
    });

    res.json({ success: true, estimate: { ...estimate, data: resultData } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
