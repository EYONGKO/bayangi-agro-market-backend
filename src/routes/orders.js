import express from 'express';
import Order from '../models/Order.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get orders by sellerId (public endpoint for sellers)
router.get('/seller/:sellerId', async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { status, limit = 50 } = req.query;

    const filter = { sellerId: String(sellerId) };
    if (status) filter.status = String(status);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

// Admin: list
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status, sellerId, q } = req.query;

    const filter = {};
    if (status) filter.status = String(status);
    if (sellerId) filter.sellerId = String(sellerId);
    if (q) {
      const query = String(q);
      filter.$or = [
        { buyerName: { $regex: query, $options: 'i' } },
        { buyerEmail: { $regex: query, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

// Admin: get
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
});

// Admin: create
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const created = await Order.create(body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// Admin: update
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true });
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
    const deleted = await Order.findByIdAndDelete(req.params.id);
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
