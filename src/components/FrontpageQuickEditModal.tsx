import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Edit3, 
  Sparkles, 
  Layout, 
  FileText, 
  Layers, 
  ShoppingBag, 
  Info, 
  Phone,
  RotateCcw
} from 'lucide-react';
import { PageContent, StoreSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { DEFAULT_PAGE_CONTENT } from '../data/defaultPageContent';

interface FrontpageQuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContent: PageContent;
  settings: StoreSettings;
  theme?: ThemeId;
  onSaveContent: (newContent: PageContent) => void;
  onSaveSettings: (newSettings: StoreSettings) => void;
}

export const FrontpageQuickEditModal: React.FC<FrontpageQuickEditModalProps> = ({
  isOpen,
  onClose,
  pageContent,
  settings,
  theme = 'industrial_yellow',
  onSaveContent,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const [formData, setFormData] = useState<PageContent>({ ...pageContent });
  const [storeData, setStoreData] = useState<StoreSettings>({ ...settings });
  const [activeSection, setActiveSection] = useState<'hero' | 'banners' | 'categories' | 'catalog' | 'footer' | 'store'>('hero');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (field: keyof PageContent, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleStoreFieldChange = (field: keyof StoreSettings, val: any) => {
    setStoreData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContent(formData);
    onSaveSettings(storeData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all frontpage text content back to default values?')) {
      setFormData({ ...DEFAULT_PAGE_CONTENT });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="relative bg-[#0F0F0F] border-2 border-amber-400/80 rounded-none w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-[#F5F5F5] flex flex-col my-auto animate-in zoom-in-95">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0F0F0F]/95 backdrop-blur-md px-6 py-4 border-b border-[#262626] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-black flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Front Page Text & Content Editor</span>
                <span className="text-xs bg-amber-400/20 text-amber-300 font-mono px-2 py-0.5 border border-amber-400/40">
                  صفحہ کا تمام ٹیکسٹ
                </span>
              </h3>
              <p className="text-xs font-mono text-[#888]">
                Edit any headlines, tags, subtext, promotions & banner copy displayed on the front page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaults}
              className="text-xs font-mono text-[#888] hover:text-white px-2.5 py-1.5 border border-[#333] hover:border-[#555] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset default texts"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#777] hover:text-white bg-[#181818] border border-[#333] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Navigation Menu Tabs */}
        <div className="bg-black p-3 border-b border-[#262626] flex items-center gap-2 overflow-x-auto text-xs font-mono">
          {[
            { id: 'hero', label: '1. Hero Showcase (مین بینر)', icon: Sparkles },
            { id: 'banners', label: '2. Clearance & Promo Banners', icon: Layout },
            { id: 'categories', label: '3. Category & Size Showcase', icon: Layers },
            { id: 'catalog', label: '4. Catalog Grid Heading', icon: ShoppingBag },
            { id: 'footer', label: '5. Footer & About Info', icon: Info },
            { id: 'store', label: '6. Store Brand & WhatsApp', icon: Phone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-3 uppercase tracking-wider font-bold text-xs transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                    : 'bg-[#141414] text-[#AAA] border-[#2A2A2A] hover:text-white hover:border-[#555]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAll} className="p-6 space-y-6 flex-1">
          
          {/* SECTION 1: HERO SHOWCASE */}
          {activeSection === 'hero' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-[#222] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Hero Showcase Copy & Headlines (مین ہیڈر اور نعرہ)
                </h4>
                <p className="text-xs text-[#777] font-mono mt-0.5">
                  The primary visual section at the top of the homepage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                    Top Announcement / Highlight Badge
                  </label>
                  <input
                    type="text"
                    value={formData.heroBadge || ''}
                    onChange={(e) => handleFieldChange('heroBadge', e.target.value)}
                    className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none font-mono"
                    placeholder="e.g. INDUSTRIAL TOOLS SHOWROOM 2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                    Hero Headline - Line 1 (Accent Color) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.heroHeadline1 || ''}
                    onChange={(e) => handleFieldChange('heroHeadline1', e.target.value)}
                    className="w-full bg-[#141414] text-amber-400 font-bold text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none font-sans"
                    placeholder="e.g. ENGINEERING GRADE"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                    Hero Headline - Line 2 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.heroHeadline2 || ''}
                    onChange={(e) => handleFieldChange('heroHeadline2', e.target.value)}
                    className="w-full bg-[#141414] text-white font-bold text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none font-sans"
                    placeholder="e.g. INDUSTRIAL POWER TOOLS"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                    Hero Description / Subheadline *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.heroSubheadline || ''}
                    onChange={(e) => handleFieldChange('heroSubheadline', e.target.value)}
                    className="w-full bg-[#141414] text-white text-sm p-3 border border-[#333] focus:border-amber-400 outline-none font-sans leading-relaxed"
                    placeholder="Pakistan's premier showroom for high-torque rotary hammers, angle grinders, inverter welding plants..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROMO & CLEARANCE BANNERS */}
          {activeSection === 'banners' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-[#222] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Clearance, Heavy-Duty & Deal Banners (پرو موشنز اور بینرز)
                </h4>
                <p className="text-xs text-[#777] font-mono mt-0.5">
                  The high-converting Bewakoof / modern retail story cards.
                </p>
              </div>

              {/* Banner 1: High Torque Grinders */}
              <div className="bg-[#141414] p-4 border border-[#262626] space-y-3">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                  Card #1 (Left Big Promo Card)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Tag / Badge</label>
                    <input
                      type="text"
                      value={formData.banner1Tag || ''}
                      onChange={(e) => handleFieldChange('banner1Tag', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Card Title</label>
                    <input
                      type="text"
                      value={formData.banner1Title || ''}
                      onChange={(e) => handleFieldChange('banner1Title', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Subtitle / Deal Offer</label>
                    <input
                      type="text"
                      value={formData.banner1Subtext || ''}
                      onChange={(e) => handleFieldChange('banner1Subtext', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Banner 2: Heavy Duty SDS */}
              <div className="bg-[#141414] p-4 border border-[#262626] space-y-3">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                  Card #2 (Middle Promo Card)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Tag / Badge</label>
                    <input
                      type="text"
                      value={formData.banner2Tag || ''}
                      onChange={(e) => handleFieldChange('banner2Tag', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Card Title</label>
                    <input
                      type="text"
                      value={formData.banner2Title || ''}
                      onChange={(e) => handleFieldChange('banner2Title', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Subtitle / Deal Offer</label>
                    <input
                      type="text"
                      value={formData.banner2Subtext || ''}
                      onChange={(e) => handleFieldChange('banner2Subtext', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Banner 3: Inverter Welders */}
              <div className="bg-[#141414] p-4 border border-[#262626] space-y-3">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                  Card #3 (Right Promo Card)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Tag / Badge</label>
                    <input
                      type="text"
                      value={formData.banner3Tag || ''}
                      onChange={(e) => handleFieldChange('banner3Tag', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Card Title</label>
                    <input
                      type="text"
                      value={formData.banner3Title || ''}
                      onChange={(e) => handleFieldChange('banner3Title', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Subtitle / Deal Offer</label>
                    <input
                      type="text"
                      value={formData.banner3Subtext || ''}
                      onChange={(e) => handleFieldChange('banner3Subtext', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* VIP Commercial Strip */}
              <div className="bg-[#141414] p-4 border border-[#262626] space-y-3">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase">
                  VIP Commercial Bulk Quotation Strip
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Tag</label>
                    <input
                      type="text"
                      value={formData.vipTag || ''}
                      onChange={(e) => handleFieldChange('vipTag', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.vipTitle || ''}
                      onChange={(e) => handleFieldChange('vipTitle', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">Subtext / Details</label>
                    <input
                      type="text"
                      value={formData.vipSubtext || ''}
                      onChange={(e) => handleFieldChange('vipSubtext', e.target.value)}
                      className="w-full bg-[#0A0A0A] text-xs text-white px-3 py-2 border border-[#333] focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: CATEGORY SHOWCASE */}
          {activeSection === 'categories' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-[#222] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Category & Size Selection Showcase Header (کیٹگری سیکشن)
                </h4>
                <p className="text-xs text-[#777] font-mono mt-0.5">
                  Heading and descriptions for the category filter section.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                  Section Main Heading
                </label>
                <input
                  type="text"
                  value={formData.categoryHeading || 'Shop by Category & Size'}
                  onChange={(e) => handleFieldChange('categoryHeading', e.target.value)}
                  className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none font-bold"
                  placeholder="e.g. Shop by Category & Size"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                  Section Subheading
                </label>
                <input
                  type="text"
                  value={formData.categorySubheading || 'Explore tools by industrial category and select required size variant.'}
                  onChange={(e) => handleFieldChange('categorySubheading', e.target.value)}
                  className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none"
                  placeholder="e.g. Explore tools by industrial category..."
                />
              </div>
            </div>
          )}

          {/* SECTION 4: CATALOG GRID */}
          {activeSection === 'catalog' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-[#222] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Catalog & Products Grid Heading (پراڈکٹ کیٹلاگ ہیڈنگ)
                </h4>
                <p className="text-xs text-[#777] font-mono mt-0.5">
                  The header displayed above the product listings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                  Catalog Section Main Heading
                </label>
                <input
                  type="text"
                  value={formData.catalogHeading || 'Industrial Equipment & Machinery'}
                  onChange={(e) => handleFieldChange('catalogHeading', e.target.value)}
                  className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                  Catalog Subheading
                </label>
                <input
                  type="text"
                  value={formData.catalogSubheading || 'Direct quotation, wholesale pricing and instant nationwide dispatch via official WhatsApp.'}
                  onChange={(e) => handleFieldChange('catalogSubheading', e.target.value)}
                  className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* SECTION 5: FOOTER & ABOUT */}
          {activeSection === 'footer' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-[#222] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Footer & About Showroom (فوٹر اور تعارف)
                </h4>
                <p className="text-xs text-[#777] font-mono mt-0.5">
                  About showroom description and dispatch details shown at the bottom of the page.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">
                  About Store Paragraph
                </label>
                <textarea
                  rows={4}
                  value={formData.footerAboutText || ''}
                  onChange={(e) => handleFieldChange('footerAboutText', e.target.value)}
                  className="w-full bg-[#141414] text-white text-sm p-3 border border-[#333] focus:border-amber-400 outline-none font-sans leading-relaxed"
                  placeholder="Pakistan's premier industrial showcase for precision rotary tools, industrial angle grinders, heavy duty sockets..."
                />
              </div>
            </div>
          )}

          {/* SECTION 6: STORE BRAND & WHATSAPP */}
          {activeSection === 'store' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-[#222] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Store Brand Name, Tagline & WhatsApp Contacts
                </h4>
                <p className="text-xs text-[#777] font-mono mt-0.5">
                  Store identity and primary inquiry phone numbers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">Store / Brand Name</label>
                  <input
                    type="text"
                    value={storeData.storeName}
                    onChange={(e) => handleStoreFieldChange('storeName', e.target.value)}
                    className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={storeData.tagline}
                    onChange={(e) => handleStoreFieldChange('tagline', e.target.value)}
                    className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">WhatsApp Number (with country code)</label>
                  <input
                    type="text"
                    value={storeData.whatsappNumber}
                    onChange={(e) => handleStoreFieldChange('whatsappNumber', e.target.value)}
                    className="w-full bg-[#141414] text-emerald-400 font-mono text-sm px-3.5 py-2.5 border border-[#333] focus:border-emerald-400 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">Display Phone</label>
                  <input
                    type="text"
                    value={storeData.phoneDisplay}
                    onChange={(e) => handleStoreFieldChange('phoneDisplay', e.target.value)}
                    className="w-full bg-[#141414] text-white font-mono text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#AAA] mb-1">Shop Address & City</label>
                  <input
                    type="text"
                    value={storeData.address}
                    onChange={(e) => handleStoreFieldChange('address', e.target.value)}
                    className="w-full bg-[#141414] text-white text-sm px-3.5 py-2.5 border border-[#333] focus:border-amber-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="sticky bottom-0 bg-[#0F0F0F] pt-4 border-t border-[#262626] flex items-center justify-between gap-4 font-mono">
            <div>
              {saveSuccess ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>All Frontpage Texts Updated Successfully! (تمام تبدیلیاں محفوظ ہو گئیں)</span>
                </span>
              ) : (
                <span className="text-xs text-[#888]">
                  Clicking Save updates text across the entire homepage instantly.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#282828] text-white text-xs uppercase tracking-wider border border-[#333] cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save All Text Changes (محفوظ کریں)</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
