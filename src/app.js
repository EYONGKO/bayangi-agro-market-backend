import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import artisanRoutes from './routes/artisans.js';
import communityRoutes from './routes/communities.js';
import categoryRoutes from './routes/categories.js';
import postRoutes from './routes/posts.js';
import uploadRoutes from './routes/uploads.js';
import settingsRoutes from './routes/settings.js';
import visitsRoutes from './routes/visits.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, dbReady: Boolean(app.locals.dbReady) });
});

app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (req.path.startsWith('/api') && !app.locals.dbReady) {
    return res.status(503).json({ error: 'Database unavailable. Check MongoDB connection/Atlas IP whitelist.' });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/visits', visitsRoutes);

app.use((err, _req, res, _next) => {
  const status = Number(err?.status || 500);
  res.status(status).json({ error: err?.message || 'Server error' });
});

export default app;
