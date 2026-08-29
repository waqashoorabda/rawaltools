import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
