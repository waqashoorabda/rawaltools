import React, { useState } from 'react';
import { 
  Megaphone, 
  Code2, 
  Image as ImageIcon, 
  Save, 
  Check, 
  ExternalLink, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  Plus, 
  Eye, 
  DollarSign,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AdSettings, AdBannerSlot, AdType } from '../types';
import { DEFAULT_AD_SETTINGS } from '../data/defaultAdSettings';

interface AdminAdsManagerViewProps {
  adSettings: AdSettings;
  onSaveAdSettings: (settings: AdSettings) => void;
}

const SAMPLE_BANNER_PRESETS = [
  {
    name: 'Power Tools Clearance (1200x400)',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    title: 'SPECIAL CONTRACTOR MEGA SALE — FLAT 25% OFF COPPER ARMATURE POWER TOOLS',
    subtitle: 'Official Rawal Tools Direct Factory Clearance • Nationwide COD Delivery Across Pakistan',
    badge: 'MEGA SALE',
  },
  {
    name: 'Inverter Welding Plants (1200x400)',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    title: 'INDUSTRIAL IGBT INVERTER WELDING PLANTS & AUTO-DARKENING TRUE-COLOR MASKS',
    subtitle: '200A - 300A High Duty Cycle Inverters with 1 Year Parts Support. Book Orders on WhatsApp.',
    badge: 'SPECIAL PROMO',
  },
  {
    name: 'Cobalt Drill Bits & Sockets (1000x400)',
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80',
    title: 'GENUINE M35 5% COBALT HIGH-SPEED DRILL BITS & HARDENED CHROME VANADIUM SETS',
    subtitle: 'Guaranteed drilling through Stainless Steel & Cast Iron without burning tips.',
    badge: 'HARDWARE AD',
  },
  {
    name: 'Wholesale B2B Distribution (1200x400)',
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80',
    title: 'JOIN PAKISTAN’S LARGEST INDUSTRIAL TOOLS WHOLESALE & DISTRIBUTION NETWORK',
    subtitle: 'Competitive dealer margins, bulk cartons & direct depot delivery in Lahore, Karachi & Rawalpindi.',
    badge: 'WHOLESALE B2B',
  },
];

export const AdminAdsManagerView: React.FC<AdminAdsManagerViewProps> = ({
  adSettings,
  onSaveAdSettings,
}) => {
  const [settings, setSettings] = useState<AdSettings>(() => ({
    ...DEFAULT_AD_SETTINGS,
    ...adSettings,
    slots: {
      ...DEFAULT_AD_SETTINGS.slots,
      ...(adSettings?.slots || {}),
    },
  }));

  const [activeSlotId, setActiveSlotId] = useState<string>('top_leaderboard');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGlobalToggle = () => {
    const updated = { ...settings, globalAdsEnabled: !settings.globalAdsEnabled };
    setSettings(updated);
    onSaveAdSettings(updated);
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveAdSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSlotChange = (slotId: string, field: keyof AdBannerSlot, val: any) => {
    setSettings((prev) => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotId]: {
          ...prev.slots[slotId],
          [field]: val,
        },
      },
    }));
  };

  const handleApplyPreset = (preset: typeof SAMPLE_BANNER_PRESETS[0]) => {
    if (!activeSlot) return;
    setSettings((prev) => ({
      ...prev,
      slots: {
        ...prev.slots,
        [activeSlotId]: {
          ...prev.slots[activeSlotId],
          imageUrl: preset.imageUrl,
          title: preset.title,
          subtitle: preset.subtitle,
          badge: preset.badge,
        },
      },
    }));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all advertising banners and AdSense settings to default?')) {
      setSettings(DEFAULT_AD_SETTINGS);
      onSaveAdSettings(DEFAULT_AD_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const activeSlot = settings.slots[activeSlotId] || Object.values(settings.slots)[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Master Switch */}
      <div className="bg-[#121622] border border-[#232B3E] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Google AdSense & Ad Banners Manager</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1B2232] text-amber-400 border border-[#2B364C]">
                اشتہارات و بینرز
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Place Google AdSense ad units or custom promotional image banners with links across your store.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleGlobalToggle}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all border flex items-center gap-2 cursor-pointer ${
              settings.globalAdsEnabled
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-950/50'
                : 'bg-[#1C2230] text-slate-400 border-[#2D374D]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.globalAdsEnabled ? 'bg-black animate-pulse' : 'bg-slate-500'}`} />
            <span>{settings.globalAdsEnabled ? 'ADS: ENABLED' : 'ADS: DISABLED'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Ads Settings</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {saveSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2 font-mono">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Advertising & Google AdSense settings saved successfully!</span>
        </div>
      )}

      {/* Global Google AdSense Settings Card */}
      <div className="bg-[#0E121B] border border-[#222A3A] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Global Google AdSense Configuration
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Account ID: {settings.adsensePublisherId || 'None'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Google AdSense Publisher ID:
            </label>
            <input
              type="text"
              placeholder="ca-pub-9876543210987654"
              value={settings.adsensePublisherId}
              onChange={(e) => setSettings({ ...settings, adsensePublisherId: e.target.value })}
              className="w-full bg-[#161B26] border border-[#2A344A] text-amber-300 font-mono text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Find this in your Google AdSense Dashboard (Settings &gt; Account &gt; Account Information).
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Google Auto-Ads Script:
              </label>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enableAutoAds: !settings.enableAutoAds })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors border cursor-pointer ${
                    settings.enableAutoAds
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-[#18202E] text-slate-400 border-[#2A344A]'
                  }`}
                >
                  Auto-Ads: {settings.enableAutoAds ? 'ON' : 'OFF'}
                </button>
                <span className="text-[11px] text-slate-400">
                  Allow Google to place automated ads dynamically across optimal screen areas.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slots Selection Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Select Ad Placement Location to Edit</span>
          </h4>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Banners</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(Object.values(settings.slots) as AdBannerSlot[]).map((slot) => {
            const isSelected = activeSlotId === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setActiveSlotId(slot.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md font-bold'
                    : 'bg-[#0E121B] text-slate-300 border-[#222A3A] hover:bg-[#161B26] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold truncate">{slot.name}</span>
                  <span className={`w-2 h-2 rounded-full ${slot.isEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
                <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-black/80' : 'text-slate-400'}`}>
                  {slot.adType === 'adsense_code' ? '⚡ AdSense' : '🖼 Custom Image'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Slot Detailed Editor Form */}
      {activeSlot && (
        <div className="bg-[#0E121B] border border-[#273248] rounded-xl p-5 sm:p-6 space-y-6 animate-in fade-in">
          
          {/* Slot Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2536] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-base font-bold text-white">{activeSlot.name}</h4>
                <span className="text-[10px] font-mono bg-[#1A2230] text-amber-400 px-2.5 py-0.5 rounded border border-[#2C374E]">
                  {activeSlot.locationLabel}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {activeSlot.dimensions}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSlotChange(activeSlot.id, 'isEnabled', !activeSlot.isEnabled)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors border cursor-pointer ${
                  activeSlot.isEnabled
                    ? 'bg-emerald-500 text-black border-emerald-400'
                    : 'bg-[#18202E] text-slate-400 border-[#2A344A]'
                }`}
              >
                {activeSlot.isEnabled ? 'Slot: ACTIVE (Visible)' : 'Slot: OFF (Hidden)'}
              </button>
            </div>
          </div>

          {/* Ad Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Choose Banner Display Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSlotChange(activeSlot.id, 'adType', 'custom_image_banner')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  activeSlot.adType === 'custom_image_banner'
                    ? 'bg-amber-400 text-black border-amber-300 font-bold shadow'
                    : 'bg-[#141924] text-slate-300 border-[#252E40] hover:text-white'
                }`}
              >
                <ImageIcon className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Custom Image & Link Banner</div>
                  <div className={`text-[10px] ${activeSlot.adType === 'custom_image_banner' ? 'text-black/80' : 'text-slate-400'}`}>
                    Upload / set banner image with direct WhatsApp or page link
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSlotChange(activeSlot.id, 'adType', 'adsense_code')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  activeSlot.adType === 'adsense_code'
                    ? 'bg-amber-400 text-black border-amber-300 font-bold shadow'
                    : 'bg-[#141924] text-slate-300 border-[#252E40] hover:text-white'
                }`}
              >
                <Code2 className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Google AdSense / Custom Script</div>
                  <div className={`text-[10px] ${activeSlot.adType === 'adsense_code' ? 'text-black/80' : 'text-slate-400'}`}>
                    Insert Google AdSense ad slot or custom HTML advertisement code
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields for Google AdSense */}
          {activeSlot.adType === 'adsense_code' ? (
            <div className="space-y-4 bg-[#080B10] p-4 rounded-xl border border-[#1E2536]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Google AdSense Ad Slot ID:
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    value={activeSlot.adsenseSlot || ''}
                    onChange={(e) => handleSlotChange(activeSlot.id, 'adsenseSlot', e.target.value)}
                    className="w-full bg-[#141924] border border-[#2A344A] text-amber-300 font-mono text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Numeric Ad unit ID generated in your AdSense console.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ad Client ID (ca-pub-XXXXXXXX):
                  </label>
                  <input
                    type="text"
                    placeholder={settings.adsensePublisherId || 'ca-pub-9876543210987654'}
                    value={activeSlot.adsenseClient || settings.adsensePublisherId || ''}
                    onChange={(e) => handleSlotChange(activeSlot.id, 'adsenseClient', e.target.value)}
                    className="w-full bg-[#141924] border border-[#2A344A] text-amber-300 font-mono text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Raw AdSense Snippet / Custom HTML Code:
                </label>
                <textarea
                  rows={5}
                  value={activeSlot.adsenseCustomCode || ''}
                  onChange={(e) => handleSlotChange(activeSlot.id, 'adsenseCustomCode', e.target.value)}
                  className="w-full bg-[#05070B] border border-[#2A344A] text-amber-300 font-mono text-xs p-3 rounded-lg outline-none focus:border-amber-400"
                  placeholder='<ins class="adsbygoogle" style="display:block" data-ad-client="..." data-ad-slot="..."></ins>'
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Paste the exact snippet provided by Google AdSense for this slot.
                </p>
              </div>
            </div>
          ) : (
            /* Form Fields for Custom Image & Link Banner */
            <div className="space-y-4">
              
              {/* Quick Pick Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick-Pick Preset Workshop Banners:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 bg-[#161B26] hover:bg-[#202738] text-slate-300 hover:text-amber-300 text-[11px] font-sans rounded-lg border border-[#2A344A] transition-colors cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Banner Background Image URL:
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={activeSlot.imageUrl || ''}
                  onChange={(e) => handleSlotChange(activeSlot.id, 'imageUrl', e.target.value)}
                  className="w-full bg-[#141924] border border-[#2A344A] text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Banner Main Headline / Promotion Title:
                  </label>
                  <input
                    type="text"
                    placeholder="SPECIAL CONTRACTOR MEGA SALE..."
                    value={activeSlot.title || ''}
                    onChange={(e) => handleSlotChange(activeSlot.id, 'title', e.target.value)}
                    className="w-full bg-[#141924] border border-[#2A344A] text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Badge Tag Label:
                  </label>
                  <input
                    type="text"
                    placeholder="SPONSORED / AD"
                    value={activeSlot.badge || ''}
                    onChange={(e) => handleSlotChange(activeSlot.id, 'badge', e.target.value)}
                    className="w-full bg-[#141924] border border-[#2A344A] text-amber-300 font-mono text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Banner Subtitle / Description Copy:
                </label>
                <input
                  type="text"
                  placeholder="Official Rawal Tools Direct Factory Clearance • Nationwide COD Delivery"
                  value={activeSlot.subtitle || ''}
                  onChange={(e) => handleSlotChange(activeSlot.id, 'subtitle', e.target.value)}
                  className="w-full bg-[#141924] border border-[#2A344A] text-slate-300 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Click Destination Link / WhatsApp URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://wa.me/923001234567 or /#catalog"
                    value={activeSlot.targetUrl || ''}
                    onChange={(e) => handleSlotChange(activeSlot.id, 'targetUrl', e.target.value)}
                    className="w-full bg-[#141924] border border-[#2A344A] text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeSlot.openInNewTab}
                      onChange={(e) => handleSlotChange(activeSlot.id, 'openInNewTab', e.target.checked)}
                      className="accent-amber-400 w-4 h-4"
                    />
                    <span>Open link in new browser tab</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Banner Preview:</span>
                </label>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 p-5 text-white min-h-[110px] flex items-center justify-between">
                  <img
                    src={activeSlot.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80'}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                  <div className="relative z-10 space-y-1 max-w-xl">
                    <span className="text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-amber-400 text-black">
                      {activeSlot.badge || 'ADVERTISEMENT'}
                    </span>
                    <h5 className="font-black text-sm sm:text-base leading-tight mt-1">
                      {activeSlot.title || 'Banner Title Goes Here'}
                    </h5>
                    <p className="text-xs text-slate-300 line-clamp-1">{activeSlot.subtitle || 'Subtext description copy'}</p>
                  </div>
                  <div className="relative z-10 shrink-0 hidden sm:block">
                    <span className="px-4 py-2 bg-amber-400 text-black font-bold text-xs rounded-lg shadow">
                      Learn More &rarr;
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2536]">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save {activeSlot.name}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
