import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import RedisMock from 'ioredis-mock';

// Shared Redis connection
const connection = process.env.NODE_ENV === 'development'
  ? new RedisMock() as any
  : new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

// Create Queues - Mock them if in dev to prevent BullMQ script hangs on ioredis-mock
export const queues = process.env.NODE_ENV === 'development' 
? {
    auditReminder: { add: async () => {} } as any,
    reportReminder: { add: async () => {} } as any,
    whatsappDigest: { add: async () => {} } as any,
    milestoneOverdue: { add: async () => {} } as any,
    inventoryAlert: { add: async () => {} } as any,
  }
: {
    auditReminder: new Queue('audit-reminder', { connection }),
    reportReminder: new Queue('report-reminder', { connection }),
    whatsappDigest: new Queue('whatsapp-digest', { connection }),
    milestoneOverdue: new Queue('milestone-overdue', { connection }),
    inventoryAlert: new Queue('inventory-alert', { connection }),
  };

// Create Workers
const createWorker = (queueName: string, processor: (job: any) => Promise<void>) => {
  if (process.env.NODE_ENV === 'development') return null; // Skip workers in dev
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

// 5. WhatsApp Digest Worker (handles remaining triggers via different job names)
createWorker('whatsapp-digest', async (job) => {
  const { name, data } = job;
  
  switch(name) {
    case 'daily-digest':
      const pmDedup = `dedup:daily-digest:${data.pmId}`;
      if (!(await shouldProcess(pmDedup))) return;
      console.log(`[WhatsApp Worker] Type: daily-digest | Sent 6PM Daily Digest to PM. Audits: ${data.auditSummary}, Attendance: ${data.attendanceSummary}`);
      break;
    
    case 'high-risk-variance':
      console.log(`[WhatsApp Worker] Type: high-risk-variance | Sent High-Risk Variance Alert: ${data.material} at ${data.variancePct}% variance`);
      break;

    case 'headcount-divergence':
      console.log(`[WhatsApp Worker] Type: headcount-divergence | Sent Headcount Divergence Alert for ${data.crew}: Reported ${data.reported} vs Estimated ${data.estimated}`);
      break;

    case 'pm-manual-reminder':
      console.log(`[WhatsApp Worker] Type: pm-manual-reminder | PM sent manual reminder to ${data.engineerName}: "${data.message}"`);
      break;

    default:
      console.log(`[WhatsApp Worker] Type: unknown | Received unknown job type: ${name}`);
  }
  
  // Artificial delay to mock network request
  await new Promise(resolve => setTimeout(resolve, 1000));
});
