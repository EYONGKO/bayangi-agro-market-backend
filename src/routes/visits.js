import express from 'express';
import Visit from '../models/Visit.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/visits
 * Public. Records a page visit (path, optional userAgent).
 */
router.post('/', async (req, res, next) => {
  try {
    const path = typeof req.body?.path === 'string' ? req.body.path.trim() || '/' : '/';
    const userAgent = typeof req.body?.userAgent === 'string' ? req.body.userAgent.slice(0, 512) : '';
    await Visit.create({ path, userAgent });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/visits
 * Admin only. Lists recent visits, optionally ?limit=100.
 */
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(String(req.query.limit), 10) || 50), 500);
    const list = await Visit.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/visits
 * Admin only. Clears all visitor records.
 */
router.delete('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await Visit.deleteMany({});
    res.json({ 
      ok: true, 
      deletedCount: result.deletedCount,
      message: `Successfully cleared ${result.deletedCount} visitor records`
    });
  } catch (e) {
    next(e);
  }
});

export default router;
