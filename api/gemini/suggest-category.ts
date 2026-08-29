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
    const { title, shortDescription, fullDescription, availableCategories } = req.body || {};

    if (!title && !shortDescription && !fullDescription) {
      return res.status(400).json({ 
        success: false, 
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
3. reason (A short 1-sentence explanation of why this category fits)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert industrial hardware catalog categorization assistant for Rawal Tools (rawaltools.com). Your job is to accurately classify power tools, machinery, hand tools, welding machines, measuring equipment, drill bits, and safety gear based on product titles and technical descriptions.',
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

    return res.status(200).json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error in suggest-category serverless API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze product category with Gemini.',
    });
  }
}
