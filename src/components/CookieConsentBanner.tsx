import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, X, Settings2 } from 'lucide-react';
import { CookieConsentSettings, PillarPageType } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { DEFAULT_COOKIE_CONSENT, loadStoredCookieConsent, saveStoredCookieConsent } from '../utils/storage';

interface CookieConsentBannerProps {
  consent?: CookieConsentSettings;
  onSaveConsent?: (consent: CookieConsentSettings) => void;
  onOpenPillarPage?: (page: PillarPageType) => void;
  theme?: ThemeId;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  consent: initialConsent,
  onSaveConsent,
  onOpenPillarPage,
  theme = 'industrial_yellow',
}) => {
  const currentConsent = initialConsent || DEFAULT_COOKIE_CONSENT;
  const [visible, setVisible] = useState<boolean>(() => !currentConsent.hasAnswered);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [allowAnalytics, setAllowAnalytics] = useState<boolean>(currentConsent.analytics ?? true);
  const [allowAds, setAllowAds] = useState<boolean>(currentConsent.advertising ?? true);

  useEffect(() => {
    if (initialConsent) {
      setVisible(!initialConsent.hasAnswered);
      setAllowAnalytics(initialConsent.analytics ?? true);
      setAllowAds(initialConsent.advertising ?? true);
    } else {
      const stored = loadStoredCookieConsent();
      setVisible(!stored.hasAnswered);
      setAllowAnalytics(stored.analytics ?? true);
      setAllowAds(stored.advertising ?? true);
    }
  }, [initialConsent?.hasAnswered, initialConsent]);

  if (!visible) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;

  const handleAcceptAll = () => {
    const updated: CookieConsentSettings = {
      hasAnswered: true,
      necessary: true,
      analytics: true,
      advertising: true,
      answeredAt: new Date().toISOString(),
    };
    if (onSaveConsent) {
      onSaveConsent(updated);
    } else {
      saveStoredCookieConsent(updated);
    }
    setVisible(false);
  };

  const handleDeclineNonEssential = () => {
    const updated: CookieConsentSettings = {
      hasAnswered: true,
      necessary: true,
      analytics: false,
      advertising: false,
      answeredAt: new Date().toISOString(),
    };
    if (onSaveConsent) {
      onSaveConsent(updated);
    } else {
      saveStoredCookieConsent(updated);
    }
    setVisible(false);
  };

  const handleSaveCustom = () => {
    const updated: CookieConsentSettings = {
      hasAnswered: true,
      necessary: true,
      analytics: allowAnalytics,
      advertising: allowAds,
      answeredAt: new Date().toISOString(),
    };
    if (onSaveConsent) {
      onSaveConsent(updated);
    } else {
      saveStoredCookieConsent(updated);
    }
    setVisible(false);
  };

  return (
    <aside 
      aria-label="Cookie and Privacy Consent" 
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-xl z-50 animate-in slide-in-from-bottom-5 font-sans"
    >
      <div className="bg-[#0F141E]/95 backdrop-blur-md border-2 border-amber-400/80 p-4 sm:p-5 rounded-none shadow-2xl text-white space-y-3 font-sans">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-black font-bold">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Cookie & Privacy Consent</span>
                <span className="text-[10px] font-mono text-amber-400 border border-amber-400/40 px-1.5 py-0.2">
                  GDPR & ADSENSE
                </span>
              </h4>
            </div>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-white p-1"
            title="Dismiss temporarily"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-light">
          We use cookies and browser storage to optimize site functionality, deliver relevant hardware quotes, and support advertising partners.
        </p>

        {/* Customization Drawer */}
        {showCustomize && (
          <div className="p-3 bg-[#080B10] border border-[#20293A] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[#20293A]">
              <div>
                <span className="font-bold text-white">Essential Cookies:</span>
                <p className="text-[10px] text-slate-400">Cart quote, theme memory, and site layout.</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">ALWAYS ACTIVE</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#20293A]">
              <div>
                <span className="font-bold text-white">Visitor Analytics:</span>
                <p className="text-[10px] text-slate-400">Anonymous tools and catalog search performance.</p>
              </div>
              <input
                type="checkbox"
                checked={allowAnalytics}
                onChange={(e) => setAllowAnalytics(e.target.checked)}
                className="accent-amber-400 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-bold text-white">AdSense & Marketing:</span>
                <p className="text-[10px] text-slate-400">Personalized Google advertising banners.</p>
              </div>
              <input
                type="checkbox"
                checked={allowAds}
                onChange={(e) => setAllowAds(e.target.checked)}
                className="accent-amber-400 w-4 h-4"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <button
              type="button"
              onClick={() => onOpenPillarPage('cookies')}
              className="underline hover:text-amber-400 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowCustomize(!showCustomize)}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <Settings2 className="w-3 h-3" />
              <span>{showCustomize ? 'Hide Options' : 'Customize'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {showCustomize ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDeclineNonEssential}
                  className="px-2.5 py-1.5 bg-[#1B2332] hover:bg-[#253045] text-slate-300 text-xs font-mono uppercase tracking-wider border border-[#2B3850] transition-colors cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
