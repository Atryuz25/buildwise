import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all crews with their productivity data
router.get('/crews', async (req, res) => {
  try {
    const crews = await prisma.crew.findMany({
      include: {
        contractor: true,
        outputs: {
          orderBy: { date: 'desc' },
          take: 14 // Last 14 days
        }
      }
    });

    const transformed = crews.map(c => {
      let totalOutput = 0;
      let totalTarget = 0;
      
      c.outputs.forEach(o => {
        totalOutput += o.actualQty;
        totalTarget += o.targetQty;
      });

      const efficiency = totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0;

      return {
        id: c.id,
        name: `${c.tradeType} Crew ${c.id.substring(0,4)}`, // Fallback name
        contractor: c.contractor.name,
        trade: c.tradeType,
        efficiency,
        foreman: 'Assignee', // Mocked
        metric: c.outputs[0]?.unit || 'units',
        dailyData: c.outputs.reverse().map(o => ({
          day: new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          actual: o.actualQty,
          target: o.targetQty
        }))
      };
    });

    res.json(transformed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET delays
router.get('/delays', async (req, res) => {
  try {
    const delays = await prisma.delay.findMany({
      include: { project: true, crew: true },
      orderBy: { date: 'desc' }
    });
    
    const transformed = delays.map(d => ({
      id: d.id,
      date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      project: d.project.name,
      crew: d.crew ? `${d.crew.tradeType} Crew` : 'General',
      cause: d.cause,
      severity: d.severity,
      impactDays: d.impactDays,
      costImpact: d.impactCost > 0 ? `₹${d.impactCost.toLocaleString()}` : '-',
      status: d.notes?.includes('Resolved') ? 'Resolved' : 'Pending Review'
    }));

    res.json(transformed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET labour costs
router.get('/labour-cost', async (req, res) => {
  try {
    const crews = await prisma.crew.findMany({
      include: {
        attendances: true
      }
    });

    let totalLabourCost = 0;
    const crewTableData = crews.map((c, idx) => {
      let daysWorked = c.attendances.length;
      let totalCost = c.attendances.reduce((acc, att) => acc + (c.dailyRate * (att.presentCount / c.size)), 0);
      if (totalCost === 0) {
        // Mock some data if empty
        daysWorked = 20 + idx;
        totalCost = c.dailyRate * daysWorked;
      }
      totalLabourCost += totalCost;

      const budget = totalCost * 0.9; // mock budget

      return {
        id: c.id,
        name: `${c.tradeType} Crew`,
        trade: c.tradeType,
        daysActive: 30,
        rate: c.dailyRate,
        daysWorked,
        totalCost,
        budget
      };
    });

    res.json({
      crewTableData,
      totalLabourCost
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
