import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { initStoreDatabase, getStoreDatabase, saveStoreDatabase } from './server/storeData.js';

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

// Lazy initialization / getter for Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure your Gemini API Key in the AI Studio settings.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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

// Single product category suggestion endpoint
app.post('/api/gemini/suggest-category', async (req, res) => {
  try {
    const { title, shortDescription, fullDescription, availableCategories } = req.body;

    if (!title && !shortDescription && !fullDescription) {
      return res.status(400).json({ 
        error: 'At least a title or description is required for category analysis.' 
      });
    }

    const categoriesList = Array.isArray(availableCategories) && availableCategories.length > 0
      ? availableCategories.filter((c: string) => c !== 'All Products')
      : [
          'Power Tools',
          'Hand Tools',
          'Welding & Cutting',
          'Measuring & Testing',
          'Workshop Machinery',
          'Drilling & Fasteners',
          'Safety & Equipment',
        ];

    const ai = getGeminiClient();

    const prompt = `Analyze this industrial / hardware tool product and determine the single most accurate category for it from the allowed categories list.
    
Product Title: ${title || 'N/A'}
Short Description: ${shortDescription || 'N/A'}
Detailed Description: ${fullDescription || 'N/A'}

Allowed Categories:
${categoriesList.map((c: string) => `- ${c}`).join('\n')}

If none of the allowed categories fit well, you may suggest an appropriate custom category name.

Provide your decision with:
1. suggestedCategory (Must be one of the allowed categories if applicable, or a concise clean category name)
2. confidence (A number from 0 to 1, e.g. 0.95)
3. reason (A short 1-sentence explanation in English/Urdu terms of why this category fits)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert industrial hardware catalog categorization assistant for Rawal Tools. Your job is to accurately classify power tools, machinery, hand tools, welding machines, measuring equipment, drill bits, and safety gear based on product titles and technical descriptions.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: {
              type: Type.STRING,
              description: 'The best matching category name.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0 and 1.',
            },
            reason: {
              type: Type.STRING,
              description: 'Short explanation of why this category was selected based on keywords.',
            },
          },
          required: ['suggestedCategory', 'confidence', 'reason'],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error in suggest-category API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze product category with Gemini.',
    });
  }
});

// Batch products categorization endpoint (for products missing a category or bulk audit)
app.post('/api/gemini/categorize-batch', async (req, res) => {
  try {
    const { products, availableCategories } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required.' });
    }

    const categoriesList = Array.isArray(availableCategories) && availableCategories.length > 0
      ? availableCategories.filter((c: string) => c !== 'All Products')
      : [
          'Power Tools',
          'Hand Tools',
          'Welding & Cutting',
          'Measuring & Testing',
          'Workshop Machinery',
          'Drilling & Fasteners',
          'Safety & Equipment',
        ];

    const ai = getGeminiClient();

    // Prepare products overview for Gemini
    const productItemsText = products.map((p, idx) => {
      return `Item #${idx + 1} [ID: ${p.id}]:
- Title: ${p.name || 'Untitled'}
- Current Category: ${p.category || 'Missing/Uncategorized'}
- Brand: ${p.brand || 'N/A'}
- Short Summary: ${p.shortDescription || 'N/A'}
- Full Details: ${p.fullDescription || 'N/A'}`;
    }).join('\n\n');

    const prompt = `You are categorizing a batch of industrial/hardware tools for Rawal Tools.
Below is a list of products that need category assignment or verification.

Allowed Standard Categories:
${categoriesList.map((c: string) => `- ${c}`).join('\n')}

Products to Analyze:
${productItemsText}

Analyze each item's title and description carefully. Return an array of recommendations matching each product's ID.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert industrial hardware catalog manager. Analyze product titles, brand names, specifications, and descriptions to assign the most appropriate category.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    description: 'The product ID matching the input item.',
                  },
                  suggestedCategory: {
                    type: Type.STRING,
                    description: 'The recommended category from the allowed list or custom if needed.',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: 'Confidence score between 0 and 1.',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Concise explanation highlighting keywords found in title/description.',
                  },
                },
                required: ['id', 'suggestedCategory', 'confidence', 'reason'],
              },
            },
          },
          required: ['results'],
        },
      },
    });

    const resultText = response.text || '{"results":[]}';
    const parsed = JSON.parse(resultText);

    return res.json({
      success: true,
      data: parsed.results || [],
    });
  } catch (error: any) {
    console.error('Error in categorize-batch API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to categorize batch with Gemini.',
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
