import { suggestCategoryWithGemini } from '../../server/geminiService.js';

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

    const result = await suggestCategoryWithGemini({
      title,
      shortDescription,
      fullDescription,
      availableCategories,
    });

    return res.status(200).json({
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
    console.error('Error in suggest-category serverless API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze product category with Gemini.',
    });
  }
}
