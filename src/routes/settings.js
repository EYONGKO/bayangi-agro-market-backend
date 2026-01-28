import express from 'express';
import SiteSettings from '../models/SiteSettings.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const SITE_KEY = 'site';

/**
 * GET /api/settings
 * Public. Returns current site settings (hero, features, header, footer, etc.).
 */
router.get('/', async (_req, res, next) => {
  try {
    const doc = await SiteSettings.findOne({ key: SITE_KEY }).lean();
    const value = doc?.value ?? {};
    res.json(value);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/settings
 * Admin only. Replaces site settings with request body.
 */
router.put('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const value = req.body && typeof req.body === 'object' ? req.body : {};
    const updated = await SiteSettings.findOneAndUpdate(
      { key: SITE_KEY },
      { $set: { value, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.json(updated.value);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/settings
 * Temporarily without auth for clearing. Clears site settings to force fallback to defaults.
 */
router.delete('/', async (req, res, next) => {
  try {
    await SiteSettings.deleteOne({ key: SITE_KEY });
    res.json({ message: 'Site settings cleared. Will fall back to defaults.' });
  } catch (e) {
    next(e);
  }
});

export default router;
