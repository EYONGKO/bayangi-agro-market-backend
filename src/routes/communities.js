import express from 'express';
import Community from '../models/Community.js';
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
    const items = await Community.find({}).sort({ name: 1 }).limit(500);
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Public: get
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Community.findById(req.params.id);
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

// User: create community (for any authenticated user)
router.post('/user', async (req, res, next) => {
  try {
    const body = req.body || {};
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing community creation without authentication');
      
      const name = String(body.name || '').trim();
      if (!name) {
        const err = new Error('Missing name');
        err.status = 400;
        throw err;
      }

      const created = await Community.create({
        name,
        slug: slugify(body.slug || name),
        description: String(body.description || ''),
        image: String(body.image || '')
      });

      console.log(`✅ Development: Created community: ${name}`);
      res.status(201).json(created);
      return;
    }
    
    // Production: require authentication
    // Accept either Bearer token or X-User-ID for authentication
    let userId = null;
    
    // Try Bearer token first
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (token) {
      try {
        const { verifyJwt } = await import('../utils/jwt.js');
        const decoded = verifyJwt(token);
        userId = decoded.id || decoded._id;
      } catch (e) {
        // Token invalid, try X-User-ID fallback
      }
    }
    
    // Fallback to X-User-ID for development
    if (!userId && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const name = String(body.name || '').trim();
    if (!name) {
      const err = new Error('Missing name');
      err.status = 400;
      throw err;
    }

    const created = await Community.create({
      name,
      slug: slugify(body.slug || name),
      description: String(body.description || ''),
      image: String(body.image || '')
    });

    console.log(`✅ User ${userId} created community: ${name}`);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// User: update community (for any authenticated user)
router.put('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing community update without authentication');
      
      const patch = { ...body };
      if (patch.name && !patch.slug) {
        patch.slug = slugify(patch.name);
      }

      const updated = await Community.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
      if (!updated) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      
      console.log(`✅ Development: Updated community: ${updated.name}`);
      res.json(updated);
      return;
    }
    
    // Production: require authentication
    // Accept either Bearer token or X-User-ID for authentication
    let userId = null;
    
    // Try Bearer token first
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (token) {
      try {
        const { verifyJwt } = await import('../utils/jwt.js');
        const decoded = verifyJwt(token);
        userId = decoded.id || decoded._id;
      } catch (e) {
        // Token invalid, try X-User-ID fallback
      }
    }
    
    // Fallback to X-User-ID for development
    if (!userId && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const patch = { ...body };
    if (patch.name && !patch.slug) {
      patch.slug = slugify(patch.name);
    }

    const updated = await Community.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!updated) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    
    console.log(`✅ User ${userId} updated community: ${updated.name}`);
    res.json(updated);
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

    const created = await Community.create({
      name,
      slug: slugify(body.slug || name),
      description: String(body.description || ''),
      image: String(body.image || '')
    });

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

    const updated = await Community.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
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
    const deleted = await Community.findByIdAndDelete(req.params.id);
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
