import { Router } from 'express';
import { queues } from '../queues';

const router = Router();

// Dispatch a general WhatsApp notification
router.post('/whatsapp', async (req, res) => {
  try {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: 'type and payload are required' });
    }

    // Direct routing for the 7 triggers based on type
    switch (type) {
      case 'overdue-audit':
        await queues.auditReminder.add('overdue-audit', payload);
        break;
      case 'report-reminder':
        await queues.reportReminder.add('report-reminder', payload);
        break;
      case 'milestone-overdue':
        await queues.milestoneOverdue.add('milestone-overdue', payload);
        break;
      case 'daily-digest':
      case 'inventory-critical':
      case 'high-risk-variance':
      case 'headcount-divergence':
      case 'pm-manual-reminder':
        await queues.whatsappDigest.add(type, payload);
        break;
      default:
        return res.status(400).json({ error: `Unknown notification type: ${type}` });
    }

    res.json({ success: true, message: `Dispatched ${type} job.` });
  } catch (err: any) {
    console.error('Notification dispatch failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
