import { Product, CategorySuggestion, BatchCategorizationResult } from '../types';

export function isProductMissingCategory(product: Product): boolean {
  if (!product.category) return true;
  const trimmed = product.category.trim();
  if (trimmed === '') return true;
  if (trimmed.toLowerCase() === 'uncategorized') return true;
  if (trimmed.toLowerCase() === 'none') return true;
  if (trimmed === 'All Products') return true;
  return false;
}

export async function suggestProductCategory(params: {
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  availableCategories?: string[];
}): Promise<CategorySuggestion> {
  const res = await fetch('/api/gemini/suggest-category', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to suggest category with Gemini AI.');
  }

  return data.data as CategorySuggestion;
}

export async function categorizeProductsBatch(params: {
  products: Product[];
  availableCategories?: string[];
}): Promise<BatchCategorizationResult[]> {
  const res = await fetch('/api/gemini/categorize-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      products: params.products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
      })),
      availableCategories: params.availableCategories,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to categorize products in batch with Gemini AI.');
  }

  return data.data as BatchCategorizationResult[];
}
