import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Allowed standard categories for Rawal Tools catalog
export const DEFAULT_ALLOWED_CATEGORIES = [
  'Power Tools',
  'Hand Tools',
  'Welding & Cutting',
  'Measuring & Testing',
  'Workshop Machinery',
  'Drilling & Fasteners',
  'Safety & Equipment',
];

// In-memory sliding-window IP rate limiter to prevent API abuse and quota exhaustion
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute per IP

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const cleanIp = (ip || 'unknown').replace('::ffff:', '');
  const record = rateLimitMap.get(cleanIp);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(cleanIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetInMs: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetInMs: Math.max(0, record.resetAt - now) };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetInMs: Math.max(0, record.resetAt - now) };
}

// Periodically clean expired rate-limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Returns true if GEMINI_API_KEY is configured in the environment.
 * The actual key is NEVER leaked to the client or returned in public API payloads.
 */
export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

/**
 * Returns a sanitized status object for client diagnostics without revealing the API key.
 */
export function getGeminiStatus() {
  const configured = isGeminiConfigured();
  return {
    configured,
    primaryModel: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
    rulesEngine: 'Active (Industrial Hardware Taxonomy)',
    protected: true,
    serverSideOnly: true,
    rateLimit: `${MAX_REQUESTS_PER_WINDOW} req/min`,
  };
}

/**
 * Creates Google Gen AI client with server-side API key.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'rawaltools-server',
      },
    },
  });
}

// Built-in industrial hardware classification taxonomy dictionary
interface KeywordCategoryRule {
  category: string;
  keywords: string[];
}

const CATALOG_RULES: KeywordCategoryRule[] = [
  {
    category: 'Power Tools',
    keywords: [
      'drill', 'impact drill', 'hammer drill', 'angle grinder', 'grinder', 'rotary hammer',
      'circular saw', 'jigsaw', 'miter saw', 'chop saw', 'reciprocating saw', 'cordless',
      'blower', 'heat gun', 'planer', 'router', 'sander', 'polisher', 'impact driver',
      'demolition hammer', 'electric screwdriver', 'rotary tool', 'dremel', 'cut-off machine',
      'die grinder', 'belt sander', 'orbital sander', 'power mixer', 'core drill'
    ],
  },
  {
    category: 'Hand Tools',
    keywords: [
      'spanner', 'wrench', 'socket', 'ratchet', 'pliers', 'screwdriver', 'hammer',
      'claw hammer', 'ball peen', 'chisel', 'clamp', 'bench vise', 'pipe wrench',
      'adjustable wrench', 'allen key', 'hex key', 'torx', 'wire stripper', 'crimper',
      'tin snips', 'hacksaw', 'file set', 'hand saw', 'utility knife', 'pliers set',
      'spanner set', 'socket set', 'punch tool', 'crowbar', 'mallet', 'pliers'
    ],
  },
  {
    category: 'Welding & Cutting',
    keywords: [
      'welder', 'welding', 'mma', 'mig', 'tig', 'arc welder', 'inverter welder',
      'plasma cutter', 'welding rod', 'electrode', 'welding wire', 'welding torch',
      'gas regulator', 'gas cutter', 'cutting torch', 'soldering iron', 'soldering station',
      'earth clamp', 'electrode holder', 'flame torch', 'welding machine', 'flux'
    ],
  },
  {
    category: 'Measuring & Testing',
    keywords: [
      'caliper', 'vernier', 'digital caliper', 'micrometer', 'tape measure', 'measuring tape',
      'spirit level', 'laser level', 'multimeter', 'clamp meter', 'dial indicator',
      'depth gauge', 'feeler gauge', 'angle finder', 'speed square', 'combination square',
      'voltage tester', 'detector', 'weighing scale', 'hardness tester', 'tachometer'
    ],
  },
  {
    category: 'Workshop Machinery',
    keywords: [
      'lathe', 'milling machine', 'drill press', 'pillar drill', 'bench grinder',
      'bandsaw', 'air compressor', 'compressor', 'hydraulic press', 'generator',
      'bench sander', 'surface grinder', 'pipe threader', 'pipe bending', 'hoist',
      'chain block', 'workshop crane', 'dust collector'
    ],
  },
  {
    category: 'Drilling & Fasteners',
    keywords: [
      'drill bit', 'hss bit', 'cobalt bit', 'sds bit', 'sds plus', 'sds max',
      'hole saw', 'masonry bit', 'wood bit', 'router bit', 'tap and die', 'thread tap',
      'screw', 'bolt', 'nut', 'washer', 'anchor', 'rawplug', 'rivet', 'threaded rod',
      'countersink', 'step drill', 'carbide burr'
    ],
  },
  {
    category: 'Safety & Equipment',
    keywords: [
      'helmet', 'welding helmet', 'safety glasses', 'goggles', 'face shield',
      'gloves', 'safety shoes', 'ear plugs', 'ear muffs', 'respirator', 'dust mask',
      'safety harness', 'reflective vest', 'fire extinguisher', 'first aid', 'knee pads'
    ],
  },
];

/**
 * Intelligent rule-based catalog classification engine.
 * Used when GEMINI_API_KEY is not configured or if the Gemini service experiences spikes/errors.
 */
export function classifyProductHeuristic(
  title: string,
  shortDesc: string = '',
  fullDesc: string = '',
  allowedCategories: string[] = DEFAULT_ALLOWED_CATEGORIES
): { suggestedCategory: string; confidence: number; reason: string } {
  const cleanCategories = allowedCategories.filter((c) => c !== 'All Products');
  const text = `${title} ${shortDesc} ${fullDesc}`.toLowerCase();

  const scores: Record<string, { score: number; matchedKeywords: string[] }> = {};
  cleanCategories.forEach((c) => {
    scores[c] = { score: 0, matchedKeywords: [] };
  });

  for (const rule of CATALOG_RULES) {
    if (!cleanCategories.includes(rule.category)) continue;

    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        const inTitle = title.toLowerCase().includes(kw.toLowerCase());
        const weight = inTitle ? 4 : 2;
        scores[rule.category].score += weight;
        if (!scores[rule.category].matchedKeywords.includes(kw)) {
          scores[rule.category].matchedKeywords.push(kw);
        }
      }
    }
  }

  let bestCategory = cleanCategories[0] || 'Power Tools';
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const [cat, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestCategory = cat;
      bestKeywords = data.matchedKeywords;
    }
  }

  if (bestScore > 0) {
    const confidence = Math.min(0.98, 0.72 + bestScore * 0.05);
    const keywordsStr = bestKeywords.slice(0, 3).join(', ');
    return {
      suggestedCategory: bestCategory,
      confidence: Number(confidence.toFixed(2)),
      reason: `Classified by catalog taxonomy matching: "${keywordsStr}".`,
    };
  }

  return {
    suggestedCategory: cleanCategories[0] || 'Power Tools',
    confidence: 0.65,
    reason: 'Assigned standard catalog category based on default industrial taxonomy.',
  };
}

/**
 * Helper to call Gemini with a timeout promise race so slow spikes don't stall the request.
 */
async function callGeminiWithTimeout(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  systemInstruction: string,
  schema: any,
  timeoutMs: number
) {
  const apiCall = ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout waiting for model ${model}`)), timeoutMs);
  });

  return Promise.race([apiCall, timeoutPromise]);
}

/**
 * Main Gemini AI single-product category suggester with automatic fallback.
 */
export async function suggestCategoryWithGemini(params: {
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  availableCategories?: string[];
}): Promise<{
  suggestedCategory: string;
  confidence: number;
  reason: string;
  provider: 'gemini' | 'catalog_heuristics';
  modelUsed?: string;
}> {
  const allowed = Array.isArray(params.availableCategories) && params.availableCategories.length > 0
    ? params.availableCategories.filter((c) => c !== 'All Products')
    : DEFAULT_ALLOWED_CATEGORIES;

  // Sanitize input to prevent abuse
  const safeTitle = (params.title || '').trim().slice(0, 200);
  const safeShort = (params.shortDescription || '').trim().slice(0, 500);
  const safeFull = (params.fullDescription || '').trim().slice(0, 2500);

  const ai = getGeminiClient();

  // If Gemini API key is missing or placeholder, use built-in taxonomy rules smoothly
  if (!ai) {
    const heuristic = classifyProductHeuristic(safeTitle, safeShort, safeFull, allowed);
    return {
      ...heuristic,
      provider: 'catalog_heuristics',
      reason: `${heuristic.reason} (GEMINI_API_KEY not configured; running on built-in rules).`,
    };
  }

  const prompt = `Analyze this industrial / hardware tool product and determine the single most accurate category for it from the allowed categories list.
    
Product Title: ${safeTitle || 'N/A'}
Short Summary: ${safeShort || 'N/A'}
Detailed Description: ${safeFull || 'N/A'}

Allowed Categories:
${allowed.map((c) => `- ${c}`).join('\n')}

Rules:
1. You are strictly a classification assistant for industrial hardware tools.
2. Select the single best matching category from the allowed categories list.
3. Output strictly valid JSON matching the schema.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      suggestedCategory: {
        type: Type.STRING,
        description: 'The best matching category name from the allowed list.',
      },
      confidence: {
        type: Type.NUMBER,
        description: 'Confidence score between 0 and 1.',
      },
      reason: {
        type: Type.STRING,
        description: 'Short 1-sentence technical reason for this category.',
      },
    },
    required: ['suggestedCategory', 'confidence', 'reason'],
  };

  const systemInstruction = 'You are an expert industrial hardware catalog categorization assistant for Rawal Tools. Classify tools accurately into categories such as Power Tools, Hand Tools, Welding & Cutting, Measuring & Testing, Workshop Machinery, Drilling & Fasteners, and Safety & Equipment.';

  // Attempt models in order: gemini-3.8-flash (4s timeout), then gemini-3.1-flash-lite (6s timeout)
  const models = [
    { name: 'gemini-3.8-flash', timeout: 4000 },
    { name: 'gemini-3.1-flash-lite', timeout: 6000 },
  ];

  for (const m of models) {
    try {
      const response = await callGeminiWithTimeout(ai, m.name, prompt, systemInstruction, schema, m.timeout);
      const parsed = JSON.parse(response.text || '{}');
      if (parsed && parsed.suggestedCategory) {
        return {
          suggestedCategory: parsed.suggestedCategory,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
          reason: parsed.reason || 'Categorized by Gemini AI.',
          provider: 'gemini',
          modelUsed: m.name,
        };
      }
    } catch {
      // Continue to next model fallback
      continue;
    }
  }

  // Graceful rule fallback if external AI endpoints timed out or spiked
  const fallback = classifyProductHeuristic(safeTitle, safeShort, safeFull, allowed);
  return {
    ...fallback,
    provider: 'catalog_heuristics',
    reason: `${fallback.reason} (Gemini service busy, auto-classified via catalog engine).`,
  };
}

/**
 * Main Gemini AI batch categorizer with size limits & multi-model fallback.
 */
export async function categorizeBatchWithGemini(params: {
  products: Array<{
    id: string;
    name?: string;
    category?: string;
    brand?: string;
    shortDescription?: string;
    fullDescription?: string;
  }>;
  availableCategories?: string[];
}): Promise<{
  results: Array<{
    id: string;
    suggestedCategory: string;
    confidence: number;
    reason: string;
  }>;
  provider: 'gemini' | 'catalog_heuristics';
  modelUsed?: string;
}> {
  const allowed = Array.isArray(params.availableCategories) && params.availableCategories.length > 0
    ? params.availableCategories.filter((c) => c !== 'All Products')
    : DEFAULT_ALLOWED_CATEGORIES;

  // Enforce max batch size of 25 products per request to prevent API exhaustion
  const products = (params.products || []).slice(0, 25);
  if (products.length === 0) {
    return { results: [], provider: 'gemini' };
  }

  const ai = getGeminiClient();

  if (!ai) {
    const results = products.map((p) => {
      const heuristic = classifyProductHeuristic(
        p.name || '',
        p.shortDescription || '',
        p.fullDescription || '',
        allowed
      );
      return {
        id: p.id,
        suggestedCategory: heuristic.suggestedCategory,
        confidence: heuristic.confidence,
        reason: `${heuristic.reason} (Built-in catalog engine).`,
      };
    });
    return { results, provider: 'catalog_heuristics' };
  }

  const productItemsText = products.map((p, idx) => {
    return `Item #${idx + 1} [ID: ${p.id}]:
- Title: ${(p.name || 'Untitled').slice(0, 150)}
- Current Category: ${p.category || 'Missing'}
- Brand: ${(p.brand || 'N/A').slice(0, 50)}
- Summary: ${(p.shortDescription || 'N/A').slice(0, 200)}
- Details: ${(p.fullDescription || 'N/A').slice(0, 500)}`;
  }).join('\n\n');

  const prompt = `You are categorizing a batch of industrial/hardware tools for Rawal Tools.
Below is a list of products that need category assignment or verification.

Allowed Categories:
${allowed.map((c) => `- ${c}`).join('\n')}

Products to Analyze:
${productItemsText}

Analyze each item and return an array matching each product's ID strictly following the JSON schema.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ['id', 'suggestedCategory', 'confidence', 'reason'],
        },
      },
    },
    required: ['results'],
  };

  const systemInstruction = 'You are an expert industrial hardware catalog manager for Rawal Tools. Classify products into standard categories accurately.';

  const models = [
    { name: 'gemini-3.8-flash', timeout: 5000 },
    { name: 'gemini-3.1-flash-lite', timeout: 8000 },
  ];

  for (const m of models) {
    try {
      const response = await callGeminiWithTimeout(ai, m.name, prompt, systemInstruction, schema, m.timeout);
      const parsed = JSON.parse(response.text || '{"results":[]}');
      if (Array.isArray(parsed.results) && parsed.results.length > 0) {
        return {
          results: parsed.results,
          provider: 'gemini',
          modelUsed: m.name,
        };
      }
    } catch {
      continue;
    }
  }

  // Fallback to heuristic classification if AI request could not be fulfilled
  const results = products.map((p) => {
    const heuristic = classifyProductHeuristic(
      p.name || '',
      p.shortDescription || '',
      p.fullDescription || '',
      allowed
    );
    return {
      id: p.id,
      suggestedCategory: heuristic.suggestedCategory,
      confidence: heuristic.confidence,
      reason: `${heuristic.reason} (Catalog engine fallback).`,
    };
  });

  return { results, provider: 'catalog_heuristics' };
}
