import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Use a local redis connection for now, simulating Upstash
// Assuming local redis is running on port 6379 via docker
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const whatsappQueue = new Queue('whatsapp-notifications', { connection });

const worker = new Worker('whatsapp-notifications', async job => {
  // Simulate sending a WhatsApp message
  console.log(`[WhatsApp Worker] Processing Job ID: ${job.id}`);
  console.log(`[WhatsApp Worker] Sending to ${job.data.phone}: "${job.data.message}"`);
  
  // Artificial delay to mock network request
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log(`[WhatsApp Worker] ✅ Successfully sent message to ${job.data.phone}`);
}, { connection });

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`[WhatsApp Worker] ❌ Job ${job.id} failed:`, err.message);
  } else {
    console.error(`[WhatsApp Worker] ❌ Unknown job failed:`, err.message);
  }
});
