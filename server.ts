import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initStoreDatabase, getStoreDatabase, saveStoreDatabase } from './server/storeData.js';
import { 
  suggestCategoryWithGemini, 
  categorizeBatchWithGemini, 
  getGeminiStatus, 
  checkRateLimit 
} from './server/geminiService.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize server-side persistent database
initStoreDatabase();

// Dynamic build & startup timestamp used for auto-cache busting across all devices
const APP_START_TIME = new Date().toISOString();
const APP_BUILD_VERSION = process.env.APP_VERSION || `build-${Date.now()}`;

app.use(express.json({ limit: '10mb' }));

// Anti-cache header middleware for all API routes
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Real-time Version & Fresh Copy Check Endpoint
app.get('/api/version', (req, res) => {
  res.json({
    status: 'ok',
    version: APP_BUILD_VERSION,
    deployedAt: APP_START_TIME,
    timestamp: Date.now(),
  });
});

// Persistent Store Data: GET full store configuration and catalog
app.get('/api/store/data', (req, res) => {
  const db = getStoreDatabase();
  res.json({
    success: true,
    isCustomized: db.isCustomized,
    lastUpdated: db.lastUpdated,
    data: db,
  });
});

// Persistent Store Data: POST full store updates
app.post('/api/store/data', (req, res) => {
  try {
    const updates = req.body;
    const updated = saveStoreDatabase(updates);
    res.json({
      success: true,
      isCustomized: updated.isCustomized,
      lastUpdated: updated.lastUpdated,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save store data' });
  }
});

// Persistent Store Data: POST update specific section (e.g. settings, products, pageContent)
app.post('/api/store/section', (req, res) => {
  try {
    const { section, data } = req.body;
    if (!section || data === undefined) {
      return res.status(400).json({ success: false, error: 'Section and data are required' });
    }
    const updated = saveStoreDatabase({ [section]: data });
    res.json({
      success: true,
      section,
      lastUpdated: updated.lastUpdated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save section' });
  }
});

// Admin Logout: clears session cookies without wiping persistent store data
app.post('/api/admin/logout', (req, res) => {
  res.set({
    'Clear-Site-Data': '"cookies"',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.json({ success: true, message: 'Admin logged out, session cookies cleared.' });
});

// Server-side Clear Site Data (Cookies & Cache ONLY, NEVER Storage to preserve user data)
app.get('/api/clear-site-data', (req, res) => {
  res.set({
    'Clear-Site-Data': '"cache", "cookies"',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  const redirectTo = (req.query.redirect as string) || '/?fresh=' + Date.now();
  res.redirect(redirectTo);
});

// Gemini AI Status & Diagnostics Endpoint (Sanitized, never reveals secret key string)
app.get('/api/gemini/status', (req, res) => {
  const status = getGeminiStatus();
  res.json({
    success: true,
    data: status,
  });
});

// Single product category suggestion endpoint with anti-abuse rate limiting and model fallback
app.post('/api/gemini/suggest-category', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const rate = checkRateLimit(clientIp);

  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit reached for AI categorization. Please wait 1 minute before making further requests.',
      resetInMs: rate.resetInMs,
    });
  }

  try {
    const { title, shortDescription, fullDescription, availableCategories } = req.body || {};

    if (!title && !shortDescription && !fullDescription) {
      return res.status(400).json({ 
        success: false,
        error: 'At least a title or description is required for category analysis.' 
      });
    }

    const result = await suggestCategoryWithGemini({
      title,
      shortDescription,
      fullDescription,
      availableCategories,
    });

    return res.json({
      success: true,
      data: {
        suggestedCategory: result.suggestedCategory,
        confidence: result.confidence,
        reason: result.reason,
      },
      provider: result.provider,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in suggest-category API:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to analyze category at this moment. Please try again or assign manually.',
    });
  }
});

// Batch products categorization endpoint with strict rate limiting and batch limits
app.post('/api/gemini/categorize-batch', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const rate = checkRateLimit(clientIp);

  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit reached for AI categorization. Please wait 1 minute before making further requests.',
      resetInMs: rate.resetInMs,
    });
  }

  try {
    const { products, availableCategories } = req.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'Products array is required.' });
    }

    const result = await categorizeBatchWithGemini({
      products,
      availableCategories,
    });

    return res.json({
      success: true,
      data: result.results,
      provider: result.provider,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in categorize-batch API:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to complete batch categorization at this moment. Please try again later.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Static assets serving with specific cache control rules
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          // HTML, JSON, and entry files must NEVER be cached by browsers on any device
          if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
          } else if (filePath.includes('/assets/')) {
            // Hashed JS/CSS bundle assets can be cached because hashes change on every build
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    // SPA fallback: index.html must ALWAYS be freshly retrieved
    app.get('*', (req, res) => {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      });
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
