import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import cron from 'node-cron';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Use real Redis if UPSTASH is provided, else mock
let redisUrl = process.env.UPSTASH_REDIS_URL;
if (redisUrl?.startsWith('http')) {
  const host = redisUrl.replace('https://', '').replace('http://', '');
  redisUrl = `rediss://default:${process.env.UPSTASH_REDIS_TOKEN}@${host}:6379`;
}

const connection = redisUrl
  ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
  : require('ioredis-mock')();

export const queues = {
    auditReminder: new Queue('audit-reminder', { connection }),
    reportReminder: new Queue('report-reminder', { connection }),
    whatsappDigest: new Queue('whatsapp-digest', { connection }),
    milestoneOverdue: new Queue('milestone-overdue', { connection }),
    inventoryAlert: new Queue('inventory-alert', { connection }),
};

const createWorker = (queueName: string, processor: (job: any) => Promise<void>) => {
  const worker = new Worker(queueName, processor, { connection });
  worker.on('failed', (job, err) => {
    console.error(`[Worker Error] ${queueName} job ${job?.id} failed:`, err.message);
  });
  return worker;
};

// Deduplication Helper
const shouldProcess = async (dedupKey: string, expirySeconds: number = 86400) => {
  const exists = await connection.get(dedupKey);
  if (exists) return false;
  await connection.set(dedupKey, '1', 'EX', expirySeconds);
  return true;
};

// 1. Audit Reminder Worker (Overdue audit alert)
createWorker('audit-reminder', async (job) => {
  const dedupKey = `dedup:audit-reminder:${job.data.engineerId}`;
  if (!(await shouldProcess(dedupKey))) return;
  console.log(`[Audit Worker] Overdue Audit Alert sent to Engineer: ${job.data.engineerName} (${job.data.daysOverdue} days overdue)`);
});

// 2. Report Reminder Worker
createWorker('report-reminder', async (job) => {
  const dedupKey = `dedup:report-reminder:${job.data.engineerId}`;
  if (!(await shouldProcess(dedupKey))) return;
  console.log(`[Report Worker] Report Reminder sent`);
});

// 3. Milestone Overdue Worker (Milestone overdue)
createWorker('milestone-overdue', async (job) => {
  console.log(`[Milestone Worker] Milestone Overdue Alert: Contractor ${job.data.contractor}, Amount ₹${job.data.amount}, ${job.data.daysOverdue} days overdue`);
});

// 4. Inventory Alert Worker
createWorker('inventory-alert', async (job) => {
  const { materialId, materialName, remainingDays } = job.data;
  const dedupKey = `dedup:inventory-alert:${materialId}`;
  
  // Prevent double sending per material per day
  if (!(await shouldProcess(dedupKey))) {
    console.log(`[Inventory Worker] Skipped duplicate alert for ${materialName}`);
    return;
  }
  
  console.log(`[Inventory Worker] Sent Critical Inventory Alert: ${materialName} has ${remainingDays} days remaining`);
});

const sendWhatsApp = async (to: string, message: string) => {
  if (process.env.MOCK_WHATSAPP === 'true' || !process.env.WHATSAPP_API_KEY) {
    console.log(`[MOCK WHATSAPP to ${to}]: ${message}`);
    return;
  }
  
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[WHATSAPP SENT to ${to}]`);
  } catch (err: any) {
    console.error('[WHATSAPP ERROR]', err?.response?.data || err.message);
  }
};

// 5. WhatsApp Digest Worker
createWorker('whatsapp-digest', async (job) => {
  const { name, data } = job;
  const pmPhone = '+919876543210'; // In a real app, query User DB for PM's phone
  const engPhone = '+919876543211';
  
  switch(name) {
    case 'daily-digest':
      const pmDedup = `dedup:daily-digest:${data.pmId}`;
      if (!(await shouldProcess(pmDedup))) return;
      await sendWhatsApp(pmPhone, `📊 *6PM Daily Digest*\nAudits: ${data.auditSummary}\nAttendance: ${data.attendanceSummary}`);
      break;
    
    case 'high-risk-variance':
      await sendWhatsApp(pmPhone, `⚠️ *High-Risk Variance Alert*\nMaterial: ${data.material}\nVariance: ${data.variancePct}%`);
      break;

    case 'headcount-divergence':
      await sendWhatsApp(pmPhone, `🤖 *AI Headcount Divergence*\nCrew: ${data.crew}\nReported: ${data.reported}\nAI Detected: ${data.detected}\nDivergence: ${data.divergencePct}%`);
      break;
      
    case 'severe-delay':
      await sendWhatsApp(pmPhone, `🚨 *Severe Delay Alert*\nCause: ${data.cause}\nHours Lost: ${data.hours}`);
      break;

    case 'milestone-overdue':
      await sendWhatsApp(pmPhone, `💰 *Payment Overdue*\nContractor: ${data.contractor}\nAmount: ₹${data.amount}\nDays Overdue: ${data.daysOverdue}`);
      break;
      
    case 'audit-alert':
      await sendWhatsApp(engPhone, `⏰ *Overdue Audit Alert*\nEngineer: ${data.engineerName}\nDays Overdue: ${data.daysOverdue}`);
      break;
      
    case 'inventory-critical':
      await sendWhatsApp(pmPhone, `📉 *Inventory Critical*\nMaterial: ${data.materialName}\nDays Remaining: ${data.remainingDays}`);
      break;

    case 'pile-divergence':
      await sendWhatsApp(pmPhone, `⚠️ *Pile Divergence Alert* — ${data.material} estimated ${data.estimated} cft by AI, inventory shows ${data.inventory} cft (${data.divergence.toFixed(1)}% gap). Project: ${data.projectId}`);
      break;

    default:
      console.log(`[WhatsApp Worker] Type: unknown | Received unknown job type: ${name}`);
  }
});

// CRON SCHEDULER
export const startCronJobs = () => {
  // audit-reminder: 5PM daily, checks if no audit submitted that day
  cron.schedule('0 17 * * *', async () => {
    console.log('[Cron] Running 5PM audit-reminder');
    // Mocking finding engineers without audit
    await queues.auditReminder.add('check-audits', { date: new Date().toISOString() });
  });

  // report-reminder: 7AM daily, checks if no attendance logged
  cron.schedule('0 7 * * *', async () => {
    console.log('[Cron] Running 7AM report-reminder');
    await queues.reportReminder.add('check-reports', { date: new Date().toISOString() });
  });

  // whatsapp-digest: 6PM daily PM summary
  cron.schedule('0 18 * * *', async () => {
    console.log('[Cron] Running 6PM whatsapp-digest');
    await queues.whatsappDigest.add('daily-digest', { pmId: 'admin-1', auditSummary: 'All complete', attendanceSummary: '92% overall' });
  });

  // milestone-overdue: Nightly
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running nightly milestone-overdue check');
    await queues.milestoneOverdue.add('check-milestones', {});
  });
};
