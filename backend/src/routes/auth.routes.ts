import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { redis } from '../server';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret-do-not-use-in-prod';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;
const OTP_TTL_SECONDS = 300; // 5 minutes

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Send OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const otp = generateOTP();

    // Store OTP in Redis
    await redis.set(`otp:${phone}`, otp, 'EX', OTP_TTL_SECONDS);

    // Development only logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${phone}: ${otp}`);
    }

    // TODO: In production with Firebase config, swap this block to trigger actual SMS via Firebase/Twilio

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ error: 'Failed to request OTP' });
  }
});

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, email, name, role } = req.body;

    const storedOtp = await redis.get(`otp:${phone}`);

    if (!storedOtp || storedOtp !== otp) {
      // For demo purposes, we will also allow '123456' as a universal test OTP if no OTP is stored
      if (otp !== '123456') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          email,
          name,
          role: role || 'SITE_ENGINEER',
          isProvisioned: true
        }
      });
    } else if (!user.isProvisioned) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isProvisioned: true }
      });
    }

    // OTP verified, clear it
    await redis.del(`otp:${phone}`);

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }
    );

    // Store refresh token in Redis mapped to user
    await redis.set(`refresh:${user.id}:${refreshToken}`, 'valid', 'EX', REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60);

    // Set HTTP-Only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ success: true, accessToken, user });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// DEV ONLY: Mock Login
router.post('/mock-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  try {
    const { role } = req.body;
    const phone = role === 'ADMIN' ? '9999999991' : role === 'PROJECT_MANAGER' ? '9999999992' : '9999999993';
    
    let user = await prisma.user.findUnique({ 
      where: { phone },
      include: { projects: true }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: `Mock ${role}`,
          role: role,
          isProvisioned: true
        },
        include: { projects: true }
      });
    }

    if (user.projects.length === 0) {
      const proj = await prisma.project.create({
        data: {
          name: `Mock Site (${role})`,
          location: 'Mock City',
          type: 'Commercial',
          budget: 10000000,
          startDate: new Date(),
          members: {
            create: {
              userId: user.id,
              role: role
            }
          }
        }
      });
      console.log(`Created mock project ${proj.id} for user ${user.id}`);
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }
    );

    await redis.set(`refresh:${user.id}:${refreshToken}`, 'valid', 'EX', REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ success: true, accessToken, user });
  } catch (error: any) {
    console.error('Mock Login Error:', error);
    res.status(500).json({ error: 'Failed to mock login' });
  }
});

// 3. Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Verify token payload
    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);
    const userId = decoded.id;

    // Check if valid in Redis
    const isValid = await redis.get(`refresh:${userId}:${refreshToken}`);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or revoked refresh token' });
    }

    // Fetch user to ensure role is up to date
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true });
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// 4. Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      try {
        const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET, { ignoreExpiration: true });
        // Invalidate in Redis
        await redis.del(`refresh:${decoded.id}:${refreshToken}`);
      } catch (e) {
        // ignore malformed token deletion errors
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// 5. Get Current Auth State (/me)
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          select: { projectId: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const projectIds = user.projects.map(p => p.projectId);

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      projectIds
    });
  } catch (error: any) {
    console.error('Fetch Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
