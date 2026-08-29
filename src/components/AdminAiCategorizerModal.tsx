import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  AlertCircle, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  Tag, 
  CheckSquare, 
  Square,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { Product, BatchCategorizationResult } from '../types';
import { CATEGORIES } from '../data/defaultProducts';
import { categorizeProductsBatch, isProductMissingCategory } from '../services/geminiCategoryService';

interface AdminAiCategorizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onBatchUpdateProducts: (updatedProducts: Product[]) => void;
}

interface CategoryResultItem {
  suggestedCategory: string;
  confidence: number;
  reason: string;
  selected: boolean;
}

export const AdminAiCategorizerModal: React.FC<AdminAiCategorizerModalProps> = ({
  isOpen,
  onClose,
  products,
  onBatchUpdateProducts,
}) => {
  const [filterMode, setFilterMode] = useState<'missing_only' | 'all'>('missing_only');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CategoryResultItem>>({});
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // Available standard categories
  const standardCategories = useMemo(() => {
    return CATEGORIES.filter((c) => c !== 'All Products');
  }, []);

  // Filter products based on current view mode
  const targetProducts = useMemo(() => {
    if (filterMode === 'missing_only') {
      return products.filter((p) => isProductMissingCategory(p));
    }
    return products;
  }, [products, filterMode]);

  const missingCategoryCount = useMemo(() => {
    return products.filter((p) => isProductMissingCategory(p)).length;
  }, [products]);

  // Run batch AI categorization using Gemini
  const handleRunAiAnalysis = async (itemsToAnalyze: Product[]) => {
    if (itemsToAnalyze.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setAppliedCount(null);

    try {
      const response = await categorizeProductsBatch({
        products: itemsToAnalyze,
        availableCategories: standardCategories,
      });

      const newResults: Record<string, { suggestedCategory: string; confidence: number; reason: string; selected: boolean }> = {};
      
      response.forEach((res) => {
        newResults[res.id] = {
          suggestedCategory: res.suggestedCategory,
          confidence: res.confidence,
          reason: res.reason,
          selected: true,
        };
      });

      setResults(newResults);
    } catch (err: any) {
      console.error('Failed to run Gemini AI analysis:', err);
      setError(err.message || 'Failed to analyze products with Gemini.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle selection for a product
  const toggleSelect = (id: string) => {
    setResults((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          selected: !prev[id].selected,
        },
      };
    });
  };

  // Update selected category manually in results
  const updateCategoryChoice = (id: string, newCategory: string) => {
    setResults((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          suggestedCategory: newCategory,
        },
      };
    });
  };

  // Select all or Deselect all
  const handleSelectAll = (select: boolean) => {
    setResults((prev) => {
      const updated: typeof prev = {};
      Object.keys(prev).forEach((key) => {
        updated[key] = {
          ...prev[key],
          selected: select,
        };
      });
      return updated;
    });
  };

  // Apply suggested categories
  const handleApplyChanges = () => {
    const updatedProducts: Product[] = [];
    let count = 0;

    products.forEach((p) => {
      const res = results[p.id];
      if (res && res.selected && res.suggestedCategory) {
        updatedProducts.push({
          ...p,
          category: res.suggestedCategory,
          updatedAt: new Date().toISOString(),
        });
        count++;
      } else {
        updatedProducts.push(p);
      }
    });

    onBatchUpdateProducts(updatedProducts);
    setAppliedCount(count);

    setTimeout(() => {
      // Clear applied count notification
      setAppliedCount(null);
    }, 4000);
  };

  if (!isOpen) return null;

  const selectedCount = (Object.values(results) as CategoryResultItem[]).filter((r) => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans overflow-hidden">
      <div className="relative bg-[#0E121B] border border-[#263248] rounded-xl w-full max-w-5xl h-[88vh] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="shrink-0 bg-[#131926] px-5 py-4 border-b border-[#212B3E] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Gemini AI Product Categorization Engine
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  gemini-3.7-flash
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Analyze product titles, specifications & descriptions to automatically categorize uncategorized tools.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-[#1C2538] hover:bg-[#25324C] border border-[#2D3C59] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="shrink-0 bg-[#0A0D15] px-5 py-3 border-b border-[#1E273A] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter View:</span>
            <div className="flex items-center bg-[#141A29] p-1 rounded-lg border border-[#243048]">
              <button
                type="button"
                onClick={() => setFilterMode('missing_only')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'missing_only'
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Missing Category Only</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  filterMode === 'missing_only' ? 'bg-black/20 text-black' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {missingCategoryCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'all'
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>All Catalog Products</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  filterMode === 'all' ? 'bg-black/20 text-black' : 'bg-slate-700 text-slate-300'
                }`}>
                  {products.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRunAiAnalysis(targetProducts)}
              disabled={isAnalyzing || targetProducts.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Gemini Analyzing {targetProducts.length} Items...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Analyze {targetProducts.length} Products with Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status / Notifications Banner */}
        {error && (
          <div className="bg-rose-950/80 border-b border-rose-500/40 px-5 py-2.5 text-xs text-rose-200 flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {appliedCount !== null && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-5 py-2.5 text-xs text-emerald-200 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Successfully updated categories for {appliedCount} products in the catalog!</span>
          </div>
        )}

        {/* Main Products List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {targetProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#111622] rounded-xl border border-[#212B3E] space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-sans">
                {filterMode === 'missing_only' 
                  ? 'All products are properly categorized!' 
                  : 'No products found in catalog'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md font-mono">
                {filterMode === 'missing_only'
                  ? 'Great job! None of your products are missing a category. You can switch to "All Catalog Products" above to re-evaluate existing categories using Gemini.'
                  : 'Add products to your catalog to use the Gemini AI auto-categorization feature.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              
              {/* Batch Actions Bar when results are available */}
              {Object.keys(results).length > 0 && (
                <div className="bg-[#151D2C] border border-[#25324B] p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(selectedCount < Object.keys(results).length)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer font-bold"
                    >
                      {selectedCount === Object.keys(results).length ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Select All ({selectedCount}/{Object.keys(results).length})</span>
                    </button>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      Gemini classified <strong className="text-amber-400">{Object.keys(results).length}</strong> items
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyChanges}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-1.5 rounded-md transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-black" />
                    <span>Apply {selectedCount} Suggested Categories</span>
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="grid grid-cols-1 gap-3">
                {targetProducts.map((product) => {
                  const isMissing = isProductMissingCategory(product);
                  const result = results[product.id];
                  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=120&q=80';

                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-xl border transition-all ${
                        result?.selected
                          ? 'bg-[#151B28] border-amber-400/40 ring-1 ring-amber-400/20'
                          : isMissing
                          ? 'bg-[#18151D] border-rose-500/30'
                          : 'bg-[#111622] border-[#222C3E]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        {/* Left: Product Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {result && (
                            <button
                              type="button"
                              onClick={() => toggleSelect(product.id)}
                              className="mt-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                            >
                              {result.selected ? (
                                <CheckSquare className="w-5 h-5 text-amber-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-500" />
                              )}
                            </button>
                          )}

                          <img
                            src={img}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-lg bg-black border border-slate-700 shrink-0"
                          />

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white font-sans truncate">
                                {product.name}
                              </span>
                              {product.brand && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {product.brand}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-500">
                                {product.sku || product.id}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 font-sans">
                              {product.shortDescription || product.fullDescription || 'No description provided.'}
                            </p>

                            {/* Current Category Status */}
                            <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                              <span className="text-slate-500">Current Category:</span>
                              {isMissing ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  ⚠️ Missing / Unassigned
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                                  {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: AI Suggestion & Assignment */}
                        <div className="sm:w-80 shrink-0 bg-[#0E131F] p-3 rounded-lg border border-[#232F46] space-y-2 font-mono">
                          {result ? (
                            <>
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Gemini Suggestion:</span>
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                                  {Math.round(result.confidence * 100)}% Match
                                </span>
                              </div>

                              <select
                                value={result.suggestedCategory}
                                onChange={(e) => updateCategoryChoice(product.id, e.target.value)}
                                className="w-full bg-[#161F2E] text-xs text-white px-2.5 py-1.5 rounded border border-amber-400/40 focus:border-amber-400 outline-none cursor-pointer font-sans font-semibold"
                              >
                                {standardCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>

                              {result.reason && (
                                <div className="text-[10px] text-slate-400 leading-snug bg-[#121824] p-1.5 rounded border border-slate-800">
                                  💡 <span className="italic">{result.reason}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-2 text-center text-slate-500 text-xs">
                              <span className="text-[11px]">Click "Analyze" to classify</span>
                              <button
                                type="button"
                                onClick={() => handleRunAiAnalysis([product])}
                                disabled={isAnalyzing}
                                className="mt-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Analyze Single Item</span>
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-[#111723] px-5 py-3 border-t border-[#202A3C] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-400 text-[11px]">
            ⚡ Powered by Gemini 3.7 Flash server-side categorization.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white bg-[#192233] border border-[#293750] transition-colors cursor-pointer"
            >
              Close
            </button>

            {Object.keys(results).length > 0 && (
              <button
                type="button"
                onClick={handleApplyChanges}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-5 py-2 rounded-lg transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Check className="w-4 h-4 text-black" />
                <span>Apply {selectedCount} Categories</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
