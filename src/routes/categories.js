import express from 'express';
import Category from '../models/Category.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/g, '');

// Public: list
router.get('/', async (_req, res, next) => {
  try {
    const items = await Category.find({}).sort({ name: 1 }).limit(500);
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Admin: create
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) {
      const err = new Error('Missing name');
      err.status = 400;
      throw err;
    }

    const created = await Category.create({ name, slug: slugify(body.slug || name) });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// Admin: update
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const patch = { ...body };
    if (patch.name && !patch.slug) {
      patch.slug = slugify(patch.name);
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!updated) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Admin: delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
