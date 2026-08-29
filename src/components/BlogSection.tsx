import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Clock, 
  User, 
  Tag, 
  ArrowRight, 
  Search, 
  Share2, 
  MessageCircle, 
  ShoppingCart, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  Edit3, 
  Plus,
  Eye
} from 'lucide-react';
import { BlogPost, Product, StoreSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { buildDirectContactWhatsAppUrl, buildProductWhatsAppUrl } from '../utils/whatsapp';

interface BlogSectionProps {
  posts?: BlogPost[];
  products?: Product[];
  settings?: StoreSettings;
  theme?: ThemeId;
  isAdmin?: boolean;
  isVisualEditMode?: boolean;
  onSelectArticle?: (article: BlogPost) => void;
  onOpenAdminBlog?: (editingPostId?: string) => void;
  onAddToCart?: (product: Product, quantity: number, customNote?: string, size?: string) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  posts = [],
  products = [],
  settings,
  theme = 'industrial_yellow',
  isAdmin = false,
  isVisualEditMode = false,
  onSelectArticle,
  onOpenAdminBlog,
  onAddToCart,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;
  const safePosts = Array.isArray(posts) ? posts : [];

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(safePosts.map((p) => p.category)))];

  // Filter posts
  const filteredPosts = safePosts.filter((post) => {
    if (!isAdmin && !post.isPublished) return false;
    const matchesCat = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = 
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleArticleClick = (post: BlogPost) => {
    if (onSelectArticle) {
      onSelectArticle(post);
    }
  };

  return (
    <section className={`w-full py-12 sm:py-16 border-t ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D14] border-[#1A2232]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 font-bold"
                style={{ backgroundColor: `${themeConfig.previewAccent}25`, color: themeConfig.previewAccent }}
              >
                KNOWLEDGE BASE & GUIDES (مفید معلومات و آرٹیکلز)
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onOpenAdminBlog && onOpenAdminBlog()}
                  className="px-2.5 py-0.5 bg-amber-400 text-black text-[11px] font-mono font-bold hover:bg-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Write Article</span>
                </button>
              )}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif-editorial">
              Industrial Tools & Workshop Engineering Articles
            </h2>
            <p className={`text-xs sm:text-sm font-light max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Expert insights, machinery maintenance protocols, material selection guides, and welder buying tips written by seasoned tool masters.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles & guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs font-mono border rounded-none focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#121622] border-[#252F42] text-white'
              }`}
            />
          </div>
        </motion.div>

        {/* Category Filter Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-mono whitespace-nowrap border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-black font-bold border-amber-300 shadow-sm'
                  : isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-[#121622] hover:bg-[#1C2232] text-slate-300 border-[#222C3E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, idx) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ 
                duration: 0.45, 
                delay: Math.min((idx % 3) * 0.08, 0.24), 
                ease: [0.22, 1, 0.36, 1] 
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => handleArticleClick(post)}
              className={`group rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col ${
                isLight ? 'bg-white border-slate-200 hover:border-slate-400' : 'bg-[#10141F] border-[#222B3D] hover:border-[#35435E]'
              }`}
            >
              {/* Cover Image with Zoom-Out Hover Effect */}
              <div className="relative h-48 overflow-hidden bg-black/40">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-95 group-hover:opacity-90"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-black/80 text-amber-400 border border-amber-400/40 backdrop-blur-sm">
                    {post.category}
                  </span>
                  {!post.isPublished && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-600 text-white">
                      DRAFT
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 text-[11px] font-mono px-2 py-0.5 bg-black/70 text-white backdrop-blur-sm flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{post.readTimeMinutes} min read</span>
                </div>
              </div>

              {/* Article Content Preview */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <User className="w-3 h-3" />
                    <span className="truncate">{post.author}</span>
                    <span>•</span>
                    <span>{post.publishedAt}</span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className={`text-xs font-light line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {post.excerpt}
                  </p>
                </div>

                {/* Tags & Read More Action */}
                <div className="pt-3 border-t border-slate-700/30 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((t, tagIdx) => (
                      <span key={tagIdx} className={`text-[10px] font-mono px-1.5 py-0.2 border ${isLight ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-[#181F2E] border-[#253046] text-slate-400'}`}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenAdminBlog) onOpenAdminBlog(post.id);
                        }}
                        className="p-1.5 bg-black/40 hover:bg-amber-400 hover:text-black text-slate-300 border border-slate-600 transition-colors"
                        title="Edit Article in CMS"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
};
