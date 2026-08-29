import React from 'react';
import { motion } from 'motion/react';
import { 
  Wrench, 
  Flame, 
  Layers, 
  Ruler, 
  Cpu, 
  Hammer, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  Zap,
  Edit3
} from 'lucide-react';
import { Product, StoreSettings, PageContent } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { trackCategoryClick } from '../utils/analytics';

interface CategoryShowcaseProps {
  settings: StoreSettings;
  products: Product[];
  theme?: ThemeId;
  pageContent?: PageContent;
  isEditMode?: boolean;
  onUpdateContent?: (field: keyof PageContent, value: string) => void;
  onSelectCategory: (category: string) => void;
  onSelectSizeFilter?: (sizeQuery: string) => void;
  activeCategory?: string;
}

interface CategoryCardMeta {
  title: string;
  urduName: string;
  icon: React.ReactNode;
  image: string;
  popularSizes: string[];
  description: string;
}

const CATEGORY_META: Record<string, CategoryCardMeta> = {
  'Power Tools': {
    title: 'Power Tools',
    urduName: 'پاور ٹولز',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['4" (100mm)', '5" (125mm)', '26mm SDS', '1/2" Cordless'],
    description: 'Rotary hammers, angle grinders, impact wrenches & drills',
  },
  'Welding & Cutting': {
    title: 'Welding & Cutting',
    urduName: 'ویلڈنگ اور کٹنگ',
    icon: <Flame className="w-5 h-5 text-rose-500" />,
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['200 Amp', '250 Amp', '300 Amp IGBT', '4" Discs'],
    description: 'IGBT digital inverter welders, cutting discs & brass torches',
  },
  'Hand Tools': {
    title: 'Hand Tools',
    urduName: 'ہینڈ ٹولز',
    icon: <Wrench className="w-5 h-5 text-sky-500" />,
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['1/4" Drive', '3/8" Drive', '1/2" Drive', '121-Pc Sets'],
    description: 'Chrome vanadium ratchets, socket sets & mechanics kits',
  },
  'Workshop Machinery': {
    title: 'Workshop Machinery',
    urduName: 'ورکشاپ مشینری',
    icon: <Layers className="w-5 h-5 text-indigo-500" />,
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['5" (125mm)', '6" (150mm)', '8" (200mm)'],
    description: 'Heavy ductile cast iron bench vises, presses & clamps',
  },
  'Measuring & Testing': {
    title: 'Measuring & Testing',
    urduName: 'پیمائشی آلات',
    icon: <Ruler className="w-5 h-5 text-emerald-500" />,
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['150mm (6")', '200mm (8")', '40m Laser', '80m Laser'],
    description: 'Digital stainless calipers, laser rangefinders & angle sensors',
  },
  'Drilling & Fasteners': {
    title: 'Drilling & Fasteners',
    urduName: 'ڈرلنگ بٹس',
    icon: <Hammer className="w-5 h-5 text-amber-600" />,
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['13-Pc Set', '19-Pc Set', '25-Pc Master', 'M35 Cobalt'],
    description: 'M35 5% cobalt drill bit sets, masonry SDS chisels & fasteners',
  },
  'Safety & Equipment': {
    title: 'Safety & Equipment',
    urduName: 'حفاظتی سامان',
    icon: <ShieldCheck className="w-5 h-5 text-teal-500" />,
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    popularSizes: ['Standard View', 'True Color', 'Medium (M)', 'Large (L)'],
    description: 'Auto-darkening true-color welding helmets & anti-vibe gloves',
  },
};

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  settings,
  products,
  theme = 'industrial_yellow',
  pageContent,
  isEditMode = false,
  onUpdateContent,
  onSelectCategory,
  onSelectSizeFilter,
  activeCategory = 'All Products',
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const categories = Object.keys(CATEGORY_META);

  const handleCategoryClick = (catTitle: string) => {
    trackCategoryClick(catTitle);
    onSelectCategory(catTitle);
  };

  const handleSizeClick = (catTitle: string, size: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trackCategoryClick(`${catTitle} - ${size}`);
    onSelectCategory(catTitle);
    if (onSelectSizeFilter) {
      onSelectSizeFilter(size);
    }
  };

  return (
    <section 
      id="category-showcase-section"
      className={`py-8 sm:py-12 border-b transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1015] border-[#222733]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 border"
                style={{
                  backgroundColor: themeConfig.previewAccent,
                  color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                  borderColor: themeConfig.previewAccent,
                }}
              >
                CATEGORIES & SIZES
              </span>
              <span className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                • زمرہ جات اور سائز
              </span>
            </div>

            {/* Editable or Standard Headline */}
            {isEditMode && onUpdateContent ? (
              <div className="space-y-1.5 mt-1">
                <input
                  type="text"
                  value={pageContent?.categoryHeading || 'Browse by Tool Category & Sizes'}
                  onChange={(e) => onUpdateContent('categoryHeading', e.target.value)}
                  className="text-2xl sm:text-3xl font-bold font-sans w-full p-1.5 border border-amber-400 bg-amber-50/20 text-slate-900 rounded"
                  title="Edit Category Heading"
                />
                <input
                  type="text"
                  value={pageContent?.categorySubheading || 'Explore high-performance power tools, welding plants, precision measuring devices & workshop machinery with selectable sizes.'}
                  onChange={(e) => onUpdateContent('categorySubheading', e.target.value)}
                  className="text-xs font-sans w-full p-1.5 border border-amber-400 bg-amber-50/20 text-slate-600 rounded"
                  title="Edit Category Subheading"
                />
              </div>
            ) : (
              <div>
                <h2 className={`text-2xl sm:text-3xl font-sans font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {pageContent?.categoryHeading || 'Browse by Tool Category & Sizes'}
                </h2>
                <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {pageContent?.categorySubheading || 'Explore high-performance power tools, welding plants, precision measuring devices & workshop machinery with selectable sizes.'}
                </p>
              </div>
            )}
          </div>

          {/* View All Tools Button */}
          <button
            onClick={() => onSelectCategory('All Products')}
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
              activeCategory === 'All Products'
                ? 'shadow-sm'
                : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-[#15181F] hover:bg-[#1E232E] text-slate-300 border-[#2B313F]'
            }`}
            style={activeCategory === 'All Products' ? {
              backgroundColor: themeConfig.previewAccent,
              color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              borderColor: themeConfig.previewAccent,
            } : undefined}
          >
            <span>View All ({products.length} Products)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((catKey, index) => {
            const meta = CATEGORY_META[catKey];
            const count = products.filter((p) => p.category === catKey).length;
            const isSelected = activeCategory === catKey;

            return (
              <motion.div
                key={catKey}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ 
                  duration: 0.42, 
                  delay: Math.min(index * 0.05, 0.3), 
                  ease: [0.22, 1, 0.36, 1] 
                }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onClick={() => handleCategoryClick(catKey)}
                className={`group relative rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-colors duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'ring-2 shadow-md'
                    : isLight
                      ? 'bg-white border-slate-200 hover:border-amber-500 hover:shadow-md'
                      : 'bg-[#141720] border-[#252A36] hover:border-amber-500/70 hover:shadow-black/50 hover:shadow-lg'
                }`}
                style={isSelected ? {
                  borderColor: themeConfig.previewAccent,
                  boxShadow: `0 0 0 2px ${themeConfig.previewAccent}40`,
                } : undefined}
              >
                {/* Background Subtle Gradient Overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity duration-300"
                  style={{ backgroundColor: themeConfig.previewAccent }}
                />

                <div>
                  {/* Category Top Row: Icon + Count Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-lg border flex items-center justify-center ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1B202C] border-[#2C3342]'
                    }`}>
                      {meta.icon}
                    </div>

                    <span 
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isSelected
                          ? 'bg-amber-400 text-black'
                          : isLight 
                            ? 'bg-slate-100 text-slate-700' 
                            : 'bg-[#1E2330] text-slate-300'
                      }`}
                    >
                      {count} items
                    </span>
                  </div>

                  {/* Category Title & Urdu Translation */}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={`text-base sm:text-lg font-bold font-sans transition-colors ${
                      isSelected 
                        ? 'text-amber-500'
                        : isLight 
                          ? 'text-slate-900 group-hover:text-amber-600' 
                          : 'text-white group-hover:text-amber-400'
                    }`}>
                      {meta.title}
                    </h3>
                    <span className="text-[11px] font-sans text-slate-400">
                      {meta.urduName}
                    </span>
                  </div>

                  {/* Description */}
                  <p className={`text-xs mt-1 font-sans line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {meta.description}
                  </p>
                </div>

                {/* Popular Size / Spec Quick Filter Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Select By Size / Spec:</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {meta.popularSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={(e) => handleSizeClick(meta.title, size, e)}
                        className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300 text-slate-700 border-slate-200'
                            : 'bg-[#1A1F2B] hover:bg-amber-950/50 hover:text-amber-300 hover:border-amber-500/50 text-slate-300 border-[#2D3445]'
                        }`}
                        title={`Filter ${meta.title} by ${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
