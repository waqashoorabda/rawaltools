import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Plus,
  X,
  Folder,
  Image as ImageIcon,
  Check,
  Download,
  HardDrive,
  UserCheck,
  LogOut,
  Sparkles,
  Settings,
  Key,
  HelpCircle,
} from 'lucide-react';
import { GoogleDriveFile, GoogleDriveUser, MediaCategory, MediaItem } from '../types';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  disconnectGoogleDriveAccount,
  getDriveAccessToken,
  setDriveAccessToken,
  listGoogleDriveImages,
  uploadImageToGoogleDrive,
  deleteGoogleDriveFile,
  syncAllMediaToGoogleDrive,
  ROOT_VAULT_FOLDER_NAME,
  initDriveAuth,
  getStoredCustomOAuthClientId,
  saveStoredCustomOAuthClientId,
} from '../services/googleDriveService';
import { formatBytes } from '../utils/imageUpload';
import { registerMediaItem, saveStoredMediaItems } from '../utils/mediaStorage';

interface GoogleDriveVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onMediaItemsUpdated: (items: MediaItem[]) => void;
  onSelectDriveImage?: (imageUrl: string) => void;
}

export const GoogleDriveVaultModal: React.FC<GoogleDriveVaultModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  onMediaItemsUpdated,
  onSelectDriveImage,
}) => {
  // Auth state
  const [driveUser, setDriveUser] = useState<GoogleDriveUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Settings & manual credentials
  const [customClientId, setCustomClientId] = useState(() => getStoredCustomOAuthClientId());
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [credentialsSaved, setCredentialsSaved] = useState(false);

  // Drive explorer state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'sync' | 'browse' | 'settings'>('sync');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; itemName: string } | null>(null);
  const [syncResults, setSyncResults] = useState<{ uploaded: number; errors: any[] } | null>(null);

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedFileForImport, setSelectedFileForImport] = useState<GoogleDriveFile | null>(null);
  const [importCategory, setImportCategory] = useState<MediaCategory>('products');
  const [importTitle, setImportTitle] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, token) => {
        if (user && token) {
          setIsAuthenticated(true);
          setDriveUser({
            uid: (user as any).uid || 'google_user',
            email: user.email || '',
            displayName: user.displayName || user.email || 'Google User',
            photoUrl: (user as any).photoUrl || (user as any).photoURL || undefined,
          });
          setAuthErrorMessage(null);
        }
      },
      () => {
        setIsAuthenticated(false);
        setDriveUser(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch drive files when authenticated or tab changes
  useEffect(() => {
    if (isOpen && isAuthenticated && activeTab === 'browse') {
      loadDriveFiles();
    }
  }, [isOpen, isAuthenticated, activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthErrorMessage(null);
    try {
      const res = await signInWithGoogleDrive(customClientId.trim() || undefined);
      if (res) {
        setIsAuthenticated(true);
        setDriveUser(res.user);
        setAuthErrorMessage(null);
        showToast(`✓ Connected to Google Drive (${res.user.email})`);
        if (activeTab === 'browse') {
          loadDriveFiles();
        }
      }
    } catch (err: any) {
      console.warn('Sign-in error:', err);
      const msg = err.message || 'Google Drive sign in failed';
      setAuthErrorMessage(msg);
      showToast(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleApplyManualToken = () => {
    const clean = manualTokenInput.trim();
    if (!clean) return;
    setDriveAccessToken(clean, {
      uid: 'manual_token_user',
      email: 'authorized.drive@user',
      displayName: 'Google Drive User',
    });
    setIsAuthenticated(true);
    setDriveUser({
      uid: 'manual_token_user',
      email: 'authorized.drive@user',
      displayName: 'Google Drive User',
    });
    setAuthErrorMessage(null);
    showToast('✓ Access token applied successfully!');
    if (activeTab === 'browse') {
      loadDriveFiles();
    }
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredCustomOAuthClientId(customClientId.trim());
    setCredentialsSaved(true);
    setTimeout(() => setCredentialsSaved(false), 2500);
    showToast('✓ Custom Google OAuth Client ID saved');
  };

  const handleSignOut = async () => {
    const res = await disconnectGoogleDriveAccount();
    if (res.success) {
      setIsAuthenticated(false);
      setDriveUser(null);
      setDriveFiles([]);
      setManualTokenInput('');
      showToast('Google Drive account disconnected. Ready to connect new email.');
    }
  };

  const loadDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listGoogleDriveImages({
        pageSize: 50,
        searchQuery: searchQuery.trim() || undefined,
      });
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error loading drive files:', err);
      showToast('Could not fetch files from Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Run full batch sync of unsynced items
  const handleStartBatchSync = async () => {
    if (!isAuthenticated) {
      showToast('Please Sign In with Google first');
      return;
    }

    const unsynced = mediaItems.filter((i) => !i.isSyncedToDrive || !i.driveFileId);
    if (unsynced.length === 0) {
      showToast('All media images are already backed up to Google Drive!');
      return;
    }

    setIsSyncing(true);
    setSyncResults(null);

    try {
      const result = await syncAllMediaToGoogleDrive(
        mediaItems,
        (current, total, itemName) => {
          setSyncProgress({ current, total, itemName });
        }
      );

      onMediaItemsUpdated(result.syncedItems);
      saveStoredMediaItems(result.syncedItems);
      setSyncResults({
        uploaded: result.uploadedCount,
        errors: result.errors,
      });
      showToast(`✓ Successfully backed up ${result.uploadedCount} images to Google Drive!`);
    } catch (err: any) {
      console.error('Batch sync error:', err);
      showToast(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Import image from Google Drive into Media Library
  const handleImportDriveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileForImport) return;

    setIsImporting(true);
    try {
      const directUrl = selectedFileForImport.webContentLink || `https://lh3.googleusercontent.com/d/${selectedFileForImport.id}`;
      const title = importTitle.trim() || selectedFileForImport.name.replace(/\.[^/.]+$/, '');

      const newItem = registerMediaItem({
        url: directUrl,
        title,
        fileName: selectedFileForImport.name,
        fileSize: selectedFileForImport.size ? parseInt(selectedFileForImport.size, 10) : 50000,
        category: importCategory,
        folder: `uploads/${importCategory}`,
        tags: [importCategory, 'gdrive', 'imported'],
        driveFileId: selectedFileForImport.id,
        driveWebViewLink: selectedFileForImport.webViewLink,
        driveWebContentLink: selectedFileForImport.webContentLink,
        driveThumbnailUrl: selectedFileForImport.thumbnailLink,
        isSyncedToDrive: true,
        driveSyncedAt: new Date().toISOString(),
      });

      if (onSelectDriveImage) {
        onSelectDriveImage(newItem.url);
      }

      setSelectedFileForImport(null);
      setImportTitle('');
      showToast(`✓ Imported "${title}" from Google Drive into Media Library!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to import image from Google Drive');
    } finally {
      setIsImporting(false);
    }
  };

  // Delete file from Google Drive (Mandatory user confirmation per workspace skill)
  const handleDeleteFromDrive = async (file: GoogleDriveFile) => {
    try {
      const deleted = await deleteGoogleDriveFile(file.id, file.name, false);
      if (deleted) {
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
        showToast(`✓ Deleted "${file.name}" from Google Drive`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete file');
    }
  };

  if (!isOpen) return null;

  const syncedCount = mediaItems.filter((i) => i.isSyncedToDrive && i.driveFileId).length;
  const unsyncedCount = mediaItems.length - syncedCount;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-400 text-black px-4 py-2.5 rounded-lg shadow-xl font-bold font-mono text-xs flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-[#0E121B] border border-[#2B354C] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#131926] px-5 py-4 border-b border-[#222B3E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-[#101522] rounded-[7px] flex items-center justify-center text-blue-400">
                <Cloud className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">
                  Google Drive Cloud Vault & Media Storage
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                  Workspace API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                اپنے ذاتی گوگل ڈرائیو پر تصاویر محفوظ کریں، آرگنائزڈ فولڈرز بنائیں اور براہِ راست امپورٹ کریں۔
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Banner & Connection Status */}
        <div className="p-4 sm:p-5 bg-[#121724] border-b border-[#1E273A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isAuthenticated && driveUser ? (
              <>
                {driveUser.photoUrl ? (
                  <img
                    src={driveUser.photoUrl}
                    alt={driveUser.displayName}
                    className="w-10 h-10 rounded-full border border-emerald-400/50 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold font-mono">
                    <UserCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{driveUser.displayName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Connected
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{driveUser.email}</span>
                </div>
              </>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-200">Google Drive Not Connected</div>
                <p className="text-[11px] text-slate-400">
                  Sign in with your Google Account to enable automatic Drive backups and file browsing.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-[#1C2538] hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-mono border border-[#2B3954] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              /* Official Sign in with Google Button specification */
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs shadow-md border border-slate-300 flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Auth Error Banner with Instant Action */}
        {authErrorMessage && !isAuthenticated && (
          <div className="bg-amber-950/50 border-b border-amber-500/40 p-3 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Domain verification note: Use Google Identity Services or enter custom credentials in the Connection Settings tab.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded font-mono text-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Open Settings →
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-[#10141F] px-5 pt-3 border-b border-[#1C2436] flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'sync'
                ? 'border-blue-400 text-blue-400 bg-blue-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>Store Media Sync & Backup (تمام تصاویر سنک کریں)</span>
            {unsyncedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-bold">
                {unsyncedCount} new
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'browse'
                ? 'border-blue-400 text-blue-400 bg-blue-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Browse Google Drive Files (ڈرائیو براؤزر)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'border-blue-400 text-blue-400 bg-blue-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Connection Settings & Domain (سیٹنگز)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* TAB 1: SYNC MEDIA TO DRIVE */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
                <div className="bg-[#131926] border border-[#222C40] p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Store Media</span>
                  <span className="text-lg font-bold text-white">{mediaItems.length} Files</span>
                  <p className="text-[10px] text-slate-500">Products, banners, team, blog photos</p>
                </div>

                <div className="bg-[#131926] border border-[#222C40] p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Synced to Google Drive</span>
                  <span className="text-lg font-bold text-emerald-400">{syncedCount} Backed Up</span>
                  <p className="text-[10px] text-slate-500">Safe in `{ROOT_VAULT_FOLDER_NAME}`</p>
                </div>

                <div className="bg-[#131926] border border-[#222C40] p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider block">Unsynced / Pending</span>
                  <span className="text-lg font-bold text-amber-400">{unsyncedCount} Awaiting Sync</span>
                  <p className="text-[10px] text-slate-500">Ready for 1-click cloud upload</p>
                </div>
              </div>

              {/* Sync Action Card */}
              <div className="bg-[#131926] border border-[#232E44] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>One-Click Cloud Synchronization (گوگل ڈرائیو بیک اپ)</span>
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                      تمام تصاویر خودکار طور پر آپ کے گوگل ڈرائیو کے فولڈر <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">RawalTools_Media_Vault</code> میں سب فولڈرز (products, banners, team, branding) کے اندر منظم ہو جائیں گی۔
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartBatchSync}
                    disabled={isSyncing || !isAuthenticated}
                    className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                      !isAuthenticated
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : isSyncing
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 hover:from-blue-400 hover:to-indigo-500 text-white cursor-pointer active:scale-95 shadow-blue-900/30'
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing to Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4" />
                        <span>{unsyncedCount === 0 ? 'Re-Sync All Media' : `Sync ${unsyncedCount} Images Now`}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar during active sync */}
                {isSyncing && syncProgress && (
                  <div className="bg-[#0C1018] p-4 rounded-xl border border-blue-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-blue-300 font-bold flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading: {syncProgress.itemName}
                      </span>
                      <span className="text-slate-400">
                        {syncProgress.current} / {syncProgress.total} (
                        {Math.round((syncProgress.current / syncProgress.total) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#182236] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300"
                        style={{
                          width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Sync Success Summary */}
                {syncResults && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl space-y-2 text-xs font-mono text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sync Completed: {syncResults.uploaded} files uploaded safely to Google Drive!</span>
                    </div>
                    {syncResults.errors.length > 0 && (
                      <div className="text-rose-300 text-[11px] pt-1">
                        ⚠️ {syncResults.errors.length} file(s) had issues. Check network connection and retry.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Synced Media List Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Current Media Library Drive Status</span>
                  <span className="text-[10px] text-slate-500">{mediaItems.length} Total</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#111622] border border-[#1E273A] p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-9 h-9 rounded object-cover bg-black/40 border border-[#2B3954] shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="font-bold text-white truncate" title={item.title}>
                            {item.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            {item.folder}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {item.isSyncedToDrive && item.driveFileId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Drive Synced</span>
                            </span>
                            {item.driveWebViewLink && (
                              <a
                                href={item.driveWebViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-[#1C2538] hover:bg-blue-600 text-slate-300 hover:text-white"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/30">
                            Local Only
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BROWSE & IMPORT FROM GOOGLE DRIVE */}
          {activeTab === 'browse' && (
            <div className="space-y-5">
              {!isAuthenticated ? (
                <div className="bg-[#121724] border border-dashed border-[#28354E] rounded-2xl p-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 flex items-center justify-center mx-auto">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Google Drive Authentication Required</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    To browse and import photos directly from your Google Drive into Rawal Tools, please sign in with your Google account.
                  </p>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isAuthenticating}
                    className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search and Refresh Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#131926] p-3 rounded-xl border border-[#222C40]">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles()}
                        placeholder="Search images on your Google Drive..."
                        className="w-full bg-[#0D111A] text-xs text-white pl-9 pr-3 py-2 rounded-lg border border-[#243048] focus:border-blue-400 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={loadDriveFiles}
                        disabled={isLoadingFiles}
                        className="px-3.5 py-2 bg-[#1C2538] hover:bg-[#28354E] text-slate-200 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border border-[#2B3954] cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                        <span>Refresh Drive</span>
                      </button>
                    </div>
                  </div>

                  {/* Drive Files Grid */}
                  {isLoadingFiles ? (
                    <div className="p-12 text-center text-xs font-mono text-slate-400 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                      <span>Loading photos from Google Drive...</span>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="bg-[#101522] border border-dashed border-[#243048] rounded-xl p-10 text-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                      <h5 className="text-sm font-bold text-white">No images found on Google Drive</h5>
                      <p className="text-xs text-slate-400">
                        {searchQuery ? `No files match query "${searchQuery}"` : 'Sync your local media to Google Drive from the "Store Media Sync" tab.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="group bg-[#111622] border border-[#1E273A] hover:border-blue-400 rounded-xl overflow-hidden shadow flex flex-col relative transition-all"
                        >
                          <div className="aspect-square bg-black/60 relative overflow-hidden flex items-center justify-center">
                            <img
                              src={file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}`}
                              alt={file.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />

                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-blue-300 border border-blue-400/30 self-start">
                                {file.size ? formatBytes(parseInt(file.size, 10)) : 'Drive'}
                              </span>

                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFileForImport(file);
                                    setImportTitle(file.name.replace(/\.[^/.]+$/, ''));
                                  }}
                                  className="px-2.5 py-1 bg-blue-500 hover:bg-blue-400 text-white font-bold text-[10px] rounded shadow flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Import</span>
                                </button>

                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded bg-[#1C2538] hover:bg-white text-slate-300 hover:text-black"
                                    title="View in Google Drive"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteFromDrive(file)}
                                  className="p-1 rounded bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white"
                                  title="Delete from Google Drive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-2 flex-1 flex flex-col justify-between">
                            <p className="text-xs font-bold text-white truncate" title={file.name}>
                              {file.name}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 pt-1">
                              {file.size ? formatBytes(parseInt(file.size, 10)) : 'Image'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONNECTION SETTINGS & DOMAIN GUIDELINES */}
          {activeTab === 'settings' && (
            <div className="space-y-6 text-xs font-mono">
              <div className="bg-[#111622] border border-[#1E273A] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold font-sans text-sm border-b border-[#1E273A] pb-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Google Drive Credentials & Domain Authorization</span>
                </div>

                <form onSubmit={handleSaveCustomClientId} className="space-y-3">
                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] mb-1">
                      Google OAuth 2.0 Client ID (Custom / Project Client ID)
                    </label>
                    <input
                      type="text"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="e.g. xxxxxxxx-xxxx.apps.googleusercontent.com"
                      className="w-full bg-[#0A0D14] text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-blue-400 outline-none font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 font-sans">
                      Default project client ID is pre-configured. You can paste your own Google Cloud Client ID if desired.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg uppercase tracking-wider text-xs cursor-pointer"
                    >
                      {credentialsSaved ? '✓ Saved!' : 'Save Client ID'}
                    </button>
                  </div>
                </form>

                {/* Direct Access Token Input (Zero Config) */}
                <div className="pt-4 border-t border-[#1E273A] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 uppercase text-[10px] font-bold">
                      Direct OAuth Access Token (Instant Connection)
                    </label>
                    <span className="text-[10px] text-emerald-400">Zero-configuration option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={manualTokenInput}
                      onChange={(e) => setManualTokenInput(e.target.value)}
                      placeholder="Paste Google Drive OAuth Bearer Token (ya_29...)"
                      className="flex-1 bg-[#0A0D14] text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-emerald-400 outline-none font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyManualToken}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg uppercase tracking-wider text-xs cursor-pointer"
                    >
                      Connect Token
                    </button>
                  </div>
                </div>
              </div>

              {/* Troubleshooting and Domain Setup Info */}
              <div className="bg-[#0C1017] border border-[#1C2538] p-4 rounded-xl space-y-3 font-sans text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-white">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>Custom Domain (rawaltools.com) Authorized Domains Guide</span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                  <p>
                    جب آپ <strong>rawaltools.com</strong> یا Vercel پر اپنی ایپلیکیشن چلاتے ہیں:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>ہماری ایپ میں اب Google Identity Services موجود ہے جو تمام ڈومینز پر ڈائریکٹ کام کرتی ہے۔</li>
                    <li>
                      اگر آپ Firebase Console استعمال کر رہے ہوں تو <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</strong> میں جا کر <code className="text-amber-300">rawaltools.com</code> اور <code className="text-amber-300">rawaltool.com</code> ایڈ کر سکتے ہیں۔
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* IMPORT MODAL DRAWER */}
        {selectedFileForImport && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0E121B] border border-[#2B354C] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#20293C] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>Import from Google Drive to Media Library</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedFileForImport(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleImportDriveFile} className="space-y-4 text-xs font-mono">
                <div className="flex items-center gap-3 bg-[#131926] p-3 rounded-lg border border-[#222C40]">
                  <img
                    src={selectedFileForImport.thumbnailLink || `https://lh3.googleusercontent.com/d/${selectedFileForImport.id}`}
                    alt={selectedFileForImport.name}
                    className="w-12 h-12 rounded object-cover border border-[#2B3954]"
                  />
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate">{selectedFileForImport.name}</p>
                    <span className="text-slate-400 text-[10px]">
                      {selectedFileForImport.size ? formatBytes(parseInt(selectedFileForImport.size, 10)) : 'Google Drive Image'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Image Title</label>
                  <input
                    type="text"
                    required
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    className="w-full bg-[#131926] text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-blue-400 outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Target Category / Folder</label>
                  <select
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value as any)}
                    className="w-full bg-[#131926] text-white px-3 py-2 rounded-lg border border-[#243048] focus:border-blue-400 outline-none cursor-pointer"
                  >
                    <option value="products">Product Catalog (uploads/products)</option>
                    <option value="banners">Banners & Hero (uploads/banners)</option>
                    <option value="team">Team & Staff (uploads/team)</option>
                    <option value="blog">Blog & Guides (uploads/blog)</option>
                    <option value="branding">Brand & Logos (uploads/branding)</option>
                    <option value="custom">Custom & Misc (uploads/custom)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#20293C]">
                  <button
                    type="button"
                    onClick={() => setSelectedFileForImport(null)}
                    className="px-3.5 py-1.5 bg-[#1C2538] text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isImporting}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isImporting ? 'Importing...' : 'Add to Media Library'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
