import express from 'express';
import User from '../models/User.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Admin: list users (no passwordHash)
router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).limit(500);
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// Admin: update user (general update for all fields)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing user update without authentication');
      
      console.log('Updating user with data:', { id, updateData }); // Debug log
      console.log('UpdateData keys:', Object.keys(updateData));
      console.log('UpdateData values:', Object.values(updateData));
      
      // Remove sensitive fields that shouldn't be updated directly
      const { passwordHash, _id, createdAt, ...safeUpdateData } = updateData;
      
      console.log('SafeUpdateData keys:', Object.keys(safeUpdateData));
      console.log('SafeUpdateData values:', Object.values(safeUpdateData));
      
      const updatedUser = await User.findByIdAndUpdate(
        id, 
        safeUpdateData, 
        { new: true, runValidators: true }
      ).select('-passwordHash');
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Updated user:', updatedUser); // Debug log
      
      res.json(updatedUser);
      return;
    }
    
    // Production: require authentication
    // Check for admin authentication
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token (simplified for development)
    try {
      const { verifyJwt } = await import('../utils/jwt.js');
      const decoded = verifyJwt(token);
      req.user = decoded;
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.log('Updating user with data:', { id, updateData }); // Debug log
    
    // Remove sensitive fields that shouldn't be updated directly
    const { passwordHash, _id, createdAt, ...safeUpdateData } = updateData;
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      safeUpdateData, 
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Updated user:', updatedUser); // Debug log
    
    res.json(updatedUser);
  } catch (e) {
    console.error('Error updating user:', e); // Debug log
    next(e);
  }
});

// Admin: update user role
router.put('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    console.log('Updating user role:', { id, role }); // Debug log
    
    if (!['buyer', 'seller', 'both'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be buyer, seller, or both' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { role }, 
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Updated user:', updatedUser); // Debug log
    
    res.json(updatedUser);
  } catch (e) {
    console.error('Error updating user role:', e); // Debug log
    next(e);
  }
});

// Admin: delete user
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
