import React, { useState } from 'react';
import { Palette, Check, ChevronDown, ChevronUp, Sparkles, Layers, Sliders } from 'lucide-react';
import { ThemeId, THEMES } from '../utils/theme';

interface ThemePreviewBarProps {
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onOpenFullModal: () => void;
}

export const ThemePreviewBar: React.FC<ThemePreviewBarProps> = ({
  currentTheme,
  onSelectTheme,
  onOpenFullModal,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const themeList = Object.values(THEMES);
  const activeConfig = THEMES[currentTheme] || THEMES.industrial_yellow;

  return (
    <>
      {/* Top Permanent Sticky Bar with High Contrast & Visual Highlight */}
      <div 
        id="theme-preview-top-bar"
        className="w-full bg-[#090B0F] text-white border-b-2 border-[#F59E0B] shadow-2xl relative z-40 font-mono"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
          
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#F59E0B] text-black flex items-center justify-center font-bold shadow-sm">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm tracking-wider text-[#F59E0B] uppercase">
                    LIVE THEME STUDIO • تھیم تبدیل کریں
                  </span>
                  <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.2 border border-[#F59E0B]/40 font-bold">
                    4 DESIGNS READY
                  </span>
                </div>
                <div className="text-[11px] text-[#A6B2C8] hidden sm:block">
                  Click any theme to transform entire website (colors, buttons, cards):
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenFullModal}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Theme Gallery</span>
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[#AAA] hover:text-white bg-[#161B24] border border-[#2B3447] px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors"
                title={isOpen ? 'Hide Cards' : 'Show Theme Cards'}
              >
                <span className="hidden sm:inline">{isOpen ? 'Minimize' : 'Show 4 Themes'}</span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 4 Theme Cards Grid */}
          {isOpen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-2.5 pt-2.5 border-t border-[#1F2636]">
              {themeList.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`text-left p-2.5 sm:p-3 transition-all border relative flex flex-col justify-between cursor-pointer group ${
                      isActive
                        ? 'bg-[#18202D] border-[#F59E0B] ring-2 ring-[#F59E0B]/60 shadow-lg'
                        : 'bg-[#10141C] border-[#222A3A] hover:border-[#4D5A75] hover:bg-[#141924]'
                    }`}
                  >
                    {/* Active Indicator Badge */}
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 bg-[#F59E0B] text-black text-[9px] font-bold px-1.5 py-0.2 flex items-center gap-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ACTIVE
                      </span>
                    )}

                    <div>
                      {/* Visual Color Palette Swatches */}
                      <div className="flex items-center gap-1 mb-1.5">
                        <div
                          className="w-3.5 h-3.5 border border-[#555]"
                          style={{ backgroundColor: theme.previewBg }}
                          title="Background"
                        />
                        <div
                          className="w-3.5 h-3.5 border border-[#555]"
                          style={{ backgroundColor: theme.previewAccent }}
                          title="Accent"
                        />
                        <div
                          className="w-3.5 h-3.5 border border-[#555] bg-[#22C55E]"
                          title="WhatsApp"
                        />
                        <span className="text-[9px] text-[#8E98A8] ml-1 uppercase">
                          {theme.isDark ? 'Dark' : 'Light'}
                        </span>
                      </div>

                      {/* Theme Title */}
                      <div className="font-bold text-xs text-white leading-tight group-hover:text-[#F59E0B] transition-colors">
                        {theme.name}
                      </div>
                      <div className="text-[10px] text-[#F59E0B] font-sans">
                        {theme.urduName}
                      </div>
                    </div>

                    <div className="mt-2 pt-1 border-t border-[#1E2535] text-[10px] text-[#7A869A] flex items-center justify-between">
                      <span className="truncate">{theme.tagline.split('•')[0]}</span>
                      <span className={`text-[9px] uppercase font-bold ${isActive ? 'text-[#F59E0B]' : 'text-[#888]'}`}>
                        {isActive ? 'Applied' : 'Select'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Floating Theme Button (Bottom Left) so user can switch from anywhere */}
      <button
        id="floating-theme-toggle-btn"
        onClick={onOpenFullModal}
        className="fixed bottom-24 left-4 z-40 bg-[#0F131C] hover:bg-[#181F2E] text-white border-2 border-[#F59E0B] shadow-2xl px-4 py-2.5 flex items-center gap-2.5 text-xs font-mono rounded-none transition-all group active:scale-95 cursor-pointer"
        title="Open Theme Studio"
      >
        <div className="w-5 h-5 bg-[#F59E0B] text-black flex items-center justify-center font-bold">
          <Palette className="w-3 h-3 group-hover:rotate-45 transition-transform" />
        </div>
        <div className="text-left">
          <div className="font-bold text-[#F59E0B] uppercase tracking-wider text-[11px]">
            🎨 Theme Studio
          </div>
          <div className="text-[10px] text-[#A6B2C8]">
            {activeConfig.name.split(' ')[0]} (Click to change)
          </div>
        </div>
      </button>
    </>
  );
};
