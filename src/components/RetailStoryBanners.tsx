import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight,
  MessageCircle,
  Tag,
  Edit3,
  Check,
  Zap,
  Truck,
  Flame,
  Award
} from 'lucide-react';
import { ThemeId, THEMES } from '../utils/theme';
import { StoreSettings, PageContent } from '../types';
import { buildDirectContactWhatsAppUrl } from '../utils/whatsapp';
import { trackWhatsAppClick } from '../utils/analytics';

interface RetailStoryBannersProps {
  onSelectCategory: (category: string) => void;
  onSearchFilter?: (query: string) => void;
  theme?: ThemeId;
  settings: StoreSettings;
  pageContent: PageContent;
  isEditMode?: boolean;
  onUpdateContent?: (field: keyof PageContent, value: string) => void;
}

export const RetailStoryBanners: React.FC<RetailStoryBannersProps> = ({
  onSelectCategory,
  onSearchFilter,
  theme = 'industrial_yellow',
  settings,
  pageContent,
  isEditMode = false,
  onUpdateContent,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [editingField, setEditingField] = useState<keyof PageContent | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleStartEdit = (field: keyof PageContent, currentValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSaveEdit = (field: keyof PageContent, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateContent && tempValue.trim()) {
      onUpdateContent(field, tempValue);
    }
    setEditingField(null);
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto px-4 sm:px-8 pt-4">
      
      {/* 1. 3-Grid Promotional Banner Strip (Power Tools, Big Clearance, Inverter Welders) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Banner 1: Power Tools */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => {
            if (!editingField) onSelectCategory('Power Tools');
          }}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white p-6 flex flex-col justify-between min-h-[190px] border border-slate-700/50 shadow-md cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 group-hover:opacity-50 transition-opacity overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80" 
              alt="Power Tools" 
              className="w-full h-full object-cover transform scale-105 group-hover:scale-90 transition-transform duration-500 ease-out"
            />
          </div>

          <div className="relative z-10 space-y-1.5 max-w-[70%]">
            {/* Tag Badge */}
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-amber-400 text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-sans tracking-wide">
                {pageContent.banner1Tag || 'Power Collection'}
              </span>
              {isEditMode && (
                <button
                  onClick={(e) => handleStartEdit('banner1Tag', pageContent.banner1Tag, e)}
                  className="p-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black rounded text-[10px] transition-colors"
                  title="Edit Tag"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Banner Title */}
            {editingField === 'banner1Title' ? (
              <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="bg-black/90 text-white text-base px-2 py-1 border border-amber-400 rounded outline-none font-bold w-full"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit('banner1Title')}
                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h3 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white leading-tight mt-1">
                  {pageContent.banner1Title || 'Rotary & Hammer Drills'}
                </h3>
                {isEditMode && (
                  <button
                    onClick={(e) => handleStartEdit('banner1Title', pageContent.banner1Title, e)}
                    className="opacity-0 group-hover/title:opacity-100 p-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black rounded text-[10px] transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Banner Subtext */}
            <p className="text-xs text-slate-300 font-sans font-medium">
              {pageContent.banner1Subtext || 'High torque 850W-1500W copper motors'}
            </p>
          </div>

          <div className="relative z-10 pt-4 flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Explore Collection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Banner 2: THE BIG CLEARANCE ZONE (Highlighted Yellow) */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => {
            if (!editingField) onSelectCategory('Power Tools');
          }}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 text-black p-6 flex flex-col justify-between min-h-[190px] border border-amber-300 shadow-md cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 group-hover:opacity-40 transition-opacity overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80" 
              alt="Clearance" 
              className="w-full h-full object-cover transform scale-105 group-hover:scale-90 transition-transform duration-500 ease-out"
            />
          </div>

          <div className="relative z-10 space-y-1.5 max-w-[75%]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-black text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wide">
                {pageContent.banner2Tag || 'Limited Stock'}
              </span>
              {isEditMode && (
                <button
                  onClick={(e) => handleStartEdit('banner2Tag', pageContent.banner2Tag, e)}
                  className="p-1 bg-black/40 text-white rounded text-[10px]"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>

            {editingField === 'banner2Title' ? (
              <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="bg-white text-black text-base px-2 py-1 border border-black rounded outline-none font-black w-full"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit('banner2Title')}
                  className="p-1 bg-black text-white rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <div className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950 leading-none mt-1">
                  {pageContent.banner2Title || 'THE BIG CLEARANCE'}
                </div>
                {isEditMode && (
                  <button
                    onClick={(e) => handleStartEdit('banner2Title', pageContent.banner2Title, e)}
                    className="opacity-0 group-hover/title:opacity-100 p-1 bg-black/20 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="text-xs font-black uppercase tracking-wider text-slate-900 bg-white/80 px-2.5 py-0.5 rounded inline-block shadow-sm">
              {pageContent.banner2Subtext || 'UPTO 40% OFF WHOLESALE'}
            </div>
          </div>

          <div className="relative z-10 pt-4 flex items-center gap-1.5 text-xs font-extrabold text-black group-hover:translate-x-1 transition-transform">
            <span>Claim Discount on WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Banner 3: Welding & Workshop Inverters */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => {
            if (!editingField) onSelectCategory('Welding & Cutting');
          }}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 text-white p-6 flex flex-col justify-between min-h-[190px] border border-cyan-800/40 shadow-md cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 group-hover:opacity-50 transition-opacity overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" 
              alt="Inverter Welding" 
              className="w-full h-full object-cover transform scale-105 group-hover:scale-90 transition-transform duration-500 ease-out"
            />
          </div>

          <div className="relative z-10 space-y-1.5 max-w-[70%]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-cyan-400 text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wide">
                {pageContent.banner3Tag || 'Heavy Workshop'}
              </span>
              {isEditMode && (
                <button
                  onClick={(e) => handleStartEdit('banner3Tag', pageContent.banner3Tag, e)}
                  className="p-1 bg-cyan-500/20 text-cyan-300 rounded text-[10px]"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>

            {editingField === 'banner3Title' ? (
              <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="bg-black/90 text-white text-base px-2 py-1 border border-cyan-400 rounded outline-none font-bold w-full"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit('banner3Title')}
                  className="p-1 bg-emerald-600 text-white rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h3 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white leading-tight mt-1">
                  {pageContent.banner3Title || 'Inverter Arc Welders'}
                </h3>
                {isEditMode && (
                  <button
                    onClick={(e) => handleStartEdit('banner3Title', pageContent.banner3Title, e)}
                    className="opacity-0 group-hover/title:opacity-100 p-1 bg-cyan-500/20 text-cyan-300 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-cyan-200 font-sans font-medium">
              {pageContent.banner3Subtext || 'IGBT Digital Inverters & Sockets'}
            </p>
          </div>

          <div className="relative z-10 pt-4 flex items-center gap-1.5 text-xs font-bold text-cyan-300 group-hover:translate-x-1 transition-transform">
            <span>View Welders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

      </div>

      {/* 2. VIP Wholesale & Cargo Dispatch Promo Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Yellow Exclusive Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-7 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 text-black rounded-xl p-4 sm:p-5 flex items-center justify-between border border-amber-300 shadow-sm"
        >
          <div className="space-y-1 max-w-[80%]">
            <div className="flex items-center gap-2">
              <span className="bg-black text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                {pageContent.vipTag || 'VIP Corner'}
              </span>
              <span className="text-xs font-bold text-black uppercase tracking-wider font-sans">
                Rawal Workshop Club
              </span>
            </div>
            
            <h4 className="text-base sm:text-lg font-black text-slate-950 font-sans leading-tight">
              {pageContent.vipTitle || 'Additional 10% Discount on Bulk Orders'}
            </h4>
            <p className="text-xs text-slate-800 font-medium">
              {pageContent.vipSubtext || 'Direct factory pricing for verified contractors & workshop mechanics'}
            </p>
          </div>

          <a
            href={buildDirectContactWhatsAppUrl(settings, 'VIP Contractor Discount Inquiry')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('VIP Contractor Promo Bar')}
            className="hidden sm:inline-flex items-center gap-1.5 bg-black hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase px-4 py-2.5 rounded-lg shadow transition-all shrink-0 ml-3 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-yellow-400" />
            <span>Claim Discount</span>
          </a>
        </motion.div>

        {/* Cargo Delivery Dispatch Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white rounded-xl p-4 sm:p-5 flex items-center justify-between border border-indigo-700/40 shadow-sm"
        >
          <div className="space-y-1 max-w-[75%]">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                {pageContent.cargoTag || 'Direct Cargo Dispatch'}
              </span>
            </div>
            <h4 className="text-base font-bold text-white font-sans leading-tight">
              {pageContent.cargoTitle || 'Nationwide Delivery Across Pakistan'}
            </h4>
            <p className="text-xs text-slate-300">
              {pageContent.cargoSubtext || 'Rawalpindi, Islamabad, Lahore, Karachi & Peshawar'}
            </p>
          </div>

          <div className="text-right shrink-0 ml-3">
            <span className="text-2xl font-black text-yellow-400 font-sans block leading-none">
              24-48H
            </span>
            <span className="text-[10px] text-slate-300 uppercase font-mono">
              Fast Cargo
            </span>
          </div>
        </motion.div>

      </div>

    </div>
  );
};
