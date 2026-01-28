import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'buyer' } = req.body || {};

    if (!name || !email || !password) {
      const err = new Error('Missing fields');
      err.status = 400;
      throw err;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: role,
      verifiedSeller: role !== 'buyer'
    });

    const token = signJwt({ sub: user._id.toString(), email: user.email, name: user.name });

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      const err = new Error('Missing fields');
      err.status = 400;
      throw err;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const token = signJwt({ sub: user._id.toString(), email: user.email, name: user.name });

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
