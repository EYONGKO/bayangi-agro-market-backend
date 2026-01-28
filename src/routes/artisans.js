import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Public: list artisans (sellers only)
router.get('/', async (_req, res, next) => {
  try {
    // Find all users with seller or both role (these are artisans)
    const artisans = await User.find(
      { role: { $in: ['seller', 'both'] } }, 
      { passwordHash: 0 }
    ).sort({ createdAt: -1 }).limit(500);
    
    console.log(`Found ${artisans.length} artisans`);
    res.json(artisans);
  } catch (e) {
    console.error('Error fetching artisans:', e);
    next(e);
  }
});

export default router;
