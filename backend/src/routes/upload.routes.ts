import { Router } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Validate and initialize S3 Client only if we have credentials
let s3Client: S3Client | null = null;

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET) {
  s3Client = new S3Client({
    region: env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
  });
}

router.post('/presigned-url', authenticate, async (req, res) => {
  if (!s3Client || !env.AWS_ACCESS_KEY_ID) {
    return res.status(503).json({ error: 'S3 not configured — set AWS credentials in .env' });
  }

  try {
    const { filename, contentType } = req.body;
    
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const key = `uploads/${req.user.id}/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    // URL expires in 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    res.json({
      uploadUrl,
      key,
      publicUrl: `https://${env.S3_BUCKET}.s3.${env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
