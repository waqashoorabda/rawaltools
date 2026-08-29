import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Share2, 
  Check, 
  MessageCircle, 
  ShoppingCart, 
  QrCode, 
  Edit3, 
  Sparkles, 
  ChevronRight, 
  ExternalLink, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Flame, 
  Printer, 
  Info,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { BlogPost, Product, StoreSettings, AdSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { buildProductWhatsAppUrl, buildDirectContactWhatsAppUrl } from '../utils/whatsapp';
import { AdBanner } from './AdBanner';

interface ArticlePageViewProps {
  article: BlogPost;
  allArticles: BlogPost[];
  products: Product[];
  settings: StoreSettings;
  adSettings?: AdSettings;
  theme?: ThemeId;
  isAdmin?: boolean;
  isVisualEditMode?: boolean;
  onBackToHome: () => void;
  onSelectArticle: (article: BlogPost) => void;
  onSelectCategory: (category: string) => void;
  onAddToCart: (product: Product, quantity?: number, customNote?: string, size?: string) => void;
  onOpenQrModal: (product: Product) => void;
  onOpenAdminBlog?: (postId?: string) => void;
  onOpenAdSettings?: (slotId?: string) => void;
}

export const ArticlePageView: React.FC<ArticlePageViewProps> = ({
  article,
  allArticles = [],
  products = [],
  settings,
  adSettings,
  theme = 'industrial_yellow',
  isAdmin = false,
  isVisualEditMode = false,
  onBackToHome,
  onSelectArticle,
  onSelectCategory,
  onAddToCart,
  onOpenQrModal,
  onOpenAdminBlog,
  onOpenAdSettings,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [copiedLink, setCopiedLink] = useState(false);
  const [addedItemAnimation, setAddedItemAnimation] = useState(false);

  // Find linked product (if any)
  const linkedProduct = article.featuredProductId
    ? products.find((p) => p.id === article.featuredProductId)
    : null;

  // Other related articles (same category or others)
  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && a.isPublished)
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Categories list for sidebar
  const allCategories = Array.from(new Set(allArticles.map((a) => a.category).filter(Boolean)));

  return (
    <div className={`w-full min-h-screen py-6 sm:py-10 transition-colors ${
      isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#080B10] text-[#F1F3F7]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={onBackToHome}
              className={`px-3 py-1.5 border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' 
                  : 'bg-[#121622] hover:bg-[#1A2234] text-white border-[#27324A]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store Catalog (واپس اسٹور)</span>
            </button>

            <span className="text-slate-400 hidden sm:inline">/</span>

            <button
              type="button"
              onClick={() => onSelectCategory(article.category)}
              className="text-slate-400 hover:text-amber-400 hidden sm:inline-flex items-center gap-1 cursor-pointer"
            >
              <FolderOpen className="w-3 h-3" />
              <span>{article.category}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenAdminBlog && (
              <button
                type="button"
                onClick={() => onOpenAdminBlog(article.id)}
                className="px-3 py-1.5 bg-amber-400 text-black text-xs font-mono font-bold hover:bg-amber-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Article in CMS</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className={`p-2 border transition-colors cursor-pointer hidden md:flex items-center gap-1 text-xs font-mono ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#121622] border-[#252E42] text-slate-300 hover:bg-[#1A2234]'
              }`}
              title="Print Article"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={`px-3 py-1.5 border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' 
                  : 'bg-[#121622] hover:bg-[#1A2234] text-white border-[#27324A]'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Top AdSense Header Banner Slot */}
        <div className="w-full">
          {adSettings ? (
            <AdBanner
              slot={adSettings.slots?.mid_content || adSettings.slots?.top_leaderboard}
              globalAdsEnabled={adSettings.globalAdsEnabled}
              theme={theme}
              onEditSlot={onOpenAdSettings}
              isVisualEditMode={isVisualEditMode}
            />
          ) : (
            <div className={`p-4 border border-dashed rounded-lg flex flex-col items-center justify-center text-center ${
              isLight ? 'bg-slate-100/70 border-slate-300 text-slate-500' : 'bg-[#0E121B] border-[#263148] text-slate-400'
            }`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google AdSense Display Banner (Responsive 728x90 / Leaderboard)</span>
              </div>
              <p className="text-[11px] font-mono mt-1 text-slate-400">
                Ad slot automatically formatted for maximum RPM on industrial & workshop articles.
              </p>
            </div>
          )}
        </div>

        {/* Article Layout Grid (Main 8 Cols + Sticky Sidebar 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Article Content Column */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* Article Header Card */}
            <header className={`p-6 sm:p-8 rounded-2xl border space-y-5 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#10141F] border-[#222B3D]'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="text-xs font-mono uppercase tracking-wider px-3 py-1 font-bold rounded-none"
                  style={{ backgroundColor: `${themeConfig.previewAccent}25`, color: themeConfig.previewAccent }}
                >
                  {article.category}
                </span>

                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{article.readTimeMinutes} min read</span>
                </span>

                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  • Published: {article.publishedAt}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold font-serif-editorial leading-tight">
                {article.title}
              </h1>

              <p className={`text-sm sm:text-base font-light leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {article.excerpt}
              </p>

              {/* Author and Metadata Bar */}
              <div className="pt-4 border-t border-slate-700/30 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      {article.author}
                    </div>
                    <div className="text-[10px] text-slate-500">Tool Testing & Engineering Desk</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{article.publishedAt}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Cover Image */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/30 shadow-md">
              <img
                src={article.coverImage}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="w-full h-72 sm:h-96 object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 p-3 bg-black/75 backdrop-blur-sm text-slate-300 text-[11px] font-mono flex items-center justify-between">
                <span>Featured Machinery & Workshop Engineering Insight</span>
                <span className="text-amber-400 font-bold">{settings.storeName} Technical Portal</span>
              </div>
            </div>

            {/* In-Article AdSense Native Text Ads Block */}
            <div className={`p-4 sm:p-5 border rounded-xl space-y-3 ${
              isLight ? 'bg-amber-50/50 border-amber-200 text-slate-800' : 'bg-[#121722] border-amber-500/30 text-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SPONSORED RECOMMENDATIONS & TEXT ADS (گوگل ایڈسینس لنکس)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Ad • Ads by Google</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                <a
                  href={`tel:${settings.whatsappNumber}`}
                  className={`p-3 border rounded transition-colors group flex items-start justify-between gap-2 ${
                    isLight ? 'bg-white hover:bg-amber-100/50 border-slate-200' : 'bg-[#0B0F17] hover:bg-[#182030] border-[#222D42]'
                  }`}
                >
                  <div>
                    <h4 className="font-bold group-hover:text-amber-400 transition-colors">
                      Industrial Welding Generators 250A/300A
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Direct Wholesale Supply Across Pakistan</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                </a>

                <a
                  href={`tel:${settings.whatsappNumber}`}
                  className={`p-3 border rounded transition-colors group flex items-start justify-between gap-2 ${
                    isLight ? 'bg-white hover:bg-amber-100/50 border-slate-200' : 'bg-[#0B0F17] hover:bg-[#182030] border-[#222D42]'
                  }`}
                >
                  <div>
                    <h4 className="font-bold group-hover:text-amber-400 transition-colors">
                      Heavy Duty Magnetic Drills & Cutters
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Certified 100% Copper Motor Ratings</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                </a>
              </div>
            </div>

            {/* Main Formatted Article Content */}
            <article className={`p-6 sm:p-10 rounded-2xl border space-y-6 text-sm sm:text-base leading-relaxed ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#10141F] border-[#222B3D] text-slate-200'
            }`}>
              {(article.content || '').split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 
                      key={idx} 
                      className={`text-xl sm:text-2xl font-bold font-serif-editorial pt-6 pb-2 border-b leading-snug ${
                        isLight ? 'text-slate-900 border-slate-200' : 'text-white border-[#273248]'
                      }`}
                    >
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 
                      key={idx} 
                      className={`text-2xl sm:text-3xl font-bold font-serif-editorial pt-8 pb-3 border-b leading-snug ${
                        isLight ? 'text-slate-900 border-slate-200' : 'text-white border-[#273248]'
                      }`}
                    >
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                  return (
                    <ul key={idx} className="list-disc pl-6 space-y-2 font-mono text-xs sm:text-sm text-slate-300">
                      {paragraph.split('\n').map((line, lIdx) => (
                        <li key={lIdx} className="leading-relaxed">
                          {line.replace(/^[*|-]\s+/, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <blockquote 
                      key={idx} 
                      className="p-4 border-l-4 border-amber-400 bg-amber-400/10 italic font-serif text-sm sm:text-base rounded-r-lg"
                    >
                      {paragraph.replace(/^>\s+/, '')}
                    </blockquote>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed font-light">
                    {paragraph}
                  </p>
                );
              })}
            </article>

            {/* Attached Store Product High-Conversion Card (If linked) */}
            {linkedProduct && (
              <div className={`p-6 border-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl ${
                isLight ? 'bg-amber-50/70 border-amber-400 text-slate-900' : 'bg-[#151B27] border-amber-400/80 text-white'
              }`}>
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <img
                      src={(linkedProduct.images && linkedProduct.images[0]) || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80"}
                      alt={linkedProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-amber-400/50 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenQrModal(linkedProduct)}
                      className="absolute -bottom-2 -right-2 p-1.5 bg-black text-amber-400 border border-amber-400 rounded-full hover:scale-110 transition-transform cursor-pointer shadow-lg"
                      title="View Instant QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>RECOMMENDED TOOL IN THIS GUIDE</span>
                    </span>
                    <h3 className="font-bold text-base sm:text-lg leading-snug">{linkedProduct.name}</h3>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-lg sm:text-xl font-mono font-bold text-amber-400">
                        {linkedProduct.hasPrice && linkedProduct.price 
                          ? `${settings?.currencySymbol || 'Rs.'} ${linkedProduct.price.toLocaleString()}` 
                          : 'Price on Quote'}
                      </span>
                      {linkedProduct.brand && (
                        <span className="text-xs font-mono text-slate-400">({linkedProduct.brand})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(linkedProduct, 1);
                      setAddedItemAnimation(true);
                      setTimeout(() => setAddedItemAnimation(false), 2000);
                    }}
                    className="flex-1 sm:flex-none px-4 py-3 bg-amber-400 text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {addedItemAnimation ? <Check className="w-4 h-4 text-black" /> : <ShoppingCart className="w-4 h-4" />}
                    <span>{addedItemAnimation ? 'Added!' : 'Add to Quote Bag'}</span>
                  </button>

                  <a
                    href={buildProductWhatsAppUrl(linkedProduct, settings, 1, '(Inquiry from Article Guide)')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-4 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onOpenQrModal(linkedProduct)}
                    className={`p-3 border text-xs font-mono flex items-center justify-center transition-colors cursor-pointer ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#1F2738] hover:bg-[#2A344A] text-slate-200 border-[#323E56]'
                    }`}
                    title="Scan QR Code"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Mid-Article AdSense Banner Slot */}
            <div className="w-full">
              <div className={`p-4 border border-dashed rounded-xl flex flex-col items-center justify-center text-center ${
                isLight ? 'bg-slate-100/70 border-slate-300 text-slate-600' : 'bg-[#0E121B] border-[#263148] text-slate-400'
              }`}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                  ADSENSE IN-ARTICLE CONTENT BANNER (728x90 / RESPONSIVE RECTANGLE)
                </span>
                <p className="text-xs font-mono text-amber-400 font-bold">
                  Rawal Tools Industrial Partner Sponsorship & Machinery Updates
                </p>
              </div>
            </div>

            {/* Tags and Social Share Bar */}
            <div className={`p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141F] border-[#222B3D]'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tags:</span>
                </span>
                {(article.tags || []).map((t, idx) => (
                  <span 
                    key={idx} 
                    className={`text-xs font-mono px-2.5 py-1 border rounded-md ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#182030] border-[#2A3750] text-slate-300'
                    }`}
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <a
                href={buildDirectContactWhatsAppUrl(settings, `Discussing Article: ${article.title}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Discuss with Technical Specialist</span>
              </a>
            </div>

            {/* Related Articles Carousel / Grid */}
            {relatedArticles.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-serif-editorial">
                    Related Machinery Articles & Buying Guides
                  </h3>
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectArticle(rel)}
                      className={`p-4 border rounded-xl cursor-pointer group transition-all duration-300 hover:shadow-lg flex flex-col justify-between space-y-3 ${
                        isLight ? 'bg-white border-slate-200 hover:border-slate-400' : 'bg-[#10141F] border-[#222B3D] hover:border-[#35435E]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="h-32 rounded-lg overflow-hidden relative">
                          <img
                            src={rel.coverImage}
                            alt={rel.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase font-bold px-2 py-0.5 bg-black/80 text-amber-400">
                            {rel.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-700/30">
                        <span>{rel.readTimeMinutes} min read</span>
                        <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                          Read →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>

          {/* Sidebar Column (Desktop Sticky 4 Cols) */}
          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            
            {/* AdSense Square Ad Unit (300x250 / 336x280) */}
            <div className={`p-4 border rounded-2xl space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#10141F] border-[#222B3D]'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  SPONSORED ADVERTISEMENT
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">300x250 Square Ad</span>
              </div>

              {/* Dummy Square Banner with AdSense Styling */}
              <div className={`p-6 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#0D111A] border-[#273248] text-slate-300'
              }`}>
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm">Industrial Machinery Hub</div>
                <p className="text-xs text-slate-400">
                  Specialized arc welders, bench grinders, high-torque impact wrenches & hardware tools.
                </p>
                <a
                  href={`tel:${settings.whatsappNumber}`}
                  className="px-4 py-2 bg-amber-400 text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors inline-block mt-2"
                >
                  Inquire Factory Pricing
                </a>
              </div>
            </div>

            {/* AdSense Text Ads Widget */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#10141F] border-[#222B3D]'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  ADS BY GOOGLE (ٹیکسٹ اشتہارات)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Ads</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <a
                  href={`tel:${settings.whatsappNumber}`}
                  className={`block p-2.5 rounded border transition-colors group ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#141924] hover:bg-[#1E2536] border-[#253046]'
                  }`}
                >
                  <div className="font-bold text-amber-400 group-hover:underline">
                    Inverter ARC/TIG Welding Machine Spares
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Original IGBT modules, cooling fans & high-grade earth clamps.
                  </div>
                </a>

                <a
                  href={`tel:${settings.whatsappNumber}`}
                  className={`block p-2.5 rounded border transition-colors group ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#141924] hover:bg-[#1E2536] border-[#253046]'
                  }`}
                >
                  <div className="font-bold text-amber-400 group-hover:underline">
                    Industrial Abrasive Cutting Discs
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Reinforced fiberglass 4", 5", 7", 9" discs in bulk pack boxes.
                  </div>
                </a>
              </div>
            </div>

            {/* Quick WhatsApp Quote Desk Box */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-emerald-50 border-emerald-300 text-slate-900' : 'bg-[#0E1618] border-emerald-500/40 text-white'
            }`}>
              <div className="flex items-center gap-2 text-emerald-500 font-mono font-bold text-xs uppercase tracking-wider">
                <MessageCircle className="w-4 h-4 fill-emerald-500" />
                <span>Instant Technical Consultation</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Need guidance selecting machinery for your workshop or steel fabrication project? Contact our tool master directly.
              </p>

              <a
                href={buildDirectContactWhatsAppUrl(settings, `Hello Rawal Tools, I am reading the article "${article.title}" and would like assistance.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Chat on WhatsApp (+{settings.whatsappNumber})</span>
              </a>
            </div>

            {/* Knowledge Base Categories Quick Links */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#10141F] border-[#222B3D]'
            }`}>
              <h3 className="font-bold text-sm font-serif-editorial flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Article Categories</span>
              </h3>

              <div className="space-y-1.5">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onBackToHome();
                      onSelectCategory(cat);
                    }}
                    className={`w-full p-2 text-xs font-mono text-left rounded flex items-center justify-between transition-colors cursor-pointer ${
                      article.category === cat 
                        ? 'bg-amber-400 text-black font-bold' 
                        : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#161D2B] text-slate-300'
                    }`}
                  >
                    <span>{cat}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

          </aside>

        </div>

        {/* Bottom Back Button */}
        <div className="pt-6 border-t border-slate-700/30 flex justify-center">
          <button
            type="button"
            onClick={onBackToHome}
            className={`px-8 py-3.5 font-mono font-bold text-xs uppercase tracking-wider border shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300' 
                : 'bg-[#10141F] hover:bg-[#182030] text-white border-[#27324A]'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Store Catalog & All Products (واپس کیٹلاگ)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
