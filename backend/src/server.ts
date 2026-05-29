import express from 'express';
import cors from 'cors';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import projectRoutes from './routes/project.routes';
import materialRoutes from './routes/material.routes';
import analyticsRoutes from './routes/analytics.routes';
import steelRoutes from './routes/steel.routes';
import dailyReportRoutes from './routes/dailyReport.routes';
import crewRoutes from './routes/crew.routes';
import attendanceRoutes from './routes/attendance.routes';
import authRoutes from './routes/auth.routes';
import estimatesRoutes from './routes/estimates.routes';
import projectRoutes from './routes/project.routes';
import materialRatesRoutes from './routes/materialRates.routes';
import auditRoutes from './routes/audit.routes';
import contractorsRoutes from './routes/contractors.routes';
import dailyReportRoutes from './routes/dailyReport.routes';
import productivityRoutes from './routes/productivity.routes';
import milestonesRoutes from './routes/milestones.routes';
import reportsRoutes from './routes/reports.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const port = process.env.PORT || 3005;

// Redis Setup
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

redis.on('error', (err) => {
  console.error('Redis connection failed — server cannot start:', err.message)
  process.exit(1)
});

// BullMQ Setup
import { queues } from './queues';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/steel', steelRoutes);
app.use('/api/daily-report', dailyReportRoutes);
app.use('/api/crews', crewRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/estimates', estimatesRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/material-rates', materialRatesRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/contractors', contractorsRoutes);
app.use('/api/daily-report', dailyReportRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
