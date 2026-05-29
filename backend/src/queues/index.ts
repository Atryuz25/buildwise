import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Shared Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create Queues
export const queues = {
  auditReminder: new Queue('audit-reminder', { connection }),
  reportReminder: new Queue('report-reminder', { connection }),
  whatsappDigest: new Queue('whatsapp-digest', { connection }),
  milestoneOverdue: new Queue('milestone-overdue', { connection }),
};

// Create Workers
const createWorker = (queueName: string, processor: (job: any) => Promise<void>) => {
  const worker = new Worker(queueName, processor, { connection });
  worker.on('failed', (job, err) => {
    console.error(`[Worker Error] ${queueName} job ${job?.id} failed:`, err.message);
  });
  return worker;
};

// 1. Audit Reminder Worker (Overdue audit alert)
createWorker('audit-reminder', async (job) => {
  console.log(`[Audit Worker] Overdue Audit Alert sent to Engineer: ${job.data.engineerName} (${job.data.daysOverdue} days overdue)`);
});

// 2. Report Reminder Worker
createWorker('report-reminder', async (job) => {
  console.log(`[Report Worker] Report Reminder sent`);
});

// 3. Milestone Overdue Worker (Milestone overdue)
createWorker('milestone-overdue', async (job) => {
  console.log(`[Milestone Worker] Milestone Overdue Alert: Contractor ${job.data.contractor}, Amount ₹${job.data.amount}, ${job.data.daysOverdue} days overdue`);
});

// 4. WhatsApp Digest Worker (handles remaining triggers via different job names)
createWorker('whatsapp-digest', async (job) => {
  const { name, data } = job;
  
  switch(name) {
    case 'daily-digest':
      // 6PM daily digest to PM (audit summary + attendance summary)
      console.log(`[WhatsApp Worker] Type: daily-digest | Sent 6PM Daily Digest to PM. Audits: ${data.auditSummary}, Attendance: ${data.attendanceSummary}`);
      break;
    
    case 'inventory-critical':
      // Inventory critical (material + days remaining)
      console.log(`[WhatsApp Worker] Type: inventory-critical | Sent Critical Inventory Alert: ${data.material} has ${data.daysRemaining} days remaining`);
      break;

    case 'high-risk-variance':
      // High-risk variance (material + variance %)
      console.log(`[WhatsApp Worker] Type: high-risk-variance | Sent High-Risk Variance Alert: ${data.material} at ${data.variancePct}% variance`);
      break;

    case 'headcount-divergence':
      // Headcount divergence ≥30% (crew + reported vs estimated)
      console.log(`[WhatsApp Worker] Type: headcount-divergence | Sent Headcount Divergence Alert for ${data.crew}: Reported ${data.reported} vs Estimated ${data.estimated}`);
      break;

    case 'pm-manual-reminder':
      // PM manual reminder button (sends to specific engineer)
      console.log(`[WhatsApp Worker] Type: pm-manual-reminder | PM sent manual reminder to ${data.engineerName}: "${data.message}"`);
      break;

    default:
      console.log(`[WhatsApp Worker] Type: unknown | Received unknown job type: ${name}`);
  }
  
  // Artificial delay to mock network request
  await new Promise(resolve => setTimeout(resolve, 1000));
});
