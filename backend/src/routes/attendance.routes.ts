import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

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

export default router;
