import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import Community from './models/Community.js';
import Category from './models/Category.js';
import Post from './models/Post.js';

const port = Number(process.env.PORT || 8080);

async function connectWithRetry(uri, attempt = 1) {
  try {
    // MongoDB Atlas requires SSL/TLS. Configure connection options to handle SSL properly.
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    // If using MongoDB Atlas (mongodb+srv://), ensure SSL is enabled
    if (uri.includes('mongodb+srv://') || uri.includes('mongodb.net')) {
      options.tls = true;
      // MongoDB Atlas uses valid certificates, so we don't allow invalid ones
      // If you get SSL errors, check:
      // 1. Your IP is whitelisted in MongoDB Atlas Network Access
      // 2. Your connection string is correct
      // 3. Your network isn't blocking SSL/TLS connections
    }
    
    await mongoose.connect(uri, options);
    return true;
  } catch (err) {
    const delayMs = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
    // eslint-disable-next-line no-console
    console.error(`[api] mongodb connection failed (attempt ${attempt}). Retrying in ${Math.round(delayMs / 1000)}s`);
    
    // Provide helpful error messages for common SSL issues
    const errMsg = err?.message || String(err);
    if (errMsg.includes('SSL') || errMsg.includes('TLS') || errMsg.includes('tlsv1')) {
      // eslint-disable-next-line no-console
      console.error('[api] SSL/TLS error detected. Common fixes:');
      // eslint-disable-next-line no-console
      console.error('  1. Check MongoDB Atlas Network Access - ensure your IP is whitelisted (or use 0.0.0.0/0 for all)');
      // eslint-disable-next-line no-console
      console.error('  2. Verify your MONGODB_URI connection string is correct');
      // eslint-disable-next-line no-console
      console.error('  3. Check if your firewall/network allows SSL/TLS connections');
    }
    
    // eslint-disable-next-line no-console
    console.error(err);
    
    // Don't retry indefinitely if it's a configuration error
    if (attempt >= 3 && (errMsg.includes('authentication') || errMsg.includes('IP'))) {
      // eslint-disable-next-line no-console
      console.error('[api] Stopping retries - this appears to be a configuration issue (auth/IP whitelist)');
      throw err;
    }
    
    await new Promise((r) => setTimeout(r, delayMs));
    return connectWithRetry(uri, attempt + 1);
  }
}

async function seedDemoData() {
  const shouldSeed = ['1', 'true', 'yes'].includes(String(process.env.SEED_DEMO || '').toLowerCase());
  if (!shouldSeed) return;

  await Community.bulkWrite(
    [
      {
        updateOne: {
          filter: { slug: 'kendem' },
          update: {
            $setOnInsert: {
              name: 'Kendem',
              slug: 'kendem',
              description: 'Handcrafted goods and artisan stories',
              image: '/kendem-hero.jpg'
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { slug: 'mamfe' },
          update: {
            $setOnInsert: {
              name: 'Mamfe',
              slug: 'mamfe',
              description: 'Sustainable agriculture and farm produce',
              image: '/mamfe-hero.jpg'
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { slug: 'widikum' },
          update: {
            $setOnInsert: {
              name: 'Widikum',
              slug: 'widikum',
              description: 'Traditional weaving and textile heritage',
              image: '/widikum-hero.jpg'
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { slug: 'membe' },
          update: {
            $setOnInsert: {
              name: 'Membe',
              slug: 'membe',
              description: 'Coffee farming and harvest communities',
              image: '/membe-hero.jpg'
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { slug: 'fonjo' },
          update: {
            $setOnInsert: {
              name: 'Fonjo',
              slug: 'fonjo',
              description: 'Renowned for textiles and traditional weaving',
              image: '/fonjo-hero.jpg'
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { slug: 'moshie-kekpoti' },
          update: {
            $setOnInsert: {
              name: 'Moshie/Kekpoti',
              slug: 'moshie-kekpoti',
              description: 'Fusion of tradition and innovation',
              image: '/moshie-kekpoti-hero.png'
            }
          },
          upsert: true
        }
      }
    ],
    { ordered: false }
  );

  const [categoryCount, postCount] = await Promise.all([Category.countDocuments({}), Post.countDocuments({})]);

  if (categoryCount === 0) {
    await Category.insertMany([
      { name: 'Community Success', slug: 'community-success' },
      { name: 'Agriculture', slug: 'agriculture' },
      { name: 'Platform Updates', slug: 'platform-updates' },
      { name: 'Awards', slug: 'awards' },
      { name: 'Business', slug: 'business' }
    ]);
  }

  if (postCount === 0) {
    await Post.insertMany([
      {
        title: 'Kendem Artisans Expand Global Reach with New Collection',
        excerpt:
          'Local craftspeople from Kendem community are seeing unprecedented success with their handmade products reaching markets across three continents.',
        category: 'Community Success',
        image: '/kendem-hero.jpg',
        author: 'Local Roots',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        tags: ['Kendem', 'Success Story', 'Global Market'],
        content: [
          'Kendem artisans are celebrating a breakthrough season as their handcrafted goods gain traction in international markets.',
          'Through improved product presentation, community training, and easier access to online buyers, creators have increased sales while preserving cultural craftsmanship.'
        ]
      },
      {
        title: 'Sustainable Farming Practices Transform Mamfe Agriculture',
        excerpt:
          'Farmers in Mamfe are implementing innovative sustainable practices that are increasing yields while protecting the environment.',
        category: 'Agriculture',
        image: '/mamfe-hero.jpg',
        author: 'Local Roots',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        tags: ['Mamfe', 'Sustainability', 'Farming'],
        content: [
          'In Mamfe, farmers are adopting soil health programs, composting, and improved water management to stabilize yields year-round.',
          'These changes reduce costs and make supply more reliable for local and international buyers.'
        ]
      }
    ]);
  }
}

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI');
  }

  app.locals.dbReady = false;

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${port}`);
  });

  await connectWithRetry(uri);
  app.locals.dbReady = true;
  // eslint-disable-next-line no-console
  console.log('[api] connected to mongodb');

  await seedDemoData();
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[api] failed to start', err);
  process.exit(1);
});
