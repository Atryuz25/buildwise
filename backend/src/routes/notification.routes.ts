import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();

// GET unread count and latest 10 notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      unreadCount,
      notifications
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
