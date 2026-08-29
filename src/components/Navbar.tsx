import React, { useState } from 'react';
import { 
  Wrench, 
  MessageCircle, 
  Phone, 
  ShoppingBag, 
  Search, 
  Lock, 
  Unlock, 
  Palette,
  Sparkles,
  BookOpen,
  QrCode,
  FileText,
  Sun,
  Moon,
  ChevronDown,
  Check
} from 'lucide-react';
import { CartItem, StoreSettings, PillarPageType } from '../types';
import { buildDirectContactWhatsAppUrl } from '../utils/whatsapp';
import { ThemeId, THEMES, ThemeConfig } from '../utils/theme';

interface NavbarProps {
  settings: StoreSettings;
  cart: CartItem[];
  isAdmin: boolean;
  theme?: ThemeId;
  onSelectTheme?: (theme: ThemeId) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenThemeModal?: () => void;
  onOpenPillarPage?: (page: PillarPageType) => void;
  onScrollToBlog?: () => void;
  onOpenTeamModal?: () => void;
  onOpenQrScanner?: () => void;
  onOpenSearch?: () => void;
  onGoHome?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalProductsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cart,
  isAdmin,
  theme = 'industrial_yellow',
  onSelectTheme,
  onOpenCart,
  onOpenAdmin,
  onOpenThemeModal,
  onOpenPillarPage,
  onScrollToBlog,
  onOpenTeamModal,
  onOpenQrScanner,
  onGoHome,
  searchQuery,
  onSearchChange,
  totalProductsCount,
}) => {
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onGoHome) onGoHome();
  };

  const handleQuickSelectTheme = (tId: ThemeId) => {
    if (onSelectTheme) {
      onSelectTheme(tId);
    }
    setIsThemeDropdownOpen(false);
  };

  const themesList = Object.values(THEMES);

  return (
    <header 
      id="main-header" 
      className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#0A0C10]/95 border-[#222733] text-[#F1F3F7]'
      }`}
    >
      {/* Top Editorial Micro-bar */}
      <div 
        className={`px-3 sm:px-4 py-1.5 text-[11px] border-b font-mono transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#07090D] border-[#1C212E] text-[#889]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          
          {/* Left Info & Nav Links */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span 
                className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: themeConfig.previewAccent }}
              />
              <span className="uppercase tracking-[0.15em] text-[10px] font-bold">
                Rawal Tools Hub
              </span>
            </div>

            {/* Quick Pillar Links */}
            <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-400">
              <button
                type="button"
                onClick={() => onOpenTeamModal && onOpenTeamModal()}
                className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold"
              >
                <span>Our Team (ہماری ٹیم)</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onScrollToBlog && onScrollToBlog()}
                className="hover:text-amber-400 cursor-pointer flex items-center gap-1 font-bold"
              >
                <BookOpen className="w-3 h-3 text-amber-400" />
                <span>Guides & Blog</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenPillarPage && onOpenPillarPage('contact')}
                className="hover:text-amber-400 cursor-pointer"
              >
                Contact Us
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenPillarPage && onOpenPillarPage('terms')}
                className="hover:text-amber-400 cursor-pointer"
              >
                Warranty & Terms
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenPillarPage && onOpenPillarPage('cookies')}
                className="hover:text-amber-400 cursor-pointer"
              >
                Cookies
              </button>
            </div>
          </div>

          {/* Right: Instant Theme Color Switcher Swatches + Contact Info */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            
            {/* FRONTEND THEME COLOR SWITCHER IN TOP BAR */}
            <div className="flex items-center gap-1.5 bg-black/20 dark:bg-black/40 px-2 py-0.5 rounded-full border border-slate-700/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 hidden xs:flex">
                <Palette className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Theme:</span>
              </span>
              
              {/* Color Swatch Dots */}
              <div className="flex items-center gap-1">
                {themesList.map((t) => {
                  const isCurrent = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleQuickSelectTheme(t.id)}
                      title={`${t.name} (${t.urduName})`}
                      className={`w-4 h-4 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                        isCurrent 
                          ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-110 shadow-md' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: t.previewAccent }}
                    >
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-black/80 inline-block" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Open Full Theme Modal Button */}
              {onOpenThemeModal && (
                <button
                  type="button"
                  onClick={onOpenThemeModal}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 ml-1 hover:underline cursor-pointer"
                  title="Open Theme Studio Modal"
                >
                  All
                </button>
              )}
            </div>

            <a 
              href={`tel:${settings.whatsappNumber}`} 
              className="hidden lg:flex items-center gap-1 hover:underline transition-colors"
            >
              <Phone className="w-3 h-3 text-[#777]" />
              <span>{settings.phoneDisplay}</span>
            </a>

            <span className="hidden lg:inline opacity-30">|</span>

            <a 
              href={buildDirectContactWhatsAppUrl(settings)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold hover:underline"
              style={{ color: isLight ? '#16A34A' : themeConfig.previewAccent }}
            >
              <MessageCircle className="w-3 h-3" />
              <span>+{settings.whatsappNumber}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <a href="#" onClick={handleLogoClick} className="flex items-center gap-2.5 group cursor-pointer">
            {settings.logoUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'Company Logo'}
                  className="h-9 sm:h-12 w-auto max-w-[160px] sm:max-w-[220px] object-contain"
                />
                <div className="hidden sm:flex flex-col">
                  <span
                    className="text-base sm:text-lg font-serif-editorial font-bold leading-tight"
                    style={{ color: themeConfig.previewAccent }}
                  >
                    {settings.storeName}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#777]">
                    {settings.city ? settings.city.split(',')[0] : 'Industrial Store'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-2xl sm:text-4xl font-serif-editorial font-black italic leading-none tracking-tight transition-colors"
                  style={{ color: themeConfig.previewAccent }}
                >
                  RAWAL
                </span>
                <span className={`text-lg sm:text-2xl font-serif-editorial font-light tracking-[0.25em] uppercase ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  TOOLS
                </span>
                <span className="hidden md:inline-block text-[9px] uppercase tracking-[0.2em] font-mono text-[#777] ml-2 border-l border-[#444] pl-2">
                  PAKISTAN
                </span>
              </div>
            )}
          </a>
        </div>

        {/* Center Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-[#666]'}`} />
            <input
              type="text"
              id="navbar-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search rotary hammers, grinders, welding..."
              className={`w-full text-xs placeholder-[#777] pl-9 pr-9 py-2.5 rounded-lg border outline-none transition-colors font-mono ${
                isLight
                  ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-500'
                  : 'bg-[#141822] text-white border-[#262B35] focus:border-amber-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#888] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right CTA Group */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Quick QR Scanner & Simulator Trigger */}
          {onOpenQrScanner && (
            <button
              onClick={onOpenQrScanner}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-mono tracking-wider border transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-[#141822] hover:bg-[#1C212F] text-slate-200 border-[#2B3242]'
              }`}
              title="Scan QR Code / Open Simulator"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-bold">QR Scanner</span>
            </button>
          )}

          {/* FRONTEND THEME BUTTON (DROPDOWN / MODAL OPENER) */}
          <div className="relative">
            <button
              onClick={() => {
                if (onOpenThemeModal) {
                  onOpenThemeModal();
                } else {
                  setIsThemeDropdownOpen(!isThemeDropdownOpen);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-mono tracking-wider border transition-all cursor-pointer ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                  : 'bg-[#181E2C] hover:bg-[#222B3D] text-amber-400 border-amber-400/40 shadow-sm'
              }`}
              title="Switch Site Color & Theme (تھیم تبدیل کریں)"
            >
              <span 
                className="w-3 h-3 rounded-full border border-black/30 shrink-0" 
                style={{ backgroundColor: themeConfig.previewAccent }}
              />
              <span className="hidden md:inline font-bold">
                {themeConfig.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Quick Theme Dropdown Menu */}
            {isThemeDropdownOpen && (
              <div 
                className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121622] border-[#2A3448] text-white'
                }`}
              >
                <div className="px-3 py-1.5 border-b border-slate-700/30 text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span>Select Color Theme</span>
                  <span className="text-amber-400">All Pages Sync</span>
                </div>
                <div className="py-1">
                  {themesList.map((t) => {
                    const isSelected = t.id === theme;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleQuickSelectTheme(t.id)}
                        className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? isLight ? 'bg-amber-50 text-amber-900 font-bold' : 'bg-amber-400/10 text-amber-400 font-bold'
                            : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/30"
                            style={{ backgroundColor: t.previewAccent }}
                          />
                          <div>
                            <div className="leading-tight">{t.name.split(' (')[0]}</div>
                            <div className="text-[10px] text-slate-400">{t.urduName}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
                {onOpenThemeModal && (
                  <div className="pt-1 border-t border-slate-700/30 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsThemeDropdownOpen(false);
                        onOpenThemeModal();
                      }}
                      className="w-full py-1.5 text-center text-[11px] font-mono font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      Open Full Theme Studio →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick WhatsApp Inquiry Action */}
          <a
            href={buildDirectContactWhatsAppUrl(settings, 'Direct store inquiry from website')}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-3 py-2 rounded-lg text-xs font-mono font-bold tracking-tight uppercase transition-all shadow-sm active:scale-95"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>WhatsApp</span>
          </a>

          {/* Multi-Item Quote Cart Action */}
          <button
            id="open-cart-btn"
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
            style={{
              backgroundColor: themeConfig.previewAccent,
              color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quote Cart</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Admin Panel Access Button */}
          <button
            id="admin-panel-trigger-btn"
            onClick={onOpenAdmin}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isAdmin 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300' 
                  : 'bg-[#141822] hover:bg-[#1C212F] text-slate-400 border-[#2B3242]'
            }`}
            title={isAdmin ? 'Admin Dashboard (Unlocked)' : 'Admin Login'}
          >
            {isAdmin ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Mobile Search & Quick Nav Bar */}
      <div className={`md:hidden px-4 py-2 border-t flex items-center gap-2 ${
        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#0E1117] border-[#1E2330]'
      }`}>
        <div className="relative flex-1">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-[#666]'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools, grinders, welders..."
            className={`w-full text-xs placeholder-[#777] pl-8 pr-7 py-2 rounded-md border outline-none font-mono ${
              isLight
                ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500'
                : 'bg-[#141822] text-white border-[#262B35] focus:border-amber-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#888]"
            >
              ✕
            </button>
          )}
        </div>

        {onOpenTeamModal && (
          <button
            type="button"
            onClick={onOpenTeamModal}
            className="px-2.5 py-2 bg-amber-400 text-black text-xs font-mono font-bold rounded-md whitespace-nowrap shadow-sm"
          >
            Our Team
          </button>
        )}
      </div>

    </header>
  );
};
