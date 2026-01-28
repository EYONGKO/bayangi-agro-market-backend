import express from 'express';
import Post from '../models/Post.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: list
router.get('/', async (req, res, next) => {
  try {
    const { category, q } = req.query;

    const filter = {};
    if (category) filter.category = String(category);
    if (q) filter.title = { $regex: String(q), $options: 'i' };

    const items = await Post.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Public: get
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Post.findById(req.params.id);
    if (!item) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// Admin: create
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const created = await Post.create(body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// Admin: update
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true });
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
    const deleted = await Post.findByIdAndDelete(req.params.id);
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
