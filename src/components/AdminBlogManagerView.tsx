import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  Check, 
  RotateCcw, 
  Heading1, 
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Layers, 
  Save, 
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Upload
} from 'lucide-react';
import { BlogPost, Product, StoreSettings } from '../types';
import { DEFAULT_BLOG_POSTS } from '../data/defaultBlogPosts';
import { compressImage } from '../utils/imageUpload';

interface AdminBlogManagerViewProps {
  posts?: BlogPost[];
  products?: Product[];
  settings?: StoreSettings;
  onSavePosts?: (newPosts: BlogPost[]) => void;
  onSaveSettings?: (settings: StoreSettings) => void;
  initialEditingPostId?: string;
}

export const AdminBlogManagerView: React.FC<AdminBlogManagerViewProps> = ({
  posts = [],
  products = [],
  settings,
  onSavePosts,
  onSaveSettings,
  initialEditingPostId,
}) => {
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const [localPosts, setLocalPosts] = useState<BlogPost[]>(safePosts);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(() => {
    if (initialEditingPostId) {
      return safePosts.find((p) => p.id === initialEditingPostId) || null;
    }
    return null;
  });
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [coverCompressionStatus, setCoverCompressionStatus] = useState<string | null>(null);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingPost) return;

    setIsUploadingCover(true);
    setCoverCompressionStatus(null);
    try {
      const result = await compressImage(files[0], {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.80,
      });
      setEditingPost({ ...editingPost, coverImage: result.dataUrl });
      setCoverCompressionStatus(`⚡ Cover photo optimized: ${result.reductionLabel}`);
      setTimeout(() => setCoverCompressionStatus(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error uploading cover image.');
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (Array.isArray(posts)) {
      setLocalPosts(posts);
      if (initialEditingPostId) {
        const found = posts.find((p) => p.id === initialEditingPostId);
        if (found) setEditingPost(found);
      }
    }
  }, [posts, initialEditingPostId]);

  // Suggested tool photos for quick click selection
  const PHOTO_PRESETS = [
    { label: 'Welding & Arc Plants', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Heavy Rotary Drills', url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Angle Grinder Metal Spark', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Precision Drill Bits & Steel', url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Welder Safety Helmet', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Industrial Machine Workshop', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80' },
  ];

  const handleStartNew = () => {
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      title: 'New Industrial Workshop Guide & Tool Insights',
      slug: `guide-${Date.now().toString().slice(-4)}`,
      excerpt: 'Comprehensive overview of machinery operation, maintenance best practices, and safety instructions.',
      author: 'Rawal Tools Technical Desk',
      category: 'Power Tools',
      tags: ['Industrial Tools', 'Workshop Guide', 'Hardware'],
      coverImage: PHOTO_PRESETS[0].url,
      publishedAt: new Date().toISOString().slice(0, 10),
      isPublished: true,
      readTimeMinutes: 4,
      featuredProductId: safeProducts[0]?.id || '',
      content: `### 1. Overview of Workshop Equipment

Selecting the right industrial machinery requires verifying motor copper windings, electrical load limits, and duty cycle ratings.

### 2. Operational Safety Guidelines
* Always wear certified auto-darkening eye protection.
* Secure workpieces with high-tensile steel bench vices.
* Clean rear motor air vents daily with dry compressed air.

### 3. Recommended Tools:
Connect with Rawal Tools technical specialists for customized enterprise tooling quotes.`,
    };
    setEditingPost(newPost);
    setIsPreviewMode(false);
  };

  const handleSaveCurrentPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    let updated: BlogPost[];
    const exists = localPosts.some((p) => p.id === editingPost.id);
    if (exists) {
      updated = localPosts.map((p) => (p.id === editingPost.id ? editingPost : p));
    } else {
      updated = [editingPost, ...localPosts];
    }

    setLocalPosts(updated);
    if (onSavePosts) onSavePosts(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    setEditingPost(null);
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Delete this article? This action cannot be undone.')) {
      const updated = localPosts.filter((p) => p.id !== id);
      setLocalPosts(updated);
      onSavePosts(updated);
      if (editingPost?.id === id) setEditingPost(null);
    }
  };

  const handleTogglePublish = (id: string) => {
    const updated = localPosts.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p));
    setLocalPosts(updated);
    onSavePosts(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all blog articles back to initial default database?')) {
      setLocalPosts(DEFAULT_BLOG_POSTS);
      onSavePosts(DEFAULT_BLOG_POSTS);
      setEditingPost(null);
    }
  };

  // Rich Formatting Inserters
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!editingPost) return;
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = editingPost.content;
    const selected = currentText.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
    setEditingPost({ ...editingPost, content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black px-4 py-2 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-3">
          <Check className="w-4 h-4" />
          <span>Article Saved to Knowledge Base! (آرٹیکل محفوظ ہو گیا)</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-[#0E121B] border border-[#273248] rounded-xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-400 text-black flex items-center justify-center font-bold rounded-lg shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Articles & Blog CMS Manager</span>
              <span className="text-xs bg-amber-400/20 text-amber-300 font-mono px-2 py-0.5 border border-amber-400/40">
                {localPosts.length} Articles Live
              </span>
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Publish technical power tool guides, maintenance tips, and welder reviews with embedded store products.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {editingPost ? (
            <button
              type="button"
              onClick={() => setEditingPost(null)}
              className="px-3.5 py-2 bg-[#1B2232] hover:bg-[#252E42] text-slate-200 border border-[#2F3B54] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Articles List</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 text-slate-400 hover:text-white border border-[#2A3448] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset to default articles"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleStartNew}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Write New Article</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Front Page Visibility Control Banner (Hide / Show Articles from Front Page) */}
      {settings && onSaveSettings && (
        <div className={`rounded-xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
          settings.showArticlesOnFrontpage
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : 'bg-amber-950/40 border-amber-500/40'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-lg ${
              settings.showArticlesOnFrontpage
                ? 'bg-emerald-500 text-black'
                : 'bg-amber-500 text-black'
            }`}>
              {settings.showArticlesOnFrontpage ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white font-sans">
                  Homepage Articles Section: {settings.showArticlesOnFrontpage ? (
                    <span className="text-emerald-400">VISIBLE ON FRONT PAGE</span>
                  ) : (
                    <span className="text-amber-400">HIDDEN FROM FRONT PAGE</span>
                  )}
                </h4>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  settings.showArticlesOnFrontpage
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {settings.showArticlesOnFrontpage ? 'Status: Shown' : 'Status: Hidden'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1">
                {settings.showArticlesOnFrontpage
                  ? 'The articles section is currently displayed on the storefront front page for visitors.'
                  : 'Articles are completely hidden from the storefront front page. Visitors can still read them via direct article links or footer links.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const updated = !settings.showArticlesOnFrontpage;
              onSaveSettings({ ...settings, showArticlesOnFrontpage: updated });
            }}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
              settings.showArticlesOnFrontpage
                ? 'bg-[#3A1414] hover:bg-[#521C1C] text-rose-300 border border-rose-500/50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-400 font-black'
            }`}
          >
            {settings.showArticlesOnFrontpage ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Hide From Front Page (صفحہ اول سے چھپائیں)</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Show On Front Page (صفحہ اول پر دکھائیں)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* MAIN VIEW: EITHER LIST OR FULL CMS EDITOR */}
      {editingPost ? (
        /* Full Article Editor */
        <form onSubmit={handleSaveCurrentPost} className="space-y-6">
          
          <div className="bg-[#0E121B] border border-[#273248] rounded-xl p-5 sm:p-6 space-y-5">
            
            {/* Editor Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <span>Article ID: <strong className="text-white">{editingPost.id}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPreviewMode 
                      ? 'bg-amber-400 text-black border-amber-300 shadow-sm' 
                      : 'bg-[#181F2E] text-slate-200 border-[#2D3952] hover:bg-[#232D42]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isPreviewMode ? '✏️ Edit Mode' : '👁️ Live Preview'}</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Article</span>
                </button>
              </div>
            </div>

            {/* Primary Article Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Article Title (مضمون کا عنوان):
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  placeholder="e.g. Complete Guide: Choosing the Best Inverter Welder..."
                  className="w-full p-2.5 text-sm font-bold bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Category:
                </label>
                <select
                  value={editingPost.category}
                  onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                  className="w-full p-2.5 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="Welding & Fabrication">Welding & Fabrication</option>
                  <option value="Power Tools">Power Tools & Machinery</option>
                  <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                  <option value="Accessories & Tooling">Accessories & Tooling</option>
                  <option value="Safety & Protocols">Safety & Protocols</option>
                  <option value="Industry News">Industry News</option>
                </select>
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Author Name & Credentials:
                </label>
                <input
                  type="text"
                  value={editingPost.author}
                  onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  placeholder="e.g. Master Usman Ali (Senior Metallurgist)"
                  className="w-full p-2 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Est. Reading Time (Minutes):
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={editingPost.readTimeMinutes}
                  onChange={(e) => setEditingPost({ ...editingPost, readTimeMinutes: parseInt(e.target.value) || 4 })}
                  className="w-full p-2 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Publication Status:
                </label>
                <select
                  value={editingPost.isPublished ? 'published' : 'draft'}
                  onChange={(e) => setEditingPost({ ...editingPost, isPublished: e.target.value === 'published' })}
                  className="w-full p-2 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="published">🟢 Published (Live on Site)</option>
                  <option value="draft">🟡 Draft (Hidden from Visitors)</option>
                </select>
              </div>

              {/* Featured Store Product Connector */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Attach Store Tool to Article (One-Click Cart Widget):</span>
                </label>
                <select
                  value={editingPost.featuredProductId || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, featuredProductId: e.target.value })}
                  className="w-full p-2 text-xs font-mono bg-[#080B10] border border-amber-500/50 text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="">-- No Featured Product Attached --</option>
                  {safeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku || p.id}] {p.name} ({p.hasPrice && p.price ? `${settings?.currencySymbol || 'Rs.'} ${p.price.toLocaleString()}` : 'Quote'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Tags (Comma separated):
                </label>
                <input
                  type="text"
                  value={(editingPost.tags || []).join(', ')}
                  onChange={(e) => setEditingPost({ 
                    ...editingPost, 
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) 
                  })}
                  placeholder="Welding, IGBT, Angle Grinder, Safety"
                  className="w-full p-2 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Cover Image & Presets & Direct Upload */}
              <div className="md:col-span-12 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Cover Photo Image URL or Upload:
                  </label>
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/40 rounded text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingCover ? 'Compressing...' : 'Upload Cover Photo (Auto-Compress)'}</span>
                  </button>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileUpload}
                    className="hidden"
                  />
                </div>

                {coverCompressionStatus && (
                  <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{coverCompressionStatus}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={editingPost.coverImage}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                    placeholder="https://... or uploaded photo"
                    className="flex-1 p-2 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <img
                    src={editingPost.coverImage}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded border border-slate-700"
                  />
                </div>

                {/* Photo Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 mr-1">Quick Photos:</span>
                  {PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingPost({ ...editingPost, coverImage: preset.url })}
                      className="px-2 py-0.5 bg-[#141924] hover:bg-amber-400 hover:text-black text-[10px] font-mono text-slate-300 border border-[#263145] rounded transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Excerpt */}
              <div className="md:col-span-12 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Summary / Excerpt (Short description on frontpage):
                </label>
                <textarea
                  rows={2}
                  value={editingPost.excerpt}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  className="w-full p-2.5 text-xs font-mono bg-[#080B10] border border-[#2A3448] text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-400 leading-relaxed"
                />
              </div>

            </div>

            {/* Rich Text Editor Toolbar */}
            {!isPreviewMode ? (
              <div className="space-y-2 pt-3 border-t border-slate-700/40">
                <div className="flex flex-wrap items-center gap-1 p-2 bg-[#090C12] border border-[#222A3A] rounded-t-lg">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mr-2">Formatting:</span>
                  
                  <button
                    type="button"
                    onClick={() => insertFormatting('### ')}
                    className="px-2 py-1 bg-[#141924] hover:bg-[#1E2536] text-xs font-mono text-slate-200 border border-[#2A3448] rounded"
                    title="Section Heading H3"
                  >
                    H3
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1 bg-[#141924] hover:bg-[#1E2536] text-slate-200 border border-[#2A3448] rounded"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1 bg-[#141924] hover:bg-[#1E2536] text-slate-200 border border-[#2A3448] rounded"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('* ')}
                    className="p-1 bg-[#141924] hover:bg-[#1E2536] text-slate-200 border border-[#2A3448] rounded"
                    title="Bullet List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('1. ')}
                    className="p-1 bg-[#141924] hover:bg-[#1E2536] text-slate-200 border border-[#2A3448] rounded"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('> ')}
                    className="p-1 bg-[#141924] hover:bg-[#1E2536] text-slate-200 border border-[#2A3448] rounded"
                    title="Quote"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('\n---\n*For direct wholesale inquiries, contact Rawal Tools on official WhatsApp.*\n')}
                    className="px-2 py-1 bg-amber-400/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono rounded"
                    title="Add WhatsApp CTA"
                  >
                    + WhatsApp Footer
                  </button>
                </div>

                <textarea
                  id="blog-content-textarea"
                  rows={14}
                  required
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="Write comprehensive article here in Markdown or plain text..."
                  className="w-full p-4 text-xs sm:text-sm font-mono bg-[#080B10] border border-[#2A3448] text-white rounded-b-lg focus:outline-none focus:ring-1 focus:ring-amber-400 leading-relaxed"
                />
              </div>
            ) : (
              /* Live Preview Box */
              <div className="p-6 bg-[#080B10] border border-[#2A3448] rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    LIVE VISITOR PREVIEW (مضمون کی جھلک)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Category: {editingPost.category} • {editingPost.readTimeMinutes} min
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-white">
                  {editingPost.title}
                </h2>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                  <span>Author: {editingPost.author}</span>
                  <span>Date: {editingPost.publishedAt}</span>
                </div>

                <div className="text-xs sm:text-sm text-slate-300 space-y-3 pt-2">
                  {editingPost.content.split('\n\n').map((para, i) => {
                    if (para.startsWith('### ')) {
                      return <h4 key={i} className="text-base font-bold text-amber-400 pt-2">{para.replace('### ', '')}</h4>;
                    }
                    if (para.startsWith('* ') || para.startsWith('- ')) {
                      return (
                        <ul key={i} className="list-disc pl-5 font-mono text-xs text-slate-300">
                          {para.split('\n').map((l, idx) => <li key={idx}>{l.replace(/^[*|-]\s+/, '')}</li>)}
                        </ul>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/40">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 bg-[#141924] hover:bg-[#1E2536] text-slate-300 border border-[#2A3448] text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Save & Update Article
              </button>
            </div>

          </div>

        </form>
      ) : (
        /* Articles Table / Management Grid */
        <div className="space-y-4">
          
          <div className="bg-[#0E121B] border border-[#273248] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#080B10] border-b border-[#222A3A] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Cover</th>
                    <th className="p-3.5">Article Title & Excerpt</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D2536]">
                  {localPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-[#131824] transition-colors">
                      <td className="p-3.5 w-16">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded border border-slate-700"
                        />
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <div className="font-bold text-white text-xs line-clamp-1">{post.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{post.excerpt}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{post.publishedAt} • {post.readTimeMinutes} min read</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-black/40 text-amber-400 border border-amber-400/30 rounded text-[11px]">
                          {post.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300">
                        {post.author}
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(post.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            post.isPublished
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {post.isPublished ? '🟢 Published' : '🔴 Draft'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingPost(post)}
                          className="p-1.5 bg-[#1B2232] hover:bg-amber-400 hover:text-black text-slate-200 border border-[#2A354A] transition-colors cursor-pointer"
                          title="Edit Article"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 bg-[#2B0E12] hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-900/50 transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
