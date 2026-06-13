import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/crypto.util';

const router = Router();
const prisma = new PrismaClient();

// POST new contractor
router.post('/', async (req, res) => {
  try {
    const { name, trade, phone, bankDetails, crews } = req.body;
    
    // Encrypt bank details before writing to DB
    const encryptedBankDetails = encrypt(bankDetails || '');

    const contractor = await prisma.contractor.create({
      data: {
        name,
        trade,
        phone,
        bankDetails: encryptedBankDetails,
        crews: {
          create: crews.map((c: any) => ({
            projectId: c.projectId,
            tradeType: c.tradeType,
            size: c.size,
            dailyRate: c.dailyRate,
          }))
        }
      },
      include: { crews: true }
    });

    res.json({ success: true, contractor });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all contractors
router.get('/', async (req, res) => {
  try {
    const contractors = await prisma.contractor.findMany({
      where: { isDeleted: false },
      include: { crews: true }
    });

    const decryptedContractors = contractors.map(c => ({
      ...c,
      bankDetails: c.bankDetails ? decrypt(c.bankDetails) : ''
    }));

    res.json(decryptedContractors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET contractor leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const contractors = await prisma.contractor.findMany({
      where: { isDeleted: false },
      include: {
        crews: {
          include: {
            attendances: true,
            outputs: true
          }
        }
      }
    });

    // Calculate efficiency score per contractor
    const leaderboard = contractors.map(contractor => {
      let totalOutputs = 0;
      let sumOutputRatio = 0;
      let totalAttendances = 0;
      let sumAttendanceRate = 0;

      contractor.crews.forEach(crew => {
        crew.outputs.forEach(output => {
          totalOutputs++;
          if (output.targetQty > 0) {
            sumOutputRatio += (output.actualQty / output.targetQty);
          }
        });
        
        crew.attendances.forEach(att => {
          totalAttendances++;
          const totalExpected = crew.size;
          if (totalExpected > 0) {
            sumAttendanceRate += (att.presentCount / totalExpected);
          }
        });
      });

      const avgOutputRatio = totalOutputs > 0 ? (sumOutputRatio / totalOutputs) * 100 : 0;
      const avgAttendanceRate = totalAttendances > 0 ? (sumAttendanceRate / totalAttendances) * 100 : 0;
      
      // Efficiency score formula: (avg output ratio × 0.6) + (avg attendance rate × 0.4)
      const efficiencyScore = (avgOutputRatio * 0.6) + (avgAttendanceRate * 0.4);

      return {
        id: contractor.id,
        name: contractor.name,
        trade: contractor.trade,
        activeProjects: new Set(contractor.crews.map(c => c.projectId)).size,
        avgAttendanceRate: Math.round(avgAttendanceRate),
        avgOutputRatio: Math.round(avgOutputRatio),
        efficiencyScore: Math.round(efficiencyScore),
        trend: 'up' // placeholder trend
      };
    });

    // Sort descending by efficiency
    leaderboard.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single contractor
router.get('/:id', async (req, res) => {
  try {
    const contractor = await prisma.contractor.findUnique({
      where: { id: req.params.id, isDeleted: false },
      include: { crews: true }
    });

    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });

    // Decrypt bank details on read
    const decryptedBankDetails = decrypt(contractor.bankDetails);

    res.json({
      ...contractor,
      bankDetails: decryptedBankDetails
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH edit contractor
router.patch('/:id', async (req, res) => {
  try {
    const { name, trade, phone, bankDetails } = req.body;
    let updateData: any = { name, trade, phone };
    
    if (bankDetails) {
      updateData.bankDetails = encrypt(bankDetails);
    }

    const contractor = await prisma.contractor.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, contractor });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE soft delete contractor
router.delete('/:id', async (req, res) => {
  try {
    const contractor = await prisma.contractor.update({
      where: { id: req.params.id },
      data: { isDeleted: true }
    });

    res.json({ success: true, contractor });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
