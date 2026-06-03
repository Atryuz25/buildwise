import { z } from 'zod';
import dotenv from 'dotenv';

// Load variables from .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // AWS S3
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string(),
  
  // APIs
  OPENWEATHERMAP_API_KEY: z.string().optional(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().min(32).describe('Must be at least 32 characters for AES-256-CBC'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
