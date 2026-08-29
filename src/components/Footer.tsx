import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, ShieldCheck, Truck, Unlock, Edit3, Check, FileText, Cookie, BookOpen, QrCode, Users } from 'lucide-react';
import { StoreSettings, PageContent, PillarPageType } from '../types';
import { buildDirectContactWhatsAppUrl, cleanWhatsAppNumber } from '../utils/whatsapp';
import { ThemeId, THEMES } from '../utils/theme';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  theme?: ThemeId;
  pageContent?: PageContent;
  isEditMode?: boolean;
  onUpdateContent?: (field: keyof PageContent, value: string) => void;
  onOpenPillarPage?: (page: PillarPageType) => void;
  onScrollToBlog?: () => void;
  onOpenTeamModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  settings, 
  onOpenAdmin, 
  isAdmin,
  theme = 'industrial_yellow',
  pageContent,
  isEditMode = false,
  onUpdateContent,
  onOpenPillarPage,
  onScrollToBlog,
  onOpenTeamModal,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState(pageContent?.footerAboutText || '');

  const handleSaveAbout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateContent && aboutText.trim()) {
      onUpdateContent('footerAboutText', aboutText);
    }
    setIsEditingAbout(false);
  };

  return (
    <footer 
      className={`border-t text-xs mt-16 font-sans transition-colors ${
        isLight
          ? 'bg-slate-900 border-slate-800 text-slate-400'
          : 'bg-[#08090C] border-[#1C212E] text-[#889]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            {settings.logoUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'Company Logo'}
                  className="h-10 sm:h-12 w-auto max-w-[200px] object-contain bg-white/5 p-1 rounded-sm border border-white/10"
                />
                <div>
                  <div
                    className="text-xl font-serif-editorial font-bold text-white leading-tight"
                    style={{ color: themeConfig.previewAccent }}
                  >
                    {settings.storeName}
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#666]">
                    OFFICIAL SHOWROOM
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-3xl font-serif-editorial font-black italic leading-none"
                  style={{ color: themeConfig.previewAccent }}
                >
                  RAWAL
                </span>
                <span className="text-xl font-serif-editorial font-light tracking-[0.2em] text-white uppercase">
                  TOOLS
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#555] ml-2 border-l border-[#333] pl-2">
                  EST. 2024
                </span>
              </div>
            )}

            {isEditingAbout ? (
              <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                <textarea
                  rows={3}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="w-full bg-[#15181F] text-white text-xs p-2 border border-amber-400 rounded outline-none font-sans"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveAbout()}
                    className="px-2.5 py-1 bg-amber-400 text-black font-bold text-[10px] rounded flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={() => setIsEditingAbout(false)}
                    className="px-2.5 py-1 bg-[#222] text-white text-[10px] rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group/about relative">
                <p className="text-[#888888] leading-relaxed text-xs max-w-sm font-light">
                  {pageContent?.footerAboutText || "Pakistan's premier industrial showcase for precision rotary tools, industrial angle grinders, heavy duty sockets, welding inverters, and high-tolerance workshop equipment. Direct quotation and express cargo dispatch."}
                </p>
                {isEditMode && (
                  <button
                    onClick={() => {
                      setAboutText(pageContent?.footerAboutText || "Pakistan's premier industrial showcase for precision rotary tools, industrial angle grinders, heavy duty sockets, welding inverters, and high-tolerance workshop equipment. Direct quotation and express cargo dispatch.");
                      setIsEditingAbout(true);
                    }}
                    className="opacity-0 group-hover/about:opacity-100 mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 hover:underline"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit About Text</span>
                  </button>
                )}
              </div>
            )}

            <div className="pt-1 font-mono">
              <a
                href={buildDirectContactWhatsAppUrl(settings)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold px-4 py-2.5 rounded-none text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp: +{cleanWhatsAppNumber(settings.whatsappNumber)}</span>
              </a>
            </div>
          </div>

          {/* Col 2: Warehouse & Contact Details */}
          <div className="md:col-span-4 space-y-3 font-mono">
            <h4 className="text-[11px] uppercase tracking-widest text-white font-bold border-b border-[#222] pb-1.5">
              Showroom & Dispatch
            </h4>
            <ul className="space-y-2.5 text-xs text-[#888]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: themeConfig.previewAccent }} />
                <span>{settings.address}, {settings.city}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: themeConfig.previewAccent }} />
                <a href={`tel:${settings.whatsappNumber}`} className="hover:text-white transition-colors">
                  {settings.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: themeConfig.previewAccent }} />
                <span className="hover:text-white">{settings.email}</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quality Standards & Customer Assurance */}
          <div className="md:col-span-3 space-y-3 font-mono">
            <h4 className="text-[11px] uppercase tracking-widest text-white font-bold border-b border-[#222] pb-1.5 flex items-center justify-between">
              <span>Customer Assurance</span>
              <button
                type="button"
                onClick={() => onOpenTeamModal && onOpenTeamModal()}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Users className="w-3 h-3" />
                <span>Meet Team</span>
              </button>
            </h4>
            <div className="space-y-2 text-xs text-[#777]">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5" style={{ color: themeConfig.previewAccent }} />
                <span className="text-[#AAA]">All-Pakistan Cargo Service</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                <span className="text-[#AAA]">Verified Tool Specifications</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="text-[#AAA]">Instant WhatsApp Support</span>
              </div>
            </div>

            {/* Meet Our Team quick trigger button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onOpenTeamModal && onOpenTeamModal()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#131924] hover:bg-[#1C2536] text-amber-400 border border-amber-400/30 hover:border-amber-400 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Our Team & Reps (ہماری ٹیم)</span>
              </button>
            </div>

            {/* If Admin is logged in, show active dashboard link */}
            {isAdmin && (
              <div className="pt-1">
                <button
                  onClick={onOpenAdmin}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/10 text-white border border-white/20 text-xs font-mono uppercase tracking-wider hover:bg-white/20 transition-colors"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Admin Control Active</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Bottom copyright and Pillar Links */}
        <div className="pt-8 mt-10 border-t border-[#1C212E] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#889]">
          <div>
            © {new Date().getFullYear()} {settings.storeName}. Precision Engineering & Industrial Machinery (Pakistan).
          </div>
          
          {/* Pillar Pages & Directory Quick Links */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenTeamModal && onOpenTeamModal()}
              className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold"
            >
              <Users className="w-3 h-3" />
              <span>Our Team (ہماری ٹیم)</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onScrollToBlog && onScrollToBlog()}
              className="text-slate-300 hover:text-white hover:underline cursor-pointer flex items-center gap-1 font-bold"
            >
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>Articles & Blog</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenPillarPage && onOpenPillarPage('contact')}
              className="hover:text-white cursor-pointer"
            >
              Contact Us (رابطہ کریں)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenPillarPage && onOpenPillarPage('terms')}
              className="hover:text-white cursor-pointer"
            >
              Terms & Warranties (وارنٹی شرائط)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenPillarPage && onOpenPillarPage('cookies')}
              className="hover:text-white cursor-pointer"
            >
              Cookies & Privacy (پرائیویسی)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
