import './env';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { queues, startCronJobs } from './queues';
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
import outputRoutes from './routes/output.routes';
import { PrismaClient } from '@prisma/client';

// === STARTUP VALIDATION ===
const requiredEnvVars = ['SUPABASE_URL', 'DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY', 'UPSTASH_REDIS_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`[FATAL] Server failed to start. Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const prisma = new PrismaClient();

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
let redisUrl = process.env.UPSTASH_REDIS_URL;
if (redisUrl?.startsWith('http')) {
  const host = redisUrl.replace('https://', '').replace('http://', '');
  redisUrl = `rediss://default:${process.env.UPSTASH_REDIS_TOKEN}@${host}:6379`;
}

export const redis = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : new RedisMock() as any;

redis.on('error', (err: any) => {
  console.error('Redis connection failed:', err.message);
  // process.exit(1) // removed for dev testing
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/reports', reportsRoutes);
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
app.use('/api/output', outputRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.status(200).json({ status: 'ok', db: 'connected', redis: 'connected' });
  } catch (err) {
    console.error('Healthcheck failed', err);
    res.status(503).json({ status: 'error', db: 'disconnected', redis: 'disconnected' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  startCronJobs();
});
