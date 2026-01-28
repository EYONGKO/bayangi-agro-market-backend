import express from 'express';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get products by vendor (public endpoint for sellers)
router.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { community, limit = 50 } = req.query;

    const filter = { vendor: String(vendorId) };
    if (community) filter.community = String(community);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.json(products);
  } catch (e) {
    next(e);
  }
});

// Public: list products
router.get('/', async (req, res, next) => {
  try {
    const { community, q } = req.query;

    const filter = {};
    if (community) filter.community = String(community);
    if (q) filter.name = { $regex: String(q), $options: 'i' };

    const products = await Product.find(filter)
      .select('_id name price description image category community vendor stock rating reviews likes')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(products);
  } catch (e) {
    next(e);
  }
});

// User: create product (base64 image support) - v2.0.1
router.post('/user', async (req, res, next) => {
  try {
    const { name, description, price, category, image, community, stock } = req.body;
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing product creation without authentication');
      
      const product = new Product({
        name,
        description,
        price,
        category,
        image, // Store base64 directly
        community: community || 'Default',
        stock: stock || 0,
        vendor: 'Development User',
        rating: 0,
        reviews: 0,
        likes: 0
      });
      
      await product.save();
      console.log('Product created successfully:', product.name);
      res.status(201).json(product);
      return;
    }
    
    // Production: require authentication
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
    
    const product = new Product({
      name,
      description,
      price,
      category,
      image, // Store base64 directly
      community: community || 'Default',
      stock: stock || 0,
      vendor: req.user.email || 'Unknown',
      rating: 0,
      reviews: 0,
      likes: 0
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (e) {
    console.error('Error creating product:', e);
    next(e);
  }
});

// User: update product (base64 image support)
router.put('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing product update without authentication');
      
      const updated = await Product.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      console.log('Product updated successfully:', updated.name);
      res.json(updated);
      return;
    }
    
    // Production: require authentication
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
    
    const updated = await Product.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product updated successfully:', updated.name);
    res.json(updated);
  } catch (e) {
    console.error('Error updating product:', e);
    next(e);
  }
});

// Public: get product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    res.json(product);
  } catch (e) {
    next(e);
  }
});

// User: create product (for any authenticated user)
router.post('/user', async (req, res, next) => {
  try {
    const body = req.body || {};
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing product creation without authentication');
      
      // Add user ID to product data
      const productData = {
        ...body,
        userId: 'dev-user',
        // Ensure required fields
        name: body.name || 'Untitled Product',
        price: Number(body.price) || 0,
        category: body.category || 'Others',
        community: body.community || 'global',
        vendor: body.vendor || 'Local Vendor',
        description: body.description || '',
        image: body.image || '',
        images: body.images || [],
        stock: Number(body.stock) || 0,
        rating: 0,
        reviews: 0,
        likes: 0
      };
      
      const created = await Product.create(productData);
      console.log(`✅ Development: Created product: ${productData.name}`);
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
    
    // Add user ID to product data
    const productData = {
      ...body,
      userId: userId,
      // Ensure required fields
      name: body.name || 'Untitled Product',
      price: Number(body.price) || 0,
      category: body.category || 'Others',
      community: body.community || 'global',
      vendor: body.vendor || 'Local Vendor',
      description: body.description || '',
      image: body.image || '',
      images: body.images || [],
      stock: Number(body.stock) || 0,
      rating: 0,
      reviews: 0,
      likes: 0
    };
    
    // Check for duplicate product based on name, vendor, and community
    const existingProduct = await Product.findOne({
      name: productData.name,
      vendor: productData.vendor,
      community: productData.community
    });
    
    if (existingProduct) {
      return res.status(409).json({ 
        error: 'A product with this name already exists for this vendor in this community',
        duplicate: true 
      });
    }
    
    const created = await Product.create(productData);
    console.log(`✅ User ${userId} created product: ${productData.name}`);
    res.status(201).json(created);
  } catch (e) {
    // Handle MongoDB duplicate key error
    if (e.code === 11000 && e.keyPattern && e.keyPattern.name && e.keyPattern.vendor && e.keyPattern.community) {
      return res.status(409).json({ 
        error: 'A product with this name already exists for this vendor in this community',
        duplicate: true 
      });
    }
    console.error('Error creating user product:', e);
    next(e);
  }
});

// User: update product (for any authenticated user)
router.put('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    
    // Development mode: allow without authentication
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: allowing product update without authentication');
      
      // Find the product first
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Update product data with same logic as creation
      const productData = {
        name: body.name || existingProduct.name,
        price: Number(body.price) || existingProduct.price,
        category: body.category || existingProduct.category,
        community: body.community || existingProduct.community,
        vendor: body.vendor || existingProduct.vendor,
        description: body.description || existingProduct.description,
        image: body.image || existingProduct.image,
        images: body.images || existingProduct.images,
        stock: Number(body.stock) || existingProduct.stock,
        rating: existingProduct.rating,
        reviews: existingProduct.reviews,
        likes: existingProduct.likes
      };
      
      const updated = await Product.findByIdAndUpdate(id, productData, { new: true });
      console.log(`✅ Development: Updated product: ${productData.name}`);
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
    
    // Find the product first
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Update product data with same logic as creation
    const productData = {
      name: body.name || existingProduct.name,
      price: Number(body.price) || existingProduct.price,
      category: body.category || existingProduct.category,
      community: body.community || existingProduct.community,
      vendor: body.vendor || existingProduct.vendor,
      description: body.description || existingProduct.description,
      image: body.image || existingProduct.image,
      images: body.images || existingProduct.images,
      stock: Number(body.stock) || existingProduct.stock,
      rating: existingProduct.rating,
      reviews: existingProduct.reviews,
      likes: existingProduct.likes
    };
    
    const updated = await Product.findByIdAndUpdate(id, productData, { new: true });
    console.log(`✅ Updated product: ${productData.name}`);
    res.json(updated);
  } catch (e) {
    console.error('Error updating user product:', e);
    next(e);
  }
});

// Admin: create product (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    
    // Check for duplicate product based on name, vendor, and community
    const existingProduct = await Product.findOne({
      name: body.name,
      vendor: body.vendor,
      community: body.community
    });
    
    if (existingProduct) {
      return res.status(409).json({ 
        error: 'A product with this name already exists for this vendor in this community',
        duplicate: true 
      });
    }
    
    const created = await Product.create(body);
    res.status(201).json(created);
  } catch (e) {
    // Handle MongoDB duplicate key error
    if (e.code === 11000 && e.keyPattern && e.keyPattern.name && e.keyPattern.vendor && e.keyPattern.community) {
      return res.status(409).json({ 
        error: 'A product with this name already exists for this vendor in this community',
        duplicate: true 
      });
    }
    next(e);
  }
});

// Admin: update
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true });
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
    const deleted = await Product.findByIdAndDelete(req.params.id);
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
