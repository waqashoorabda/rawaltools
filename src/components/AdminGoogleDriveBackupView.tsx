import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  FileArchive,
  FileCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  Check,
  FolderSync,
  Info,
  LogOut,
  Sliders,
  Settings,
  Database,
  Lock,
  UserCheck,
  Zap,
} from 'lucide-react';
import {
  GoogleDriveFile,
  GoogleDriveUser,
  Product,
  StoreSettings,
} from '../types';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  disconnectGoogleDriveAccount,
  getDriveAccessToken,
  getConnectedDriveUser,
  getStoredDriveSession,
  initDriveAuth,
} from '../services/googleDriveService';
import {
  gatherCompleteAppBackupData,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  fetchDriveBackupContent,
  restoreAppFromBackupPayload,
  downloadFullProjectZipArchive,
  downloadFullJsonBackupFile,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  isDailyBackupEnabled,
  setDailyBackupEnabled,
  getLastSyncTimestamp,
  getLastDailyBackupDate,
  getSyncLogs,
  SyncLogEntry,
  AppFullBackupPayload,
  DRIVE_BACKUP_FOLDER_NAME,
  syncStoreDataToNewGoogleDriveAccount,
} from '../services/googleDriveBackupService';
import { formatBytes } from '../utils/imageUpload';

interface AdminGoogleDriveBackupViewProps {
  products: Product[];
  settings: StoreSettings;
  onRestoreComplete?: (restoredData: any) => void;
}

export const AdminGoogleDriveBackupView: React.FC<AdminGoogleDriveBackupViewProps> = ({
  products,
  settings,
  onRestoreComplete,
}) => {
  // Auth state
  const [driveUser, setDriveUser] = useState<GoogleDriveUser | null>(() => getConnectedDriveUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = getStoredDriveSession();
    return !!session.user && (session.isTokenValid || !!session.accessToken);
  });
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState<boolean>(false);
  const [isAutoSyncingNewAccount, setIsAutoSyncingNewAccount] = useState<boolean>(false);

  // Auto-sync configuration toggles
  const [autoSyncOn, setAutoSyncOn] = useState<boolean>(() => isAutoSyncEnabled());
  const [dailyBackupOn, setDailyBackupOn] = useState<boolean>(() => isDailyBackupEnabled());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => getLastSyncTimestamp());
  const [lastDailyDate, setLastDailyDate] = useState<string | null>(() => getLastDailyBackupDate());

  // Cloud Backups List
  const [driveBackups, setDriveBackups] = useState<GoogleDriveFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);

  // Sync / Action Loading states
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Restore Modal State
  const [restoreModalData, setRestoreModalData] = useState<AppFullBackupPayload | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSource, setRestoreSource] = useState<string>('');

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(() => getSyncLogs());

  // Initialize Drive Auth listener and restore persistent session
  useEffect(() => {
    const unsub = initDriveAuth(
      (user, token) => {
        if (user) {
          setIsAuthenticated(true);
          setDriveUser({
            uid: (user as any).uid || 'google_user',
            email: user.email || '',
            displayName: user.displayName || user.email || 'Google User',
            photoUrl: (user as any).photoUrl || (user as any).photoURL || undefined,
          });
          setAuthError(null);
        }
      },
      () => {
        const active = getStoredDriveSession();
        if (!active.hasStoredUser) {
          setIsAuthenticated(false);
          setDriveUser(null);
        }
      }
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Fetch Drive backups whenever authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDriveBackupsList();
    }
  }, [isAuthenticated]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setIsAuthenticated(true);
        setDriveUser(res.user);

        // Check if this is a newly connected email (or switched account)
        if (res.isNewAccount) {
          setIsAutoSyncingNewAccount(true);
          showToast(`نیا گوگل اکاؤنٹ منسلک ہو گیا (${res.user.email})! ڈیٹا سنک ہو رہا ہے...`);
          try {
            const syncResult = await syncStoreDataToNewGoogleDriveAccount(res.user.email);
            showToast(
              `🎉 تمام اسٹور ڈیٹا (${syncResult.totalProducts} پروڈکٹس، سیٹنگز اور میڈیا) خودکار طور پر نئے گوگل ڈرائیو پر منتقل ہو گیا ہے!`
            );
          } catch (syncErr: any) {
            console.warn('Auto-sync to new account notice:', syncErr);
            showToast(`Connected as ${res.user.email}. (Manual sync available)`);
          } finally {
            setIsAutoSyncingNewAccount(false);
          }
        } else {
          showToast(`Google Drive connected: ${res.user.displayName || res.user.email}`);
        }

        setLastSyncTime(new Date().toISOString());
        setSyncLogs(getSyncLogs());
        await loadDriveBackupsList();
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Google Drive authentication failed.');
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    const res = await disconnectGoogleDriveAccount({ skipConfirm: true });
    setIsAuthenticated(false);
    setDriveUser(null);
    setDriveBackups([]);
    setIsDisconnectModalOpen(false);
    showToast(
      `گوگل ڈرائیو اکاؤنٹ (${res.disconnectedEmail || 'Email'}) ڈسکیکٹ ہو گیا۔ نیا ای میل کنیکٹ کرنے پر سارا ڈیٹا خودکار نئے اکاؤنٹ پر سنک ہو جائے گا۔`
    );
  };

  const loadDriveBackupsList = async () => {
    if (!getDriveAccessToken()) return;
    setIsLoadingBackups(true);
    try {
      const files = await listGoogleDriveBackups();
      setDriveBackups(files);
    } catch (err: any) {
      console.warn('Could not load Drive backups list:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncOn(enabled);
    setAutoSyncEnabled(enabled);
    showToast(enabled ? 'Live Auto-Sync on Changes enabled!' : 'Live Auto-Sync paused.');
  };

  const handleToggleDailyBackup = (enabled: boolean) => {
    setDailyBackupOn(enabled);
    setDailyBackupEnabled(enabled);
    showToast(enabled ? 'Daily Scheduled Auto-Backup enabled!' : 'Daily Auto-Backup paused.');
  };

  // 1-Click Manual Sync to Google Drive
  const handleTriggerDriveSync = async () => {
    if (!isAuthenticated) {
      showToast('Please Sign In with Google first.', 'error');
      return;
    }

    setIsSyncingNow(true);
    try {
      const result = await uploadBackupToGoogleDrive(undefined, 'manual_sync');
      setLastSyncTime(new Date().toISOString());
      setSyncLogs(getSyncLogs());
      await loadDriveBackupsList();
      showToast(`Backup successfully uploaded to Google Drive! (${result.name})`);
    } catch (err: any) {
      console.error('Sync failed:', err);
      showToast(`Backup failed: ${err.message}`, 'error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  // 1-Click Download Complete ZIP Package
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadFullProjectZipArchive();
      showToast('Complete files ZIP package generated and downloaded!');
    } catch (err: any) {
      console.error('ZIP generation error:', err);
      showToast('Failed to generate ZIP package', 'error');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // 1-Click Master JSON Download
  const handleDownloadMasterJson = () => {
    try {
      downloadFullJsonBackupFile();
      showToast('Full system backup JSON file downloaded!');
    } catch (err: any) {
      showToast('Download error', 'error');
    }
  };

  // Handle Local File Upload for Restore
  const handleLocalFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data || !json.data.products) {
          throw new Error('This JSON file is not a valid Rawal Tools backup package.');
        }
        setRestoreSource(`Local File: ${file.name}`);
        setRestoreModalData(json);
      } catch (err: any) {
        showToast(err.message || 'Corrupted or invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Drive Cloud Backup Restore
  const handleDriveBackupRestore = async (file: GoogleDriveFile) => {
    try {
      setIsSyncingNow(true);
      const data = await fetchDriveBackupContent(file.id);
      setRestoreSource(`Google Drive: ${file.name}`);
      setRestoreModalData(data);
    } catch (err: any) {
      showToast(`Failed to load backup from Drive: ${err.message}`, 'error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Confirm and Execute Application Restore
  const handleExecuteRestore = () => {
    if (!restoreModalData) return;
    setIsRestoring(true);
    try {
      const res = restoreAppFromBackupPayload(restoreModalData);
      showToast(res.message);
      if (onRestoreComplete) {
        onRestoreComplete(res.restoredData);
      }
      setRestoreModalData(null);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      showToast(`Restore failed: ${err.message}`, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isBackedUpToday = lastDailyDate === todayStr;

  return (
    <div className="space-y-6 font-sans text-[#F5F5F5]">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-mono border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Google Drive Connection Banner */}
      <div className="bg-[#121622] border border-[#232D42] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/5 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                <span>Live Google Drive Sync & Backup</span>
              </div>
              {isAuthenticated ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Connected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono">
                  Offline / Not Connected
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>Cloud Vault & Full System Backup</span>
              <span className="text-sm font-normal text-slate-400">/ خودکار کلاؤڈ بیک اپ</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Rawal Tools ka tamam data (Products, Images, Settings, Articles, Reviews, Code Scripts) Google Drive me mehfooz rehta hai. Kisi bhi tabdeeli (Add/Edit product) par automatic sync hota hai aur rozana daily snapshot banti hai.
            </p>
          </div>

          {/* Connection Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isAuthenticated && driveUser ? (
              <div className="flex items-center gap-3 p-2 bg-[#171E2E] border border-amber-400/30 rounded-xl shadow-md">
                {driveUser.photoUrl ? (
                  <img
                    src={driveUser.photoUrl}
                    alt={driveUser.displayName}
                    className="w-10 h-10 rounded-full border border-amber-400/60 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-400/40">
                    {driveUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="text-left pr-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate max-w-[170px]">
                    <span>{driveUser.displayName}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-mono font-semibold">
                      مستقل لاگ ان
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono font-bold truncate max-w-[170px]">
                    {driveUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 rounded-lg border border-rose-700/50 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Disconnect account to connect another email"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ڈسکیکٹ / تبدیل</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl font-mono transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Connect with Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Informative notification if newly connected and syncing */}
        {isAutoSyncingNewAccount && (
          <div className="mt-4 p-3.5 bg-amber-950/60 border border-amber-500/60 rounded-xl text-xs text-amber-200 flex items-center gap-3 font-sans animate-pulse">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div>
              <strong className="font-bold">نئے گوگل اکاؤنٹ کے ساتھ پہلی بار سنک ہو رہا ہے:</strong> تمام موجودہ پروڈکٹس، کیٹلاگ ڈیٹا اور سیٹنگز اس نئے گوگل ڈرائیو میں خودکار محفوظ کی جا رہی ہیں۔ براہ کرم چند سیکنڈ انتظار کریں۔
            </div>
          </div>
        )}

        {authError && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {/* Real-time Automated Engine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live Auto-Sync on Changes */}
        <div className="bg-[#111622] border border-[#20293D] rounded-xl p-4.5 space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <FolderSync className="w-4 h-4" />
                <span>Live Change Auto-Sync</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncOn}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
              </label>
            </div>
            <h4 className="text-sm font-bold text-white">
              Instant Cloud Sync on Every Edit
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              Jab bhi naya tool add ho, price badle ya settings update hon, background me automatically Google Drive me sync ho jata hai.
            </p>
          </div>

          <div className="pt-2 border-t border-[#1C2538] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Last Synced:</span>
            <span className="text-amber-400 font-bold">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Card 2: Daily Scheduled Auto-Backup */}
        <div className="bg-[#111622] border border-[#20293D] rounded-xl p-4.5 space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Daily Auto-Backup</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyBackupOn}
                  onChange={(e) => handleToggleDailyBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-400"></div>
              </label>
            </div>
            <h4 className="text-sm font-bold text-white">
              Daily Snapshot Upload by Date & Time
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              Rozana ki bunyad par date & time ke sath mutabiqa backup file banti hai aur Google Drive ke folder me save hoti hai.
            </p>
          </div>

          <div className="pt-2 border-t border-[#1C2538] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Today's Status:</span>
            <span className={isBackedUpToday ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isBackedUpToday ? '✓ Saved Today' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Card 3: Storage Folder & Protection Stats */}
        <div className="bg-[#111622] border border-[#20293D] rounded-xl p-4.5 space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Data Protection</span>
            </div>
            <h4 className="text-sm font-bold text-white">
              Folder: {DRIVE_BACKUP_FOLDER_NAME}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-2 text-slate-300">
              <div className="p-1.5 bg-[#171E2E] rounded border border-slate-800">
                <span className="text-slate-400">Products:</span> <strong className="text-white">{products.length}</strong>
              </div>
              <div className="p-1.5 bg-[#171E2E] rounded border border-slate-800">
                <span className="text-slate-400">Drive Backups:</span> <strong className="text-white">{driveBackups.length}</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1C2538] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Security:</span>
            <span className="text-emerald-400 font-bold">Encrypted & Safe</span>
          </div>
        </div>
      </div>

      {/* Action Center: 1-Click Operations */}
      <div className="bg-[#121622] border border-[#242E44] rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Instant Actions & Download Section</span>
            <span className="text-xs font-normal text-slate-400">/ فائلز ڈاؤن لوڈ و فوری سنک</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Ek click par tamam app files ka ZIP package download karen ya Google Drive par naya backup snapshot bhejen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: 1-Click Google Drive Sync Now */}
          <button
            onClick={handleTriggerDriveSync}
            disabled={isSyncingNow}
            className="flex flex-col items-start justify-between p-4 bg-gradient-to-br from-amber-500/20 via-[#182030] to-[#121724] hover:from-amber-500/30 border border-amber-500/40 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              {isSyncingNow ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1">
                <span>1-Click Sync to Drive</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Save real-time snapshot directly to Google Drive right now.
              </p>
            </div>
          </button>

          {/* Action 2: Download Complete ZIP Package */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="flex flex-col items-start justify-between p-4 bg-gradient-to-br from-sky-500/20 via-[#182030] to-[#121724] hover:from-sky-500/30 border border-sky-500/40 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-400/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              {isDownloadingZip ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1">
                <span>Download All Files (ZIP)</span>
                <Download className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Download complete ZIP package with all modular JSON data and README.
              </p>
            </div>
          </button>

          {/* Action 3: Download Master JSON */}
          <button
            onClick={handleDownloadMasterJson}
            className="flex flex-col items-start justify-between p-4 bg-gradient-to-br from-emerald-500/20 via-[#182030] to-[#121724] hover:from-emerald-500/30 border border-emerald-500/40 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-400/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1">
                <span>Full JSON Backup</span>
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Single master JSON backup file for fast export & instant restore.
              </p>
            </div>
          </button>

          {/* Action 4: Restore / Import from File */}
          <label className="flex flex-col items-start justify-between p-4 bg-gradient-to-br from-purple-500/20 via-[#182030] to-[#121724] hover:from-purple-500/30 border border-purple-500/40 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleLocalFileRestore}
              className="hidden"
            />
            <div className="w-9 h-9 rounded-lg bg-purple-400/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1">
                <span>Restore / Import File</span>
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Upload a previous JSON backup to restore catalog & store settings.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Google Drive Stored Backups List */}
      <div className="bg-[#111622] border border-[#232D42] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-400" />
              <span>Google Drive Cloud Backups Vault</span>
              <span className="text-xs font-normal text-slate-400">/ ڈرائیو پر محفوظ فائلز</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Files stored in Google Drive folder: <code className="text-amber-400 font-mono">{DRIVE_BACKUP_FOLDER_NAME}</code>
            </p>
          </div>

          <button
            onClick={loadDriveBackupsList}
            disabled={isLoadingBackups || !isAuthenticated}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#171E2E] hover:bg-[#20293D] border border-slate-700 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
            <span>Refresh Vault</span>
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-8 text-center bg-[#0E121B] border border-dashed border-slate-800 rounded-xl space-y-3">
            <Cloud className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300 font-mono">Connect Google Drive to View Cloud Backups</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sign in with Google to explore, restore, and manage all your timestamped backup files directly from Google Drive.
              </p>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-lg font-mono transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        ) : isLoadingBackups ? (
          <div className="p-8 text-center space-y-2 font-mono text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <span>Fetching backups from Google Drive...</span>
          </div>
        ) : driveBackups.length === 0 ? (
          <div className="p-8 text-center bg-[#0E121B] border border-dashed border-slate-800 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-300 font-mono">No backup files yet in Google Drive</h4>
            <p className="text-xs text-slate-500">
              Click "1-Click Sync to Drive" above to create your first cloud snapshot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#20293D] text-[11px] text-slate-400 uppercase tracking-wider bg-[#151B28]">
                  <th className="p-3">File Name / Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2538]">
                {driveBackups.map((file) => {
                  const isDaily = file.name.includes('DailyBackup');
                  const isLive = file.name.includes('LiveSync');

                  return (
                    <tr key={file.id} className="hover:bg-[#151B28]/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {isDaily ? (
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] border border-sky-500/30">
                            Daily Snapshot
                          </span>
                        ) : isLive ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                            Live Auto-Sync
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                            Manual Backup
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {file.size ? formatBytes(parseInt(file.size, 10)) : '—'}
                      </td>
                      <td className="p-3 text-slate-400">
                        {file.createdTime ? new Date(file.createdTime).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-[#1A2234] hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors"
                              title="View in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDriveBackupRestore(file)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="Restore this backup into application"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Activity History Log */}
      {syncLogs.length > 0 && (
        <div className="bg-[#111622] border border-[#232D42] rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Recent Synchronization Log</span>
          </h4>

          <div className="space-y-1.5">
            {syncLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 bg-[#161C2A] border border-[#232D42] rounded-lg text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="text-slate-200 font-bold">{log.fileName}</span>
                  <span className="text-[10px] text-slate-400">({log.trigger})</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreModalData && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E121B] border border-amber-400/40 rounded-2xl max-w-lg w-full p-6 space-y-5 text-[#F5F5F5] font-sans shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono">Confirm System Restore</h3>
                <p className="text-xs text-slate-400">{restoreSource}</p>
              </div>
            </div>

            <div className="p-4 bg-[#141A26] border border-[#253248] rounded-xl space-y-2 text-xs font-mono">
              <div className="font-bold text-amber-400 mb-1">Package Contents Summary:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>● Products: <strong>{restoreModalData.data?.products?.length || 0}</strong></div>
                <div>● Articles: <strong>{restoreModalData.data?.blogPosts?.length || 0}</strong></div>
                <div>● Reviews: <strong>{restoreModalData.data?.productReviews?.length || 0}</strong></div>
                <div>● Media Files: <strong>{restoreModalData.data?.mediaItems?.length || 0}</strong></div>
                <div>● Team Staff: <strong>{restoreModalData.data?.teamMembers?.length || 0}</strong></div>
                <div>● Store Settings: <strong>Included</strong></div>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Restoring this backup will replace current catalog and settings with the data from this snapshot. A backup of current data will also be preserved.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Confirm & Restore All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect & Switch Email Confirmation Modal */}
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E121B] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 text-[#F5F5F5] font-sans shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono">گوگل ڈرائیو اکاؤنٹ ڈسکیکٹ کریں</h3>
                <p className="text-xs text-slate-400 font-mono">{driveUser?.email || 'Connected Account'}</p>
              </div>
            </div>

            <div className="p-4 bg-[#141A26] border border-[#253248] rounded-xl space-y-3 text-xs">
              <p className="text-slate-200 leading-relaxed font-sans">
                کیا آپ موجودہ گوگل اکاؤنٹ <strong className="text-amber-400 font-mono">{driveUser?.email}</strong> کو ڈسکیکٹ کرنا چاہتے ہیں؟
              </p>
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-300 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>خودکار ڈیٹا منتقلی (Auto-Sync to New Email):</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  ڈسکیکٹ کرنے کے بعد جیسے ہی آپ کسی دوسرے ای میل سے لاگ ان کریں گے، آپ کا تمام اسٹور ڈیٹا (پروڈکٹس، سیٹنگز، میڈیا اور بیک اپ) خودکار طور پر اس نئے گوگل ڈرائیو اکاؤنٹ پر منتقل و محفوظ ہو جائے گا۔
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDisconnectModalOpen(false)}
                className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
              >
                منسوخ کریں (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>ڈسکیکٹ کریں (Disconnect)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
