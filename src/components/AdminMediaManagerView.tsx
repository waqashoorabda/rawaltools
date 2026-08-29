import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  FolderPlus,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Server,
  Globe,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Tag,
  ArrowUpDown,
  Folder,
  Cloud,
  CloudUpload
} from 'lucide-react';
import { MediaItem, MediaFolder, MediaCategory, Product, StoreSettings, BlogPost, TeamMember } from '../types';
import {
  loadStoredMediaItems,
  saveStoredMediaItems,
  loadStoredMediaFolders,
  saveStoredMediaFolders,
  registerMediaItem,
  exportMediaLibraryZip,
  exportCpanelHostingerDeploymentBundle,
} from '../utils/mediaStorage';
import { compressImage, formatBytes } from '../utils/imageUpload';
import { GoogleDriveVaultModal } from './GoogleDriveVaultModal';
import {
  uploadImageToGoogleDrive,
  getDriveAccessToken,
  initDriveAuth,
} from '../services/googleDriveService';

interface AdminMediaManagerViewProps {
  products?: Product[];
  settings: StoreSettings;
  blogPosts?: BlogPost[];
  teamMembers?: TeamMember[];
  onSelectMediaForField?: (url: string) => void; // Optional if invoked as picker
}

export const AdminMediaManagerView: React.FC<AdminMediaManagerViewProps> = ({
  products = [],
  settings,
  blogPosts = [],
  teamMembers = [],
  onSelectMediaForField,
}) => {
  // State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => loadStoredMediaItems());
  const [folders, setFolders] = useState<MediaFolder[]>(() => loadStoredMediaFolders());
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size_desc' | 'size_asc' | 'title'>('newest');

  // Modals & Drawers
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isCpanelModalOpen, setIsCpanelModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderNameUrdu, setNewFolderNameUrdu] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState<MediaCategory>('custom');

  // Google Drive state
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isSyncingSingleItem, setIsSyncingSingleItem] = useState(false);

  // Edit Drawer Form State
  const [editTitle, setEditTitle] = useState('');
  const [editTitleUrdu, setEditTitleUrdu] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFolder, setEditFolder] = useState('');
  const [editCategory, setEditCategory] = useState<MediaCategory>('products');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Input References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Drive auth check
  useEffect(() => {
    const unsub = initDriveAuth(
      (user, token) => {
        if (token) setIsDriveConnected(true);
      },
      () => {
        setIsDriveConnected(false);
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Sync state on updates
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) setMediaItems(e.detail);
    };
    window.addEventListener('rawal_media_updated', handleSync);
    return () => window.removeEventListener('rawal_media_updated', handleSync);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyText = (text: string, id: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`✓ ${label} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Drawer
  const handleStartEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditTitleUrdu(item.titleUrdu || '');
    setEditDescription(item.description || '');
    setEditFolder(item.folder || `uploads/${item.category}`);
    setEditCategory(item.category || 'products');
    setEditTags(item.tags || []);
  };

  // Save Edit Changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedList = mediaItems.map((item) => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          title: editTitle.trim() || item.title,
          titleUrdu: editTitleUrdu.trim() || undefined,
          description: editDescription.trim(),
          folder: editFolder.trim() || `uploads/${editCategory}`,
          category: editCategory,
          tags: editTags,
        };
      }
      return item;
    });

    setMediaItems(updatedList);
    saveStoredMediaItems(updatedList);
    setEditingItem(null);
    showToast('✓ Media details saved successfully!');
  };

  // Replace / Re-upload Image File
  const handleReplaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingItem) return;
    const file = e.target.files[0];

    try {
      showToast('Compressing & replacing image...');
      const res = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 });

      const updatedList = mediaItems.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            url: res.dataUrl,
            fileName: file.name,
            fileSize: res.compressedSize,
            width: res.compressedWidth,
            height: res.compressedHeight,
            uploadedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      setMediaItems(updatedList);
      saveStoredMediaItems(updatedList);
      setEditingItem({
        ...editingItem,
        url: res.dataUrl,
        fileName: file.name,
        fileSize: res.compressedSize,
        width: res.compressedWidth,
        height: res.compressedHeight,
      });
      showToast('✓ Image replaced and compressed successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to replace image');
    }
  };

  // Delete Media Item
  const handleDeleteItem = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from Media Library?`)) {
      const filtered = mediaItems.filter((i) => i.id !== id);
      setMediaItems(filtered);
      saveStoredMediaItems(filtered);
      if (editingItem?.id === id) setEditingItem(null);
      if (previewItem?.id === id) setPreviewItem(null);
      showToast('✓ Media item deleted');
    }
  };

  // Upload a single media item directly to Google Drive
  const handleSyncSingleItemToDrive = async (item: MediaItem) => {
    const token = getDriveAccessToken();
    if (!token) {
      setIsDriveModalOpen(true);
      return;
    }

    setIsSyncingSingleItem(true);
    showToast(`Syncing "${item.title}" to Google Drive...`);

    try {
      const res = await uploadImageToGoogleDrive(
        item.url,
        item.fileName || `${item.id}.jpg`,
        item.category || 'products',
        {
          title: item.title,
          description: item.description,
          makePublic: true,
        }
      );

      const updatedList = mediaItems.map((m) => {
        if (m.id === item.id) {
          return {
            ...m,
            isSyncedToDrive: true,
            driveFileId: res.fileId,
            driveWebViewLink: res.webViewLink,
            driveWebContentLink: res.webContentLink,
            driveThumbnailUrl: res.thumbnailLink,
            driveSyncedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      setMediaItems(updatedList);
      saveStoredMediaItems(updatedList);

      if (editingItem && editingItem.id === item.id) {
        setEditingItem({
          ...editingItem,
          isSyncedToDrive: true,
          driveFileId: res.fileId,
          driveWebViewLink: res.webViewLink,
          driveWebContentLink: res.webContentLink,
          driveThumbnailUrl: res.thumbnailLink,
          driveSyncedAt: new Date().toISOString(),
        });
      }

      showToast(`✓ "${item.title}" backed up to Google Drive successfully!`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload to Google Drive');
    } finally {
      setIsSyncingSingleItem(false);
    }
  };

  // Handle Multi-file or Single File Upload
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Processing 0 / ${fileList.length} files...`);

    let uploadedCount = 0;
    const targetFolder = activeFolder === 'all' ? 'uploads/custom' : activeFolder;
    const targetCategory: MediaCategory =
      activeFolder.includes('product') ? 'products' :
      activeFolder.includes('banner') ? 'banners' :
      activeFolder.includes('team') ? 'team' :
      activeFolder.includes('blog') ? 'blog' :
      activeFolder.includes('branding') ? 'branding' : 'custom';

    const token = getDriveAccessToken();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress(`Optimizing ${i + 1}/${fileList.length}: ${file.name}...`);

      try {
        const compressed = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 });
        
        let driveMeta: any = {};
        if (token) {
          try {
            const driveRes = await uploadImageToGoogleDrive(
              compressed.dataUrl,
              file.name,
              targetCategory,
              { title: file.name.replace(/\.[^/.]+$/, ''), makePublic: true }
            );
            driveMeta = {
              driveFileId: driveRes.fileId,
              driveWebViewLink: driveRes.webViewLink,
              driveWebContentLink: driveRes.webContentLink,
              driveThumbnailUrl: driveRes.thumbnailLink,
              isSyncedToDrive: true,
              driveSyncedAt: new Date().toISOString(),
            };
          } catch (driveErr) {
            console.warn('Auto-sync to drive skipped for this file:', driveErr);
          }
        }

        registerMediaItem({
          url: compressed.dataUrl,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
          fileName: file.name,
          fileSize: compressed.compressedSize,
          width: compressed.compressedWidth,
          height: compressed.compressedHeight,
          category: targetCategory,
          folder: targetFolder,
          tags: [targetCategory, 'upload'],
          ...driveMeta,
        });
        uploadedCount++;
      } catch (err) {
        console.error('Error uploading file:', file.name, err);
      }
    }

    const refreshed = loadStoredMediaItems();
    setMediaItems(refreshed);
    setIsUploading(false);
    setUploadProgress(null);
    showToast(`✓ Successfully uploaded & optimized ${uploadedCount} image(s)!`);
  };

  // Create New Custom Folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const slug = newFolderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const folderPath = `uploads/${slug}`;

    const newFolder: MediaFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      nameUrdu: newFolderNameUrdu.trim() || undefined,
      path: folderPath,
      category: newFolderCategory,
      icon: 'Folder',
      createdAt: new Date().toISOString(),
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    saveStoredMediaFolders(updatedFolders);
    setActiveFolder(folderPath);
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
    setNewFolderNameUrdu('');
    showToast(`✓ Created folder: ${folderPath}`);
  };

  // Tag Management
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().toLowerCase();
    if (!editTags.includes(clean)) {
      setEditTags([...editTags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  // Filter and Sort Logic
  const filteredItems = mediaItems.filter((item) => {
    // Folder filter
    if (activeFolder !== 'all') {
      if (item.folder !== activeFolder && !item.folder.startsWith(activeFolder)) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchUrdu = item.titleUrdu?.toLowerCase().includes(q);
      const matchFile = item.fileName.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchFolder = item.folder.toLowerCase().includes(q);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchUrdu && !matchFile && !matchDesc && !matchFolder && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    if (sortBy === 'size_desc') return b.fileSize - a.fileSize;
    if (sortBy === 'size_asc') return a.fileSize - b.fileSize;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  // Calculate statistics
  const totalBytes = mediaItems.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

  return (
    <div className="space-y-6 text-[#F5F5F5] font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-400 text-black px-4 py-2.5 rounded-lg shadow-xl font-bold font-mono text-xs flex items-center gap-2 border border-amber-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Metric & Action Bar */}
      <div className="bg-[#10141E] border border-[#20293C] rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Centralized Media Library & Asset Manager
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                {mediaItems.length} Files
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تمام تصاویر کی مرکزی لائبریری، خودکار فولڈر مینجمنٹ، ایکسلنٹ آپٹمائزیشن، اور cPanel / Hostinger کے لیے ریڈی ٹو پبلش ایکسپورٹ۔
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Google Drive Vault & Cloud Backup */}
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md border border-blue-400/40 cursor-pointer active:scale-95 transition-all"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-200" />
              <span>Google Drive (گوگل ڈرائیو بیک اپ)</span>
              {isDriveConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Google Drive Connected"></span>
              )}
            </button>

            {/* cPanel & Hostinger Zero-Error Deployment Guide / Package */}
            <button
              type="button"
              onClick={() => setIsCpanelModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md border border-emerald-400/40 cursor-pointer active:scale-95 transition-all"
            >
              <Server className="w-3.5 h-3.5 text-emerald-200" />
              <span>cPanel & Hostinger Deploy (ہوسٹنگ گائیڈ)</span>
            </button>

            {/* Export All Media ZIP */}
            <button
              type="button"
              onClick={() => exportMediaLibraryZip(mediaItems)}
              className="px-3 py-2 bg-[#1A2234] hover:bg-[#25314C] text-slate-200 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border border-[#2F3E5C] cursor-pointer active:scale-95 transition-all"
              title="Download all media structured in uploads/ folders as ZIP"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Media (ZIP)</span>
            </button>

            {/* Upload New Media Button */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleUploadFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : '+ Upload Images'}</span>
            </button>
          </div>
        </div>

        {/* Upload Progress bar if active */}
        {isUploading && uploadProgress && (
          <div className="bg-[#182030] border border-amber-400/40 p-3 rounded-lg flex items-center justify-between text-xs font-mono text-amber-300 animate-pulse">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              {uploadProgress}
            </span>
            <span className="text-[10px] text-slate-400">Auto-compressing high-res files & syncing...</span>
          </div>
        )}

        {/* Storage stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1C2436] text-xs font-mono">
          <div className="bg-[#141A26] p-2.5 rounded-lg border border-[#222C40]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Media Items</span>
            <span className="text-sm font-bold text-white">{mediaItems.length} Images</span>
          </div>
          <div className="bg-[#141A26] p-2.5 rounded-lg border border-[#222C40]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Storage Footprint</span>
            <span className="text-sm font-bold text-amber-400">{formatBytes(totalBytes)}</span>
          </div>
          <div className="bg-[#141A26] p-2.5 rounded-lg border border-[#222C40]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Google Drive Vault</span>
            <span className="text-sm font-bold text-blue-400 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" />
              <span>{mediaItems.filter((i) => i.isSyncedToDrive && i.driveFileId).length} / {mediaItems.length} Synced</span>
            </span>
          </div>
          <div className="bg-[#141A26] p-2.5 rounded-lg border border-[#222C40]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Host Ready</span>
            <span className="text-sm font-bold text-cyan-400">.htaccess Included</span>
          </div>
        </div>
      </div>

      {/* Folder Navigation Chips & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0D111A] p-3 rounded-xl border border-[#1A2234]">
        {/* Scrollable Folder Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFolder('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all cursor-pointer border ${
              activeFolder === 'all'
                ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                : 'bg-[#151C2B] text-slate-300 border-[#243048] hover:text-white'
            }`}
          >
            📁 All Media ({mediaItems.length})
          </button>

          {folders.map((f) => {
            const count = mediaItems.filter((i) => i.folder === f.path || i.folder.startsWith(f.path)).length;
            const isActive = activeFolder === f.path;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFolder(f.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                    : 'bg-[#151C2B] text-slate-300 border-[#243048] hover:text-white'
                }`}
                title={f.path}
              >
                <span>📁 {f.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                  isActive ? 'bg-black text-amber-400' : 'bg-[#1F293D] text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsNewFolderModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 shrink-0 flex items-center gap-1 cursor-pointer"
            title="Create a new media folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Folder</span>
          </button>
        </div>

        {/* Search, Sort and View Toggle */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images, tags..."
              className="w-full bg-[#151C2B] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-2.5 py-1.5 rounded-lg border border-[#243048] focus:border-amber-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#151C2B] text-xs text-slate-300 px-2 py-1.5 rounded-lg border border-[#243048] outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="size_desc">Largest Size</option>
            <option value="size_asc">Smallest Size</option>
            <option value="title">Title (A-Z)</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-[#151C2B] rounded-lg border border-[#243048] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Media Content Display */}
      {sortedItems.length === 0 ? (
        <div className="bg-[#0C1018] border border-dashed border-[#243048] rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No media items found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No images match your search query "${searchQuery}". Try different keywords.`
              : 'There are no images in this folder yet. Click "+ Upload Images" above to add new photos.'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-amber-400 text-black font-bold text-xs rounded-lg hover:bg-amber-300 cursor-pointer shadow-md inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image Now</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="group bg-[#0F1420] border border-[#1E273A] hover:border-amber-400/60 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col relative"
            >
              {/* Thumbnail Container */}
              <div
                className="aspect-square bg-[#080B12] relative overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover Overlay with Action Buttons */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-400/30">
                        {formatBytes(item.fileSize)}
                      </span>
                      {item.isSyncedToDrive && item.driveFileId && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30 flex items-center gap-0.5" title="Backed up on Google Drive">
                          <Cloud className="w-2.5 h-2.5" />
                          <span>Drive</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="p-1 rounded bg-black/60 hover:bg-white text-white hover:text-black transition-colors"
                      title="Enlarge Preview"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    {onSelectMediaForField ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMediaForField(item.url);
                        }}
                        className="px-2 py-1 bg-amber-400 text-black font-bold text-[10px] rounded hover:bg-amber-300 shadow"
                      >
                        Select
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="p-1.5 rounded-md bg-amber-400 text-black font-bold hover:bg-amber-300 shadow"
                          title="Edit Details & Description"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {!item.isSyncedToDrive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncSingleItemToDrive(item);
                            }}
                            disabled={isSyncingSingleItem}
                            className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow"
                            title="Upload to Google Drive"
                          >
                            <CloudUpload className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(item.url, item.id, 'Image URL');
                          }}
                          className="p-1.5 rounded-md bg-[#1C2538] hover:bg-white text-slate-200 hover:text-black shadow"
                          title="Copy Image URL"
                        >
                          {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id, item.title);
                          }}
                          className="p-1.5 rounded-md bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white shadow"
                          title="Delete from Media"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors" title={item.title}>
                      {item.title}
                    </h5>
                    {item.isSyncedToDrive && item.driveFileId && (
                      <Cloud className="w-3 h-3 text-blue-400 shrink-0" title="Saved in Google Drive" />
                    )}
                  </div>
                  {item.titleUrdu && (
                    <p className="text-[10px] text-slate-400 line-clamp-1" title={item.titleUrdu}>
                      {item.titleUrdu}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-[#1C2436]">
                  <span className="truncate max-w-[80px]" title={item.folder}>
                    {item.folder.replace('uploads/', '')}
                  </span>
                  <span>{item.width ? `${item.width}×${item.height}` : formatBytes(item.fileSize)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#0F1420] border border-[#1E273A] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#141A28] border-b border-[#20293C] text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-14">Image</th>
                  <th className="py-2.5 px-3">Title & Alt Text</th>
                  <th className="py-2.5 px-3">Folder / Path</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Google Drive</th>
                  <th className="py-2.5 px-3">Size & Res</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2234]">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#151C2C] transition-colors">
                    <td className="py-2 px-3">
                      <div
                        className="w-10 h-10 rounded bg-black/40 overflow-hidden border border-[#2A364E] cursor-pointer flex items-center justify-center"
                        onClick={() => setPreviewItem(item)}
                      >
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-sans font-bold text-white text-xs">{item.title}</div>
                      {item.titleUrdu && <div className="text-[10px] text-slate-400">{item.titleUrdu}</div>}
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{item.description || item.fileName}</div>
                    </td>
                    <td className="py-2 px-3 text-amber-400/90 text-[11px]">{item.folder}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1C2538] text-slate-300 border border-[#2B3954]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {item.isSyncedToDrive && item.driveFileId ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1 max-w-fit">
                          <Cloud className="w-3 h-3 text-blue-400" />
                          <span>Drive Synced</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSyncSingleItemToDrive(item)}
                          disabled={isSyncingSingleItem}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#1A2234] hover:bg-blue-600 text-slate-300 hover:text-white border border-[#2B3954] flex items-center gap-1 cursor-pointer"
                        >
                          <CloudUpload className="w-3 h-3 text-blue-400" />
                          <span>Backup</span>
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      <div>{formatBytes(item.fileSize)}</div>
                      <div className="text-[10px] text-slate-500">{item.width ? `${item.width}×${item.height}` : 'Optimized'}</div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded bg-[#1C2538] hover:bg-amber-400 hover:text-black text-slate-300 transition-colors"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.url, item.id, 'Image URL')}
                          className="p-1.5 rounded bg-[#1C2538] hover:bg-white hover:text-black text-slate-300 transition-colors"
                          title="Copy Image URL"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT MEDIA MODAL / DRAWER
          ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0E121B] border border-[#2B354C] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-[#131926] px-5 py-3.5 border-b border-[#222B3E] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Edit Media Asset Details & Alt Text
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-5">
              {/* Image Preview & Replacement Section */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-[#141A28] p-3.5 rounded-xl border border-[#222C40]">
                <div className="sm:col-span-4 aspect-square rounded-lg bg-black/60 overflow-hidden border border-[#2B3850] relative group flex items-center justify-center">
                  <img
                    src={editingItem.url}
                    alt={editTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => replaceFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-amber-400 text-black text-[11px] font-bold rounded shadow flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-8 flex flex-col justify-between space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">File Specifications</span>
                    <p className="font-bold text-white text-sm break-all">{editingItem.fileName}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-[#29354C]">
                        Size: <strong>{formatBytes(editingItem.fileSize)}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-[#29354C]">
                        Res: <strong>{editingItem.width || 1200} × {editingItem.height || 1200}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-[#29354C]">
                        MIME: <strong>{editingItem.mimeType}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Re-upload File Button */}
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleReplaceImageFile}
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#20293D]">
                    <button
                      type="button"
                      onClick={() => replaceFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#1C2538] hover:bg-[#28354E] text-amber-400 font-bold text-xs rounded border border-[#2E3C56] flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-upload / Replace Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(editingItem.url, 'edit-url', 'Image URL')}
                      className="px-3 py-1.5 bg-[#1C2538] hover:bg-white hover:text-black text-slate-200 text-xs rounded border border-[#2E3C56] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Title & Urdu Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Image Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#141A28] text-sm text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none"
                    placeholder="e.g. Heavy Duty Rotary Hammer Drill 26mm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    عنوان و نام (اردو)
                  </label>
                  <input
                    type="text"
                    value={editTitleUrdu}
                    onChange={(e) => setEditTitleUrdu(e.target.value)}
                    className="w-full bg-[#141A28] text-sm text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none font-urdu"
                    placeholder="مثال: روٹری ہیمر ڈرل مشین"
                  />
                </div>
              </div>

              {/* Description & Alt Text */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Alt Text & SEO Description (تصویر کی وضاحت)
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#141A28] text-xs text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none resize-none"
                  placeholder="Detailed description for search engines and accessibility..."
                />
              </div>

              {/* Folder & Category Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Destination Folder (فولڈر منتخب کریں)
                  </label>
                  <select
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value)}
                    className="w-full bg-[#141A28] text-xs text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none cursor-pointer"
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.path}>
                        {f.name} ({f.path})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Category Type (قسم)
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-[#141A28] text-xs text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none cursor-pointer"
                  >
                    <option value="products">Product Catalog</option>
                    <option value="banners">Banners & Hero</option>
                    <option value="team">Team & Field Staff</option>
                    <option value="blog">Blog Articles & Guides</option>
                    <option value="branding">Brand & Logos</option>
                    <option value="custom">Custom & Misc</option>
                  </select>
                </div>
              </div>

              {/* Tags Editor */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Tags (ٹیگز)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tag and press Enter or click Add..."
                    className="flex-1 bg-[#141A28] text-xs text-white px-3 py-1.5 rounded-lg border border-[#243048] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-[#1C2538] hover:bg-[#28354E] text-amber-400 font-bold text-xs rounded border border-[#2E3C56] cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/30 text-[11px] font-mono flex items-center gap-1"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Google Drive Integration & Sync Section in Drawer */}
              <div className="bg-[#121724] border border-[#222C40] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Google Drive Cloud Storage</span>
                  </div>
                  {editingItem.isSyncedToDrive && editingItem.driveFileId ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Drive Synced</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                      Not Synced to Drive
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {editingItem.isSyncedToDrive && editingItem.driveFileId
                    ? `This media file is safely backed up to your Google Drive in folder: RawalTools_Media_Vault/${editingItem.category}.`
                    : 'Sync this media asset to your Google Drive to keep an immutable, high-resolution cloud backup.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSyncSingleItemToDrive(editingItem)}
                    disabled={isSyncingSingleItem}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>{isSyncingSingleItem ? 'Syncing to Drive...' : editingItem.isSyncedToDrive ? 'Re-sync with Drive' : 'Backup to Google Drive'}</span>
                  </button>

                  {editingItem.driveWebViewLink && (
                    <a
                      href={editingItem.driveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#1C2538] hover:bg-[#28354E] text-blue-300 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-[#2E3C56]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Drive</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#20293C]">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem.id, editingItem.title)}
                  className="px-3 py-2 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Item</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-[#1C2538] hover:bg-[#28354E] text-slate-300 text-xs rounded-lg font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL-SCREEN PREVIEW MODAL
          ========================================================================= */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-[#0E121B] border border-[#2B354C] rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#131926] border-b border-[#222B3E] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{previewItem.title}</h4>
                <p className="text-[11px] font-mono text-slate-400">{previewItem.folder} • {formatBytes(previewItem.fileSize)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={previewItem.url}
                alt={previewItem.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3.5 bg-[#131926] border-t border-[#222B3E] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">{previewItem.description}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(previewItem)}
                  className="px-3 py-1 bg-amber-400 text-black font-bold rounded text-xs"
                >
                  Edit Metadata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW FOLDER MODAL
          ========================================================================= */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0E121B] border border-[#2B354C] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#20293C] pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <FolderPlus className="w-4 h-4" />
                <span>Create New Media Folder (نیا فولڈر)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Folder Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Industrial Machinery, 2026 Specials"
                  className="w-full bg-[#141A28] text-xs text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  فولڈر کا نام (اردو)
                </label>
                <input
                  type="text"
                  value={newFolderNameUrdu}
                  onChange={(e) => setNewFolderNameUrdu(e.target.value)}
                  placeholder="مثال: صنعتی مشینیں و آلات"
                  className="w-full bg-[#141A28] text-xs text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-amber-400 outline-none font-urdu"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Category Classification
                </label>
                <select
                  value={newFolderCategory}
                  onChange={(e) => setNewFolderCategory(e.target.value as any)}
                  className="w-full bg-[#141A28] text-xs text-white px-3 py-2 rounded-lg border border-[#243048] outline-none"
                >
                  <option value="products">Products & Inventory</option>
                  <option value="banners">Banners & Graphics</option>
                  <option value="team">Team & Staff</option>
                  <option value="blog">Articles & Guides</option>
                  <option value="branding">Brand Logos</option>
                  <option value="custom">Custom Files</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-3 py-1.5 bg-[#1C2538] text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-400 text-black font-bold text-xs rounded-lg hover:bg-amber-300"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          cPanel & HOSTINGER ZERO-ERROR PUBLISHING ASSISTANT MODAL
          ========================================================================= */}
      {isCpanelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D111A] border border-[#2B354C] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#141B2B] to-[#162334] px-5 py-4 border-b border-[#222B3E] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>cPanel & Hostinger Zero-Error Deployment Center</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      100% COMPATIBLE
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    راول ٹولز ویب سائٹ کو کسی بھی cPanel، Hostinger یا کسٹم ڈومین پر بغیر کسی ایرر کے پبلش کرنے کا مکمل طریقہ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCpanelModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Steps */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs">
              {/* 1-Click Export Action Callout */}
              <div className="bg-gradient-to-br from-emerald-950/40 via-[#101A24] to-[#121620] border border-emerald-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      1-Click Export Ready-to-Publish Hosting Bundle (ZIP)
                    </h5>
                    <p className="text-slate-300 mt-1 text-xs leading-relaxed">
                      اس بٹن پر کلک کرنے سے آپ کی تمام تصاویر، پراڈکٹ ڈیٹا، کیٹلاگ بیک اپ اور سب سے اہم <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">.htaccess</code> فائل پر مشتمل زپ ڈاؤنلوڈ ہو جائے گی جو ہوسٹنگ کے لیے تیار ہے۔
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exportCpanelHostingerDeploymentBundle(products, settings, mediaItems, blogPosts, teamMembers);
                      showToast('✓ Deployment bundle downloading...');
                    }}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Bundle (ZIP)</span>
                  </button>
                </div>
              </div>

              {/* Step by step Visual Checklist */}
              <div className="space-y-4">
                <h5 className="font-mono text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-[#222B3E] pb-1.5">
                  <span>Step-by-Step Publishing Checklist (رہنمائی برائے ہوسٹنگ)</span>
                </h5>

                {/* Step 1: Hostinger */}
                <div className="bg-[#121724] border border-[#202A3E] p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-xs flex items-center justify-center font-mono">1</span>
                    <span>Hostinger hPanel Deployment (ہوسٹنگر پر اپلوڈ کرنے کا طریقہ)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-2 leading-relaxed">
                    <li>Hostinger پر لاگ ان کریں اور <strong>Websites ➔ Manage</strong> پر کلک کریں۔</li>
                    <li><strong>File Manager</strong> کھولیں اور <strong>public_html</strong> ڈائریکٹری میں جائیں۔</li>
                    <li>اگر پہلے سے کوئی <code className="text-amber-300">default.php</code> موجود ہے تو اسے ڈیلیٹ کریں۔</li>
                    <li>اپنا بلڈ فولڈر یا اوپر دیا گیا <strong>Deployment Bundle</strong> اپلوڈ کر کے <strong>Extract</strong> کر دیں۔</li>
                    <li>یقینی بنائیں کہ <code className="text-amber-300">.htaccess</code> فائل <code className="text-white">public_html</code> کے اندر موجود ہے۔</li>
                  </ol>
                </div>

                {/* Step 2: cPanel */}
                <div className="bg-[#121724] border border-[#202A3E] p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-xs flex items-center justify-center font-mono">2</span>
                    <span>cPanel File Manager Deployment (سی پینل پر اپلوڈ)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-2 leading-relaxed">
                    <li>cPanel کے <strong>File Manager</strong> میں جائیں اور <strong>public_html</strong> کھولیں۔</li>
                    <li><strong>Upload</strong> بٹن دبا کر زپ فائل اپلوڈ کریں اور وہیں <strong>Extract</strong> کریں۔</li>
                    <li>File Manager کی سیٹنگز میں <strong>"Show Hidden Files (dotfiles)"</strong> آن رکھیں تاکہ <code className="text-amber-300">.htaccess</code> نظر آئے۔</li>
                    <li>cPanel کے <strong>SSL/TLS Status</strong> میں جا کر AutoSSL رن کر لیں تاکہ گرین لاک ایکٹو ہو جائے۔</li>
                  </ol>
                </div>

                {/* Step 3: Custom Domain DNS */}
                <div className="bg-[#121724] border border-[#202A3E] p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-xs flex items-center justify-center font-mono">3</span>
                    <span>Custom Domain DNS Connection (کسٹم ڈومین لنک کرنا)</span>
                  </div>
                  <p className="text-slate-300 pl-2 leading-relaxed">
                    اپنے ڈومین رجسٹرار (جیسے GoDaddy، Namecheap یا PKNIC) میں جا کر اپنے ہوسٹنگ سرور کا <strong>A Record</strong> (IP Address) درج کریں اور <code className="text-amber-300">www</code> کے لیے CNAME پوائنٹ کریں۔
                  </p>
                </div>

                {/* Why .htaccess is Included */}
                <div className="bg-[#181F2E] border border-amber-400/30 p-3.5 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Zero-Error Guarantee with .htaccess Included
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    اس ایپ کے پبلک ڈائریکٹری میں پہلے سے ہی خصوصی <code className="text-amber-300 font-mono">.htaccess</code> کنفیگریشن شامل کر دی گئی ہے۔ یہ کسی بھی پیج کو ریفریش کرنے پر <strong>404 Not Found</strong> کا ایرر روکتی ہے اور تمام امیجز اور اسکرپٹس کو تیز رفتار کیشنگ اور Gzip کمپریشن فراہم کرتی ہے۔
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#131926] px-5 py-3 border-t border-[#222B3E] flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono text-slate-400">
                Ready for Apache, LiteSpeed, Nginx & Hostinger Cloud
              </span>
              <button
                type="button"
                onClick={() => setIsCpanelModalOpen(false)}
                className="px-4 py-1.5 bg-amber-400 text-black font-bold text-xs rounded-lg hover:bg-amber-300"
              >
                Close (بند کریں)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GOOGLE DRIVE CLOUD STORAGE & VAULT SYNC MODAL
          ========================================================================= */}
      <GoogleDriveVaultModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        mediaItems={mediaItems}
        onMediaItemsUpdated={(updated) => {
          setMediaItems(updated);
          saveStoredMediaItems(updated);
        }}
        onSelectDriveImage={onSelectMediaForField}
      />
    </div>
  );
};
