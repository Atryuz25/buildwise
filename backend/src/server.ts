import './env';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { queues } from './queues';
import projectRoutes from './routes/project.routes';
import materialRoutes from './routes/material.routes';
import analyticsRoutes from './routes/analytics.routes';
import steelRoutes from './routes/steel.routes';
import dailyReportRoutes from './routes/dailyReport.routes';
import crewRoutes from './routes/crew.routes';
import attendanceRoutes from './routes/attendance.routes';
import authRoutes from './routes/auth.routes';
import materialRatesRoutes from './routes/materialRates.routes';
import auditRoutes from './routes/audit.routes';
import contractorsRoutes from './routes/contractors.routes';
import productivityRoutes from './routes/productivity.routes';
import milestonesRoutes from './routes/milestones.routes';
import reportsRoutes from './routes/reports.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';
import uploadRoutes from './routes/upload.routes';
import delaysRoutes from './routes/delays.routes';
import labourCostRoutes from './routes/labourCost.routes';

const app = express();

// Mock Sentry Initialization for Production Error Tracking
if (process.env.NODE_ENV === 'production') {
  // Sentry.init({
  //   dsn: process.env.SENTRY_DSN,
  //   integrations: [
  //     new Sentry.Integrations.Http({ tracing: true }),
  //     new Sentry.Integrations.Express({ app }),
  //   ],
  //   tracesSampleRate: 1.0,
  // });
  console.log('[Sentry] Backend initialized with mocked DSN');
}

const port = process.env.PORT || 3005;

import RedisMock from 'ioredis-mock';

// Redis Setup
export const redis = process.env.NODE_ENV === 'development' 
  ? new RedisMock() as any
  : new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null
    });

redis.on('error', (err: any) => {
  console.error('Redis connection failed:', err.message);
  // process.exit(1) // removed for dev testing
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(cookieParser());
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
app.use('/api/material-rates', materialRatesRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/contractors', contractorsRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/delays', delaysRoutes);
app.use('/api/labour-cost', labourCostRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
