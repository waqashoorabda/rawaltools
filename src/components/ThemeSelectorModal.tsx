import React from 'react';
import { X, Check, Palette, Sparkles, Sun, Moon, ShieldCheck, ArrowRight } from 'lucide-react';
import { ThemeId, THEMES, ThemeConfig } from '../utils/theme';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const activeConfig = THEMES[currentTheme] || THEMES.industrial_yellow;
  const isLight = !activeConfig.isDark;

  const themesList: ThemeConfig[] = Object.values(THEMES);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn">
      <div 
        className={`relative border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto transition-all ${
          isLight 
            ? 'bg-white text-slate-900 border-slate-200' 
            : 'bg-[#10141D] text-[#F1F3F7] border-[#252C3C]'
        }`}
      >
        {/* Header Bar */}
        <div className={`sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-200' : 'bg-[#10141D]/95 border-[#222836]'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: activeConfig.previewAccent,
                color: activeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl font-serif-editorial leading-tight">
                  Store Theme & Color Palette Studio
                </h3>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 border font-bold uppercase rounded"
                  style={{ color: activeConfig.previewAccent, borderColor: `${activeConfig.previewAccent}60` }}
                >
                  Live Switch
                </span>
              </div>
              <p className={`text-xs font-mono line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Select a visual theme. All store pages, product cart, modals, and team directory will adopt this style.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isLight 
                ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200' 
                : 'text-slate-300 hover:text-white bg-[#1A202C] hover:bg-[#252E3E] border-[#2D3748]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Theme Cards Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themesList.map((t) => {
              const isCurrent = t.id === currentTheme;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTheme(t.id);
                  }}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isCurrent
                      ? 'shadow-lg scale-[1.01]'
                      : 'hover:border-slate-400/60 opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: t.previewBg,
                    borderColor: isCurrent ? t.previewAccent : t.isDark ? '#2B3346' : '#E2E8F0',
                    color: t.isDark ? '#FFFFFF' : '#111827',
                  }}
                >
                  {/* Theme Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: t.previewAccent }}
                        />
                        <span className="font-bold text-sm sm:text-base font-sans">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border ${
                          t.isDark 
                            ? 'bg-black/50 text-slate-300 border-white/10' 
                            : 'bg-white/80 text-slate-700 border-slate-300'
                        }`}>
                          {t.isDark ? <Moon className="w-3 h-3 text-amber-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                          <span>{t.isDark ? 'Dark Mode' : 'Light Mode'}</span>
                        </span>
                        {isCurrent && (
                          <span 
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 text-black shadow-sm"
                            style={{ backgroundColor: t.previewAccent }}
                          >
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-serif-editorial text-amber-400 mb-1">
                      {t.urduName}
                    </div>

                    <p className={`text-xs leading-relaxed mb-4 ${t.isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t.tagline}
                    </p>
                  </div>

                  {/* Visual Preview Sample Elements */}
                  <div className={`p-3 rounded-lg border space-y-2 mb-4 ${
                    t.isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Preview Elements:</span>
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: `${t.previewAccent}25`, color: t.previewAccent }}
                      >
                        Sample Badge
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="flex-1 py-1.5 px-3 rounded text-center text-xs font-bold font-mono transition-transform group-hover:scale-102"
                        style={{
                          backgroundColor: t.previewAccent,
                          color: t.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                        }}
                      >
                        Primary Button
                      </div>
                      <div className="py-1.5 px-3 rounded text-center text-xs font-bold font-mono bg-[#22C55E] text-white">
                        WhatsApp
                      </div>
                    </div>
                  </div>

                  {/* Action Selection Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTheme(t.id);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-2'
                        : 'border opacity-90 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? t.previewAccent : 'transparent',
                      borderColor: t.previewAccent,
                      color: isCurrent 
                        ? (t.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF')
                        : t.previewAccent,
                    }}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Currently Applied Theme</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Apply This Theme (یہ تھیم منتخب کریں)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Bar */}
        <div className={`px-6 py-4 border-t flex items-center justify-between text-xs font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0A0D14] border-[#1E2536] text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Theme applies instantly across Catalog, Cart, Team, & Detail Pages.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
