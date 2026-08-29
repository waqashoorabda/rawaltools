import React, { useState } from 'react';
import { 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Check, 
  Layout, 
  Type, 
  Sparkles, 
  Layers, 
  Zap, 
  Tag, 
  Truck, 
  MessageCircle,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { PageContent, StoreSettings } from '../types';
import { DEFAULT_PAGE_CONTENT } from '../data/defaultPageContent';

interface AdminPageEditorViewProps {
  pageContent: PageContent;
  onSaveContent: (content: PageContent) => void;
  isVisualEditMode: boolean;
  onToggleVisualEditMode: () => void;
  settings?: StoreSettings;
  onSaveSettings?: (settings: StoreSettings) => void;
}

const SECTION_METADATA: Record<string, { name: string; desc: string; icon: string }> = {
  hero: {
    name: 'Hero Showcase & Workshop Headline',
    desc: 'Main showroom header, collection badge, dynamic greeting, and instant WhatsApp CTA button',
    icon: '⚡',
  },
  promo_banners: {
    name: 'Promotional Offers & Clearance Strip',
    desc: '3-card grid highlighting Power Tools, Big Clearance Zone, and Inverter Arc Welders',
    icon: '🏷️',
  },
  vip_strip: {
    name: 'VIP Contractor & Nationwide Cargo Strip',
    desc: 'Yellow VIP discount corner and 24-48h Pakistan Cargo dispatch trust banners',
    icon: '🚚',
  },
  catalog: {
    name: 'Interactive Catalog & Product Grid',
    desc: 'Product search, brand & category filters, specification sheets, and quote buttons',
    icon: '🛠️',
  },
  articles: {
    name: 'Technical Articles & Workshop Guides',
    desc: 'Power tool maintenance tips, buying guides, and technical insights on the homepage',
    icon: '📚',
  },
};

export const AdminPageEditorView: React.FC<AdminPageEditorViewProps> = ({
  pageContent,
  onSaveContent,
  isVisualEditMode,
  onToggleVisualEditMode,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<PageContent>({ ...pageContent });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFieldChange = (field: keyof PageContent, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...formData.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setFormData((prev) => ({
      ...prev,
      sectionOrder: newOrder,
    }));
  };

  const handleToggleHideSection = (sectionId: string) => {
    const isHidden = formData.hiddenSections.includes(sectionId);
    let updatedHidden: string[];

    if (isHidden) {
      updatedHidden = formData.hiddenSections.filter((id) => id !== sectionId);
    } else {
      updatedHidden = [...formData.hiddenSections, sectionId];
    }

    setFormData((prev) => ({
      ...prev,
      hiddenSections: updatedHidden,
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...formData.sectionOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setFormData((prev) => ({
      ...prev,
      sectionOrder: newOrder,
    }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContent(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all page text and section layouts to default?')) {
      setFormData({ ...DEFAULT_PAGE_CONTENT });
      onSaveContent({ ...DEFAULT_PAGE_CONTENT });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 font-sans text-slate-100">
      
      {/* Top Banner Notice & Live Visual Editor Toggle */}
      <div className="bg-[#141822] p-5 rounded-xl border border-[#262D3D] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white font-sans">
              Frontend Page Customizer & Drag-and-Drop Editor
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Rearrange sections, toggle visibility, and update all headlines & banners with instant live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Visual Edit Mode Toggle */}
          <button
            type="button"
            onClick={onToggleVisualEditMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm cursor-pointer ${
              isVisualEditMode
                ? 'bg-amber-400 text-black hover:bg-amber-300 ring-2 ring-amber-400/50'
                : 'bg-[#1B2232] hover:bg-[#263148] text-slate-200 border border-slate-700'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>{isVisualEditMode ? '✓ Visual Inline Editor Active' : 'Enable Inline Click-to-Edit'}</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Changes Saved!' : 'Save Page Content'}</span>
          </button>
        </div>
      </div>

      {/* 1. Drag & Drop Section Ordering */}
      <div className="bg-[#141822] p-5 rounded-xl border border-[#262D3D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-sans">
              1. Homepage Section Order & Visibility (Drag to Arrange)
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Grab handle ⠿ or use ↑ / ↓ buttons to reposition
          </span>
        </div>

        <div className="space-y-2.5">
          {formData.sectionOrder.map((sectionId, index) => {
            const meta = SECTION_METADATA[sectionId] || { name: sectionId, desc: '', icon: '📄' };
            const isHidden = formData.hiddenSections.includes(sectionId);

            return (
              <div
                key={sectionId}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  draggedIndex === index
                    ? 'bg-amber-500/20 border-amber-400 scale-[1.01]'
                    : isHidden
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-[#181E2B] border-[#2A3347] hover:border-slate-600'
                }`}
              >
                {/* Drag Handle & Section Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <span className="text-lg select-none">{meta.icon}</span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-sans truncate">
                        {meta.name}
                      </span>
                      {isHidden && (
                        <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{meta.desc}</p>
                  </div>
                </div>

                {/* Reorder and Visibility Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-800 rounded transition-colors"
                    title="Move Section Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveSection(index, 'down')}
                    disabled={index === formData.sectionOrder.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-800 rounded transition-colors"
                    title="Move Section Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHideSection(sectionId)}
                    className={`p-1.5 rounded transition-colors ${
                      isHidden 
                        ? 'text-rose-400 hover:bg-rose-950/40' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isHidden ? 'Show Section on Homepage' : 'Hide Section from Homepage'}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Frontpage Articles Visibility Quick Control */}
        {settings && onSaveSettings && (
          <div className="pt-3 border-t border-[#232B3E] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Technical Articles & Blog Section on Front Page:</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    settings.showArticlesOnFrontpage
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {settings.showArticlesOnFrontpage ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {settings.showArticlesOnFrontpage
                    ? 'Articles are currently shown on the storefront homepage.'
                    : 'Articles are hidden from the storefront homepage.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const updated = !settings.showArticlesOnFrontpage;
                onSaveSettings({ ...settings, showArticlesOnFrontpage: updated });
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                settings.showArticlesOnFrontpage
                  ? 'bg-[#331818] hover:bg-[#4A1E1E] text-rose-300 border border-rose-500/50'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-400 font-black'
              }`}
            >
              {settings.showArticlesOnFrontpage ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Articles From Front Page</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show Articles On Front Page</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. Headline & Announcement Bar Text */}
      <div className="bg-[#141822] p-5 rounded-xl border border-[#262D3D] space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white font-sans">
            2. Hero Showcase & Announcement Bar Texts
          </h4>
        </div>

        <div className="space-y-3 text-xs font-sans">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Top Announcement Marquee Bar:</label>
            <input
              type="text"
              value={formData.announcementText}
              onChange={(e) => handleFieldChange('announcementText', e.target.value)}
              className="w-full bg-[#181E2B] text-white px-3 py-2 rounded-lg border border-[#2A3347] focus:border-amber-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Hero Small Badge / Year:</label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={(e) => handleFieldChange('heroBadge', e.target.value)}
                className="w-full bg-[#181E2B] text-white px-3 py-2 rounded-lg border border-[#2A3347] focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Primary Brand Highlight (Yellow text):</label>
              <input
                type="text"
                value={formData.heroHeadline1}
                onChange={(e) => handleFieldChange('heroHeadline1', e.target.value)}
                className="w-full bg-[#181E2B] text-white px-3 py-2 rounded-lg border border-[#2A3347] focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Secondary Main Headline:</label>
              <input
                type="text"
                value={formData.heroHeadline2}
                onChange={(e) => handleFieldChange('heroHeadline2', e.target.value)}
                className="w-full bg-[#181E2B] text-white px-3 py-2 rounded-lg border border-[#2A3347] focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Catalog Section Header:</label>
              <input
                type="text"
                value={formData.catalogHeading}
                onChange={(e) => handleFieldChange('catalogHeading', e.target.value)}
                className="w-full bg-[#181E2B] text-white px-3 py-2 rounded-lg border border-[#2A3347] focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Hero Subtitle / Description:</label>
            <textarea
              rows={2}
              value={formData.heroSubheadline}
              onChange={(e) => handleFieldChange('heroSubheadline', e.target.value)}
              className="w-full bg-[#181E2B] text-white px-3 py-2 rounded-lg border border-[#2A3347] focus:border-amber-400 outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Promotional Banners Content */}
      <div className="bg-[#141822] p-5 rounded-xl border border-[#262D3D] space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white font-sans">
            3. Promotional 3-Grid Banners Content
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          
          {/* Banner 1 */}
          <div className="p-3.5 rounded-xl bg-[#181E2B] border border-[#2A3347] space-y-2.5">
            <span className="font-bold text-amber-400 text-xs block">Banner 1: Power Collection</span>
            <div>
              <label className="text-[11px] text-slate-400 block">Tag Badge:</label>
              <input
                type="text"
                value={formData.banner1Tag}
                onChange={(e) => handleFieldChange('banner1Tag', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Title:</label>
              <input
                type="text"
                value={formData.banner1Title}
                onChange={(e) => handleFieldChange('banner1Title', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Subtext:</label>
              <input
                type="text"
                value={formData.banner1Subtext}
                onChange={(e) => handleFieldChange('banner1Subtext', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs"
              />
            </div>
          </div>

          {/* Banner 2 */}
          <div className="p-3.5 rounded-xl bg-[#181E2B] border border-[#2A3347] space-y-2.5">
            <span className="font-bold text-yellow-400 text-xs block">Banner 2: Clearance Zone</span>
            <div>
              <label className="text-[11px] text-slate-400 block">Tag Badge:</label>
              <input
                type="text"
                value={formData.banner2Tag}
                onChange={(e) => handleFieldChange('banner2Tag', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Title:</label>
              <input
                type="text"
                value={formData.banner2Title}
                onChange={(e) => handleFieldChange('banner2Title', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Subtext:</label>
              <input
                type="text"
                value={formData.banner2Subtext}
                onChange={(e) => handleFieldChange('banner2Subtext', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs"
              />
            </div>
          </div>

          {/* Banner 3 */}
          <div className="p-3.5 rounded-xl bg-[#181E2B] border border-[#2A3347] space-y-2.5">
            <span className="font-bold text-cyan-400 text-xs block">Banner 3: Inverter Welders</span>
            <div>
              <label className="text-[11px] text-slate-400 block">Tag Badge:</label>
              <input
                type="text"
                value={formData.banner3Tag}
                onChange={(e) => handleFieldChange('banner3Tag', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Title:</label>
              <input
                type="text"
                value={formData.banner3Title}
                onChange={(e) => handleFieldChange('banner3Title', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Subtext:</label>
              <input
                type="text"
                value={formData.banner3Subtext}
                onChange={(e) => handleFieldChange('banner3Subtext', e.target.value)}
                className="w-full bg-[#141822] text-white p-1.5 rounded border border-slate-700 text-xs"
              />
            </div>
          </div>

        </div>
      </div>

      {/* 4. VIP Contractor Strip & Nationwide Cargo */}
      <div className="bg-[#141822] p-5 rounded-xl border border-[#262D3D] space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white font-sans">
            4. VIP Contractor Strip & Nationwide Cargo Banners
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-3.5 rounded-xl bg-[#181E2B] border border-[#2A3347] space-y-2">
            <span className="font-bold text-yellow-400 block">VIP Discount Corner:</span>
            <input
              type="text"
              value={formData.vipTitle}
              onChange={(e) => handleFieldChange('vipTitle', e.target.value)}
              placeholder="VIP Title"
              className="w-full bg-[#141822] text-white p-2 rounded border border-slate-700 font-bold"
            />
            <input
              type="text"
              value={formData.vipSubtext}
              onChange={(e) => handleFieldChange('vipSubtext', e.target.value)}
              placeholder="VIP Subtext"
              className="w-full bg-[#141822] text-white p-2 rounded border border-slate-700"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#181E2B] border border-[#2A3347] space-y-2">
            <span className="font-bold text-indigo-400 block">Cargo Delivery Bar:</span>
            <input
              type="text"
              value={formData.cargoTitle}
              onChange={(e) => handleFieldChange('cargoTitle', e.target.value)}
              placeholder="Cargo Title"
              className="w-full bg-[#141822] text-white p-2 rounded border border-slate-700 font-bold"
            />
            <input
              type="text"
              value={formData.cargoSubtext}
              onChange={(e) => handleFieldChange('cargoSubtext', e.target.value)}
              placeholder="Cargo Subtext"
              className="w-full bg-[#141822] text-white p-2 rounded border border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Footer Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Text & Layout to Defaults</span>
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Page Content Saved!' : 'Save All Page Changes'}</span>
        </button>
      </div>

    </form>
  );
};
