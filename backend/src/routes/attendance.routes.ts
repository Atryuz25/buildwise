import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();

// Get attendance for a project by date
router.get('/project/:projectId', async (req, res) => {
  const { date } = req.query; // optional date filter (YYYY-MM-DD)
  
  try {
    let dateFilter = {};
    if (date && typeof date === 'string') {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      dateFilter = {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        crew: {
          projectId: req.params.projectId
        },
        ...dateFilter
      },
      include: {
        crew: true
      }
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance monthly grid
router.get('/project/:projectId/monthly', authenticate, async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month || typeof month !== 'string') {
      return res.status(400).json({ error: 'Month is required in YYYY-MM format' });
    }

    const [year, m] = month.split('-');
    const startDate = new Date(Number(year), Number(m) - 1, 1);
    const endDate = new Date(Number(year), Number(m), 0, 23, 59, 59, 999); // last day of month

    const attendances = await prisma.attendance.findMany({
      where: {
        crew: { projectId: req.params.projectId },
        date: { gte: startDate, lte: endDate }
      },
      include: {
        crew: {
          include: { contractor: true }
        }
      }
    });

    const daysMap: Record<string, any> = {};

    // Initialize all days in the month
    const totalDays = endDate.getDate();
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(Number(year), Number(m) - 1, i);
      const dateStr = d.toISOString().split('T')[0];
      daysMap[dateStr] = {
        date: dateStr,
        totalExpected: 0,
        totalPresent: 0,
        attendancePct: 0,
        riskLevel: 'HEALTHY',
        crews: []
      };
    }

    // Populate data
    attendances.forEach(att => {
      const dateStr = att.date.toISOString().split('T')[0];
      const dayData = daysMap[dateStr];
      if (dayData) {
        dayData.totalExpected += att.crew.size;
        dayData.totalPresent += att.presentCount;
        dayData.crews.push({
          crewId: att.crewId,
          crewName: `${att.crew.contractor.name} - ${att.crew.tradeType}`,
          expected: att.crew.size,
          present: att.presentCount
        });
      }
    });

    // Calculate percentages and risk
    Object.values(daysMap).forEach(day => {
      if (day.totalExpected > 0) {
        day.attendancePct = Number(((day.totalPresent / day.totalExpected) * 100).toFixed(1));
        if (day.attendancePct < 75) {
          day.riskLevel = 'DANGER';
        } else if (day.attendancePct < 90) {
          day.riskLevel = 'WARNING';
        }
      } else {
        day.attendancePct = null; // no crews expected
      }
    });

    res.json({
      month,
      days: Object.values(daysMap)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
