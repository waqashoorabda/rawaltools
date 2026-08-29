import { GoogleGenAI, Type } from '@google/genai';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'rawaltools-web',
      },
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { products, availableCategories } = req.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'Products array is required.' });
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
    const productItemsText = products.map((p: any, idx: number) => {
      return `Item #${idx + 1} [ID: ${p.id}]:
- Title: ${p.name || 'Untitled'}
- Current Category: ${p.category || 'Missing/Uncategorized'}
- Brand: ${p.brand || 'N/A'}
- Short Summary: ${p.shortDescription || 'N/A'}
- Full Details: ${p.fullDescription || 'N/A'}`;
    }).join('\n\n');

    const prompt = `You are categorizing a batch of industrial/hardware tools for Rawal Tools (rawaltools.com).
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
        systemInstruction: 'You are an expert industrial hardware catalog manager for Rawal Tools. Analyze product titles, brand names, specifications, and descriptions to assign the most appropriate category.',
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

    return res.status(200).json({
      success: true,
      data: parsed.results || [],
    });
  } catch (error: any) {
    console.error('Error in categorize-batch serverless API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to categorize batch with Gemini.',
    });
  }
}
