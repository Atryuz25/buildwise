import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Simulating OTP storage for demo (In prod, use Redis or DB with expiry)
const otpStore: Record<string, string> = {};

// 1. Send OTP for Registration
router.post('/register/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
  }

  // Simulate OTP generation
  const otp = '123456'; // Hardcoded for demo purposes so user doesn't have to check logs
  otpStore[phone] = otp;

  console.log(`[SIMULATED SMS] OTP for ${phone} is ${otp}`);

  res.json({ success: true, message: 'OTP sent successfully (Use 123456 for demo)' });
});

// 2. Verify OTP and complete registration
router.post('/register/verify', async (req, res) => {
  const { phone, otp, email, password, name, role } = req.body;

  if (otpStore[phone] !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // OTP verified, create user
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone or email already exists' });
    }

    const user = await prisma.user.create({
      data: {
        phone,
        email,
        password, // In prod, we would hash this (e.g., bcrypt)
        name,
        role: role || 'SITE_ENGINEER'
      }
    });

    delete otpStore[phone]; // Clear OTP

    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 3. Login with Email and Password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // In prod, return a JWT token here
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
