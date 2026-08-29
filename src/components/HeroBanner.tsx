import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, 
  Plus, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Palette,
  Edit3,
  Check,
  Zap,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { StoreSettings, PageContent } from '../types';
import { buildDirectContactWhatsAppUrl } from '../utils/whatsapp';
import { ThemeId, THEMES } from '../utils/theme';
import { trackWhatsAppClick } from '../utils/analytics';

interface HeroBannerProps {
  settings: StoreSettings;
  pageContent: PageContent;
  isEditMode?: boolean;
  onUpdateContent?: (field: keyof PageContent, value: string) => void;
  onSelectCategory: (cat: string) => void;
  onOpenAdminAdd: () => void;
  onOpenThemeModal?: () => void;
  isAdmin: boolean;
  theme?: ThemeId;
  totalProductsCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  pageContent,
  isEditMode = false,
  onUpdateContent,
  onSelectCategory,
  onOpenAdminAdd,
  onOpenThemeModal,
  isAdmin,
  theme = 'industrial_yellow',
  totalProductsCount,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [editingField, setEditingField] = useState<keyof PageContent | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleStartEdit = (field: keyof PageContent, val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(field);
    setTempValue(val);
  };

  const handleSave = (field: keyof PageContent, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateContent && tempValue.trim()) {
      onUpdateContent(field, tempValue);
    }
    setEditingField(null);
  };

  return (
    <div 
      className={`border-b transition-colors ${
        isLight
          ? 'bg-gradient-to-b from-slate-100 via-slate-50 to-white border-slate-200 text-slate-900'
          : 'bg-gradient-to-b from-[#141822] via-[#0E1015] to-[#0A0C10] border-[#222733] text-[#F1F3F7]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left / Main Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8 flex flex-col justify-between space-y-6"
          >
            <div>
              {/* Badge */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {editingField === 'heroBadge' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="bg-black/90 text-white text-xs px-2 py-1 border border-amber-400 rounded font-mono"
                      autoFocus
                    />
                    <button onClick={() => handleSave('heroBadge')} className="p-1 bg-emerald-600 text-white rounded">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/badge">
                    <span 
                      className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold border px-2.5 py-1 rounded"
                      style={{
                        color: themeConfig.previewAccent,
                        borderColor: `${themeConfig.previewAccent}55`,
                        backgroundColor: `${themeConfig.previewAccent}15`,
                      }}
                    >
                      {pageContent.heroBadge || 'INDUSTRIAL TOOLS SHOWROOM 2026'}
                    </span>
                    {isEditMode && (
                      <button
                        onClick={(e) => handleStartEdit('heroBadge', pageContent.heroBadge, e)}
                        className="p-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black rounded text-[10px]"
                        title="Edit Badge Text"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                <span className={`text-[10px] uppercase tracking-widest font-mono hidden sm:inline ${
                  isLight ? 'text-slate-500' : 'text-[#778]'
                }`}>
                  RAWALPINDI • ISLAMABAD • NATIONWIDE
                </span>
              </div>

              {/* Headlines */}
              <div className="mb-4 space-y-1">
                {editingField === 'heroHeadline1' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="bg-black text-white text-3xl font-bold px-2 py-1 border border-amber-400 w-full"
                      autoFocus
                    />
                    <button onClick={() => handleSave('heroHeadline1')} className="p-2 bg-emerald-600 text-white rounded">
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/h1">
                    <h1 
                      className="text-4xl sm:text-5xl md:text-6xl font-black font-sans leading-none tracking-tight"
                      style={{ color: themeConfig.previewAccent }}
                    >
                      {pageContent.heroHeadline1 || 'ENGINEERING GRADE'}
                    </h1>
                    {isEditMode && (
                      <button
                        onClick={(e) => handleStartEdit('heroHeadline1', pageContent.heroHeadline1, e)}
                        className="opacity-0 group-hover/h1:opacity-100 p-1.5 bg-amber-500/20 text-amber-300 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {editingField === 'heroHeadline2' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="bg-black text-white text-2xl font-bold px-2 py-1 border border-amber-400 w-full"
                      autoFocus
                    />
                    <button onClick={() => handleSave('heroHeadline2')} className="p-2 bg-emerald-600 text-white rounded">
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/h2">
                    <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans tracking-tight uppercase ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {pageContent.heroHeadline2 || 'INDUSTRIAL POWER TOOLS'}
                    </h2>
                    {isEditMode && (
                      <button
                        onClick={(e) => handleStartEdit('heroHeadline2', pageContent.heroHeadline2, e)}
                        className="opacity-0 group-hover/h2:opacity-100 p-1.5 bg-amber-500/20 text-amber-300 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Subheadline */}
              {editingField === 'heroSubheadline' ? (
                <div className="flex items-center gap-1 mt-2">
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="bg-black text-white text-sm p-2 border border-amber-400 rounded w-full rows-2"
                    autoFocus
                  />
                  <button onClick={() => handleSave('heroSubheadline')} className="p-2 bg-emerald-600 text-white rounded">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2 group/sub mt-4">
                  <p className={`text-sm sm:text-base font-normal leading-relaxed max-w-2xl ${
                    isLight ? 'text-slate-600' : 'text-[#8E98A8]'
                  }`}>
                    {pageContent.heroSubheadline || settings.tagline || 'Pakistan’s premier showroom for high-torque rotary hammers, angle grinders, inverter welding plants & heavy-duty workshop machinery.'}
                  </p>
                  {isEditMode && (
                    <button
                      onClick={(e) => handleStartEdit('heroSubheadline', pageContent.heroSubheadline, e)}
                      className="opacity-0 group-hover/sub:opacity-100 p-1 bg-amber-500/20 text-amber-300 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions & Spec Badges */}
            <div className="space-y-6 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={buildDirectContactWhatsAppUrl(settings, 'Wholesale Catalog Inquiry from Hero')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('Hero Banner Order Button')}
                  className="inline-flex items-center gap-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition-all shadow-md active:scale-95 font-sans cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Order via WhatsApp</span>
                </a>

                {isAdmin ? (
                  <>
                    <button
                      onClick={onOpenAdminAdd}
                      className={`inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-wider px-5 py-3.5 rounded-lg transition-colors cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm' 
                          : 'bg-[#181C26] hover:bg-[#222836] text-white border-[#333C4E]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Upload Product</span>
                    </button>
                    {onOpenThemeModal && (
                      <button
                        onClick={onOpenThemeModal}
                        className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/40 text-xs font-bold uppercase tracking-wider px-4 py-3.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Theme Studio</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className={`inline-flex items-center gap-2 text-xs font-sans font-bold border px-4 py-3 rounded-lg ${
                    isLight ? 'bg-white text-slate-700 border-slate-300 shadow-sm' : 'bg-[#15181F] text-[#8E98A8] border-[#262B35]'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
                    <span>{totalProductsCount} SPECS READY</span>
                  </div>
                )}
              </div>

              {/* Editorial Spec Points */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t text-[11px] font-sans font-bold uppercase tracking-wider ${
                isLight ? 'border-slate-200 text-slate-600' : 'border-[#222733] text-[#8E98A8]'
              }`}>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pakistan Dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>100% Genuine Spec</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                  <span>Instant WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Wholesale Rates</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Highlight Visual Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 flex flex-col justify-between"
          >
            <div className={`h-full border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg ${
              isLight 
                ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800' 
                : 'bg-gradient-to-br from-[#121620] to-[#0A0D14] text-white border-[#2A3142]'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded">
                    SHOWROOM HOTSPOT
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-sans text-white">
                    Heavy Duty Copper Rotary Hammers
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Available in SDS-Plus & SDS-Max industrial specifications with anti-vibration shock absorbers.
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-700 bg-black h-40 group/heroimg">
                  <img
                    src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80"
                    alt="Rotary Hammer Drill"
                    className="w-full h-full object-cover transform scale-105 group-hover/heroimg:scale-90 transition-transform duration-500 ease-out"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-sans">
                <button
                  onClick={() => onSelectCategory('Power Tools')}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Power Range</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-slate-400 text-[11px]">In Stock</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
