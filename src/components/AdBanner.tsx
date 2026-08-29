import React, { useEffect, useRef } from 'react';
import { 
  Megaphone, 
  ExternalLink, 
  Sparkles, 
  Edit3, 
  Code2, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AdBannerSlot } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { trackWhatsAppClick } from '../utils/analytics';

interface AdBannerProps {
  slot?: AdBannerSlot;
  globalAdsEnabled?: boolean;
  theme?: ThemeId;
  onEditSlot?: (slotId: string) => void;
  isVisualEditMode?: boolean;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  globalAdsEnabled = true,
  theme = 'industrial_yellow',
  onEditSlot,
  isVisualEditMode = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  // Handle Google AdSense initialization for AdSense slots
  useEffect(() => {
    if (!slot || !slot.isEnabled || !globalAdsEnabled) return;
    if (slot.adType === 'adsense_code' || slot.adsenseCustomCode) {
      try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        // Safe catch for sandbox / dev mode
      }
    }
  }, [slot, globalAdsEnabled]);

  // If ads are disabled and not in visual edit mode, render nothing
  if (!slot) return null;
  if ((!globalAdsEnabled || !slot.isEnabled) && !isVisualEditMode) {
    return null;
  }

  // If disabled but in Visual Edit Mode, show placeholder to allow enabling
  if (!globalAdsEnabled || !slot.isEnabled) {
    return (
      <div 
        onClick={() => onEditSlot && onEditSlot(slot.id)}
        className={`w-full max-w-7xl mx-auto px-4 py-3 my-4 border-2 border-dashed rounded-xl flex items-center justify-between cursor-pointer transition-all ${
          isLight ? 'border-amber-300 bg-amber-50/70 text-amber-900' : 'border-amber-500/40 bg-amber-950/20 text-amber-300'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400 text-black rounded font-bold">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-sans flex items-center gap-2">
              <span>{slot.name}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-black/20 rounded">
                [DISABLED — Click to Activate & Add AdSense Code]
              </span>
            </div>
            <p className="text-[11px] opacity-80">{slot.locationLabel} • {slot.dimensions}</p>
          </div>
        </div>

        <button className="flex items-center gap-1 text-xs font-bold bg-amber-400 text-black px-3 py-1.5 rounded shadow">
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Ad</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-8 my-5 ${className}`}>
      <div className="relative group/ad container-ad">
        
        {/* Floating Quick Edit Button in Visual Edit Mode */}
        {isVisualEditMode && onEditSlot && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSlot(slot.id);
            }}
            className="absolute -top-3 right-4 z-30 flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-full shadow-lg border border-amber-300 transition-transform hover:scale-105 cursor-pointer"
            title="Edit Google AdSense Code or Banner Image"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Ad Slot ({slot.name})</span>
          </button>
        )}

        {/* Ad Type 1: Google AdSense Script / Code Snippet */}
        {slot.adType === 'adsense_code' ? (
          <div 
            ref={containerRef}
            className={`w-full rounded-xl border p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-800' 
                : 'bg-[#11141C] border-[#222836] text-slate-200'
            }`}
          >
            {/* Top Micro Label */}
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                <Code2 className="w-3 h-3 text-amber-500" />
                Google AdSense • {slot.locationLabel}
              </span>
              <span>{slot.dimensions}</span>
            </div>

            {/* Injected HTML / Ins Tag or Clean AdSense Container */}
            {slot.adsenseCustomCode ? (
              <div 
                className="w-full overflow-hidden flex items-center justify-center min-h-[90px]"
                dangerouslySetInnerHTML={{ __html: slot.adsenseCustomCode }}
              />
            ) : (
              <div className="w-full min-h-[90px] border border-dashed border-amber-500/30 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-amber-500/5">
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', textAlign: 'center' }}
                  data-ad-client={slot.adsenseClient || 'ca-pub-9876543210987654'}
                  data-ad-slot={slot.adsenseSlot || '1234567890'}
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
                <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google AdSense Slot Active ({slot.adsenseSlot || 'Auto-Responsive'})</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Ad Type 2: Custom Image & Link Banner (with Smooth Zoom-Out on Hover) */
          <a
            href={slot.targetUrl || '#'}
            target={slot.openInNewTab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            onClick={() => {
              if (slot.targetUrl?.includes('wa.me')) {
                trackWhatsAppClick(`Ad Banner: ${slot.name}`);
              }
            }}
            className={`group block relative rounded-2xl overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 ${
              isLight 
                ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-black text-white border-slate-700/60' 
                : 'bg-gradient-to-r from-[#141822] via-[#0E1015] to-[#0A0C10] text-white border-[#272F3F]'
            }`}
          >
            {/* Background Image Container with Smooth Hover Zoom-Out */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slot.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80'}
                alt={slot.altText || slot.title || 'Advertisement'}
                className="w-full h-full object-cover opacity-25 group-hover:opacity-40 transform scale-105 group-hover:scale-90 transition-transform duration-500 ease-out"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            </div>

            {/* Banner Inner Content */}
            <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded font-mono shadow-sm"
                    style={{
                      backgroundColor: themeConfig.previewAccent,
                      color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                    }}
                  >
                    {slot.badge || 'ADVERTISEMENT'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {slot.dimensions}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-base sm:text-xl md:text-2xl font-black font-sans tracking-tight text-white leading-snug group-hover:text-amber-300 transition-colors">
                  {slot.title || 'Exclusive Contractor Deals & Wholesale Machinery Discounts'}
                </h4>

                {/* Subtitle */}
                {slot.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-300 font-sans line-clamp-2 leading-relaxed">
                    {slot.subtitle}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center">
                <div 
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transform group-hover:translate-x-1 transition-all"
                  style={{
                    backgroundColor: themeConfig.previewAccent,
                    color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                  }}
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </a>
        )}

      </div>
    </div>
  );
};
