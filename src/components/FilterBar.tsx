import React from 'react';
import { RotateCcw, PhoneCall } from 'lucide-react';
import { ProductFilters } from '../types';
import { ThemeId, THEMES } from '../utils/theme';

interface FilterBarProps {
  filters: ProductFilters;
  onFilterChange: (newFilters: Partial<ProductFilters>) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  totalProductsCount: number;
  availableCategories: string[];
  availableBrands: string[];
  theme?: ThemeId;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
  totalProductsCount,
  availableCategories,
  availableBrands,
  theme = 'industrial_yellow',
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const isFiltered =
    filters.category !== 'All Products' ||
    filters.priceFilter !== 'all' ||
    filters.stockFilter !== 'all' ||
    filters.brandFilter !== 'All Brands' ||
    filters.searchQuery !== '';

  return (
    <div 
      className={`border-b sticky top-[68px] z-20 font-sans transition-colors ${
        isLight
          ? 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800'
          : 'bg-[#0E1015]/95 backdrop-blur-md border-[#222733] text-[#F1F3F7]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
        
        {/* Top Row: Category Tabs */}
        <div className={`flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none no-scrollbar border-b ${
          isLight ? 'border-slate-200' : 'border-[#1C212E]'
        }`}>
          {availableCategories.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange({ category: cat })}
                className={`whitespace-nowrap pb-2 text-xs uppercase tracking-widest transition-all shrink-0 font-mono cursor-pointer ${
                  isSelected
                    ? 'font-bold border-b-2'
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900'
                      : 'text-[#889] hover:text-white'
                }`}
                style={{
                  color: isSelected ? (isLight ? '#0F172A' : '#FFFFFF') : undefined,
                  borderColor: isSelected ? themeConfig.previewAccent : 'transparent',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Bottom Row: Secondary Filters (Price Mode, Stock, Brand, Sort) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs font-mono">
          
          {/* Left: Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Price Filter Toggle Pills */}
            <div className={`inline-flex rounded-none p-0.5 border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#15181F] border-[#262B35]'
            }`}>
              <button
                onClick={() => onFilterChange({ priceFilter: 'all' })}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  filters.priceFilter === 'all'
                    ? 'font-bold shadow-sm'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-[#889] hover:text-white'
                }`}
                style={{
                  backgroundColor: filters.priceFilter === 'all' ? themeConfig.previewAccent : 'transparent',
                  color: filters.priceFilter === 'all' 
                    ? (themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF')
                    : undefined,
                }}
              >
                All Specs
              </button>
              <button
                onClick={() => onFilterChange({ priceFilter: 'priced' })}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  filters.priceFilter === 'priced'
                    ? 'font-bold shadow-sm'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-[#889] hover:text-white'
                }`}
                style={{
                  backgroundColor: filters.priceFilter === 'priced' ? themeConfig.previewAccent : 'transparent',
                  color: filters.priceFilter === 'priced' 
                    ? (themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF')
                    : undefined,
                }}
                title="Only items with explicit prices"
              >
                With Price
              </button>
              <button
                onClick={() => onFilterChange({ priceFilter: 'on_request' })}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 ${
                  filters.priceFilter === 'on_request'
                    ? 'font-bold shadow-sm'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-[#889] hover:text-white'
                }`}
                style={{
                  backgroundColor: filters.priceFilter === 'on_request' ? themeConfig.previewAccent : 'transparent',
                  color: filters.priceFilter === 'on_request' 
                    ? (themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF')
                    : undefined,
                }}
                title="Only items where price is on request / contact"
              >
                <PhoneCall className="w-2.5 h-2.5" />
                <span>Price on Request</span>
              </button>
            </div>

            {/* In Stock Toggle */}
            <button
              onClick={() =>
                onFilterChange({
                  stockFilter: filters.stockFilter === 'in_stock' ? 'all' : 'in_stock',
                })
              }
              className={`px-3 py-1 text-[10px] uppercase tracking-wider border transition-colors ${
                filters.stockFilter === 'in_stock'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50 font-bold'
                  : isLight
                    ? 'bg-slate-50 text-slate-600 border-slate-300 hover:text-slate-900'
                    : 'bg-[#15181F] text-[#889] border-[#262B35] hover:text-white'
              }`}
            >
              ● In Stock Only
            </button>

            {/* Brand Filter */}
            {availableBrands.length > 2 && (
              <select
                value={filters.brandFilter}
                onChange={(e) => onFilterChange({ brandFilter: e.target.value })}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-wider border outline-none font-mono ${
                  isLight
                    ? 'bg-white text-slate-800 border-slate-300'
                    : 'bg-[#15181F] text-[#889] border-[#262B35] focus:text-white'
                }`}
              >
                {availableBrands.map((b) => (
                  <option key={b} value={b} className={isLight ? 'bg-white text-slate-900' : 'bg-[#15181F] text-white'}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {/* Reset Filters */}
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-400 hover:underline px-2 py-1"
                title="Reset all active search and category filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Sort Options & Showing Count */}
          <div className="flex items-center gap-3">
            <span className={`text-[10px] hidden sm:inline ${isLight ? 'text-slate-400' : 'text-[#667]'}`}>
              {totalFilteredCount} of {totalProductsCount} Specs
            </span>

            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] uppercase ${isLight ? 'text-slate-400' : 'text-[#667]'}`}>Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  onFilterChange({
                    sortBy: e.target.value as ProductFilters['sortBy'],
                  })
                }
                className={`px-2 py-1 text-[10px] uppercase tracking-wider border outline-none font-mono ${
                  isLight
                    ? 'bg-white text-slate-800 border-slate-300'
                    : 'bg-[#15181F] text-[#889] border-[#262B35] focus:text-white'
                }`}
              >
                <option value="featured" className={isLight ? 'bg-white text-slate-900' : 'bg-[#15181F] text-white'}>Featured First</option>
                <option value="newest" className={isLight ? 'bg-white text-slate-900' : 'bg-[#15181F] text-white'}>Newest Additions</option>
                <option value="price_low" className={isLight ? 'bg-white text-slate-900' : 'bg-[#15181F] text-white'}>Price: Low to High</option>
                <option value="price_high" className={isLight ? 'bg-white text-slate-900' : 'bg-[#15181F] text-white'}>Price: High to Low</option>
                <option value="name_asc" className={isLight ? 'bg-white text-slate-900' : 'bg-[#15181F] text-white'}>Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
