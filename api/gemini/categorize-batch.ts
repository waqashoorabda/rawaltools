import { categorizeBatchWithGemini } from '../../server/geminiService.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
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

    return res.status(200).json({
      success: true,
      data: result.results,
      provider: result.provider,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in categorize-batch serverless API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to categorize batch with Gemini.',
    });
  }
}
