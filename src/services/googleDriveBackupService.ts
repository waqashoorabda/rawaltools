import JSZip from 'jszip';
import {
  Product,
  StoreSettings,
  BlogPost,
  TeamMember,
  ProductReview,
  AdSettings,
  CustomJsSettings,
  CookieConsentSettings,
  AdminAccountsConfig,
  MediaItem,
  MediaFolder,
  GoogleDriveFile,
  GoogleDriveUser,
} from '../types';
import {
  getDriveAccessToken,
  signInWithGoogleDrive,
  findOrCreateDriveFolder,
  fetchGoogleProfile,
  saveLastSyncedDriveEmail,
  getLastSyncedDriveEmail,
} from './googleDriveService';
import {
  loadStoredProducts,
  saveStoredProducts,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredPageContent,
  saveStoredPageContent,
  loadStoredBlogPosts,
  saveStoredBlogPosts,
  loadStoredTeamMembers,
  saveStoredTeamMembers,
  loadStoredReviews,
  saveStoredReviews,
  loadStoredAdSettings,
  saveStoredAdSettings,
  loadStoredCustomJs,
  saveStoredCustomJs,
  loadStoredCookieConsent,
  saveStoredCookieConsent,
  loadStoredAdminAccounts,
  saveStoredAdminAccounts,
} from '../utils/storage';
import {
  loadStoredMediaItems,
  saveStoredMediaItems,
  loadStoredMediaFolders,
  saveStoredMediaFolders,
} from '../utils/mediaStorage';

export const DRIVE_BACKUP_FOLDER_NAME = 'RawalTools_App_Backups';

// Local storage preference keys
const AUTO_SYNC_ENABLED_KEY = 'rawal_drive_autosync_enabled_v2';
const DAILY_BACKUP_ENABLED_KEY = 'rawal_drive_daily_backup_enabled_v2';
const LAST_SYNC_TIMESTAMP_KEY = 'rawal_drive_last_sync_timestamp_v2';
const LAST_DAILY_BACKUP_DATE_KEY = 'rawal_drive_last_daily_backup_date_v2';
const SYNC_HISTORY_KEY = 'rawal_drive_sync_history_v2';

export interface AppFullBackupPayload {
  schemaVersion: string; // '2.0.0'
  backupId: string;
  timestamp: string;
  triggerType: 'daily_auto' | 'change_auto_sync' | 'manual_sync' | 'manual_export';
  appInfo: {
    name: string;
    tagline: string;
    version: string;
    exportedAt: string;
    exportedBy?: string;
  };
  summary: {
    totalProducts: number;
    totalCategories: number;
    totalBlogPosts: number;
    totalMediaItems: number;
    totalMediaFolders: number;
    totalReviews: number;
    totalTeamMembers: number;
    totalCustomScripts: number;
  };
  data: {
    products: Product[];
    settings: StoreSettings;
    pageContent: any;
    blogPosts: BlogPost[];
    teamMembers: TeamMember[];
    productReviews: ProductReview[];
    adSettings: AdSettings;
    customJsSettings: CustomJsSettings;
    cookieConsent: CookieConsentSettings;
    adminAccounts: AdminAccountsConfig;
    mediaItems: MediaItem[];
    mediaFolders: MediaFolder[];
    themeId: string;
  };
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  trigger: 'daily_auto' | 'change_auto_sync' | 'manual_sync';
  status: 'success' | 'failed';
  fileName: string;
  fileId?: string;
  fileSize?: number;
  itemsCount: number;
  error?: string;
}

/**
 * Gather complete real-time application dataset
 */
export function gatherCompleteAppBackupData(
  triggerType: 'daily_auto' | 'change_auto_sync' | 'manual_sync' | 'manual_export' = 'manual_sync',
  exportedBy = 'Admin'
): AppFullBackupPayload {
  const products = loadStoredProducts();
  const settings = loadStoredSettings();
  const pageContent = loadStoredPageContent();
  const blogPosts = loadStoredBlogPosts();
  const teamMembers = loadStoredTeamMembers();
  const productReviews = loadStoredReviews();
  const adSettings = loadStoredAdSettings();
  const customJsSettings = loadStoredCustomJs();
  const cookieConsent = loadStoredCookieConsent();
  const adminAccounts = loadStoredAdminAccounts();
  const mediaItems = loadStoredMediaItems();
  const mediaFolders = loadStoredMediaFolders();
  let themeId = 'industrial_yellow';
  try {
    themeId = localStorage.getItem('rt_active_theme_id_v2') || settings.selectedTheme || 'industrial_yellow';
  } catch {
    themeId = settings.selectedTheme || 'industrial_yellow';
  }

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const now = new Date().toISOString();
  const backupId = `rt-backup-${Date.now()}`;

  return {
    schemaVersion: '2.0.0',
    backupId,
    timestamp: now,
    triggerType,
    appInfo: {
      name: settings.storeName || 'Rawal Tools',
      tagline: settings.tagline || 'Industrial Power Tools & Engineering Showcase',
      version: '2.5.0',
      exportedAt: now,
      exportedBy,
    },
    summary: {
      totalProducts: products.length,
      totalCategories: categories.length,
      totalBlogPosts: blogPosts.length,
      totalMediaItems: mediaItems.length,
      totalMediaFolders: mediaFolders.length,
      totalReviews: productReviews.length,
      totalTeamMembers: teamMembers.length,
      totalCustomScripts: customJsSettings.customScripts ? customJsSettings.customScripts.length : 0,
    },
    data: {
      products,
      settings,
      pageContent,
      blogPosts,
      teamMembers,
      productReviews,
      adSettings,
      customJsSettings,
      cookieConsent,
      adminAccounts,
      mediaItems,
      mediaFolders,
      themeId,
    },
  };
}

/**
 * Preferences Getters & Setters
 */
export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function isDailyBackupEnabled(): boolean {
  try {
    const val = localStorage.getItem(DAILY_BACKUP_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setDailyBackupEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DAILY_BACKUP_ENABLED_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function getLastSyncTimestamp(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_TIMESTAMP_KEY);
  } catch {
    return null;
  }
}

export function setLastSyncTimestamp(ts: string): void {
  try {
    localStorage.setItem(LAST_SYNC_TIMESTAMP_KEY, ts);
  } catch {
    // ignore
  }
}

export function getLastDailyBackupDate(): string | null {
  try {
    return localStorage.getItem(LAST_DAILY_BACKUP_DATE_KEY);
  } catch {
    return null;
  }
}

export function setLastDailyBackupDate(dateStr: string): void {
  try {
    localStorage.setItem(LAST_DAILY_BACKUP_DATE_KEY, dateStr);
  } catch {
    // ignore
  }
}

export function getSyncLogs(): SyncLogEntry[] {
  try {
    const raw = localStorage.getItem(SYNC_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSyncLog(entry: Omit<SyncLogEntry, 'id'>): void {
  try {
    const current = getSyncLogs();
    const newEntry: SyncLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [newEntry, ...current].slice(0, 20); // Keep latest 20
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Get or Create the Google Drive App Backups Folder
 */
export async function getOrCreateBackupDriveFolder(): Promise<string> {
  return await findOrCreateDriveFolder(DRIVE_BACKUP_FOLDER_NAME);
}

/**
 * Upload Full Application Backup JSON to Google Drive
 */
export async function uploadBackupToGoogleDrive(
  payload?: AppFullBackupPayload,
  triggerType: 'daily_auto' | 'change_auto_sync' | 'manual_sync' = 'manual_sync'
): Promise<{
  fileId: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  size: number;
}> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Not connected to Google Drive. Please Sign In with Google.');
  }

  const backupData = payload || gatherCompleteAppBackupData(triggerType);
  const jsonContent = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });

  const backupFolderId = await getOrCreateBackupDriveFolder();

  // Create formatted filename with Date & Time
  const d = new Date();
  const dateStr = d.toISOString().split('T')[0];
  const timeStr = `${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}-${String(d.getSeconds()).padStart(2, '0')}`;

  let fileName = `RawalTools_FullBackup_${dateStr}_${timeStr}.json`;
  if (triggerType === 'daily_auto') {
    fileName = `RawalTools_DailyBackup_${dateStr}.json`;
  } else if (triggerType === 'change_auto_sync') {
    fileName = `RawalTools_LiveSync_Latest.json`;
  }

  const metadata = {
    name: fileName,
    parents: [backupFolderId],
    description: `Rawal Tools Full System Backup (${triggerType}) created on ${d.toLocaleString()}. Total items: ${backupData.summary.totalProducts} products, ${backupData.summary.totalMediaItems} media files.`,
    mimeType: 'application/json',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive backup upload failed: ${errText}`);
  }

  const uploaded = await uploadRes.json();
  const fileSize = blob.size;

  // Record sync timestamp and log
  const nowIso = new Date().toISOString();
  setLastSyncTimestamp(nowIso);
  if (triggerType === 'daily_auto') {
    setLastDailyBackupDate(dateStr);
  }

  addSyncLog({
    timestamp: nowIso,
    trigger: triggerType,
    status: 'success',
    fileName: uploaded.name,
    fileId: uploaded.id,
    fileSize,
    itemsCount: backupData.summary.totalProducts,
  });

  return {
    fileId: uploaded.id,
    name: uploaded.name,
    webViewLink: uploaded.webViewLink,
    webContentLink: uploaded.webContentLink,
    size: fileSize,
  };
}

/**
 * Automatically sync all stored application data, products, settings, and media
 * to a newly connected Google Drive email account.
 */
export async function syncStoreDataToNewGoogleDriveAccount(email: string): Promise<{
  success: boolean;
  backupFile: {
    fileId: string;
    name: string;
    size: number;
    webViewLink?: string;
  };
  totalProducts: number;
  totalMedia: number;
}> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Please connect to Google Drive before syncing.');
  }

  // 1. Gather all current application data
  const backupPayload = gatherCompleteAppBackupData('manual_sync', `Auto-Sync for ${email}`);
  
  // 2. Upload initial full snapshot to the new Google Drive account
  const uploaded = await uploadBackupToGoogleDrive(backupPayload, 'manual_sync');

  // 3. Mark this email as synced
  saveLastSyncedDriveEmail(email);

  // 4. Record high-priority sync log entry
  addSyncLog({
    timestamp: new Date().toISOString(),
    trigger: 'manual_sync',
    status: 'success',
    fileName: uploaded.name,
    fileId: uploaded.fileId,
    fileSize: uploaded.size,
    itemsCount: backupPayload.summary.totalProducts,
  });

  return {
    success: true,
    backupFile: uploaded,
    totalProducts: backupPayload.summary.totalProducts,
    totalMedia: backupPayload.summary.totalMediaItems,
  };
}

/**
 * List all backup files stored in Google Drive
 */
export async function listGoogleDriveBackups(): Promise<GoogleDriveFile[]> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  const folderId = await getOrCreateBackupDriveFolder();

  const query = `'${folderId}' in parents and mimeType = 'application/json' and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&pageSize=50&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,createdTime,modifiedTime,parents)&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to list backups from Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch and Parse Backup Content from Google Drive
 */
export async function fetchDriveBackupContent(fileId: string): Promise<AppFullBackupPayload> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download backup file from Google Drive: ${res.statusText}`);
  }

  const backupPayload = await res.json();
  if (!backupPayload.data || !backupPayload.data.products) {
    throw new Error('Invalid backup file format.');
  }

  return backupPayload;
}

/**
 * Restore Application State from Backup Payload
 */
export function restoreAppFromBackupPayload(payload: AppFullBackupPayload): {
  success: boolean;
  message: string;
  restoredData: AppFullBackupPayload['data'];
} {
  if (!payload || !payload.data) {
    throw new Error('Corrupted or invalid backup file.');
  }

  const {
    products,
    settings,
    pageContent,
    blogPosts,
    teamMembers,
    productReviews,
    adSettings,
    customJsSettings,
    cookieConsent,
    adminAccounts,
    mediaItems,
    mediaFolders,
    themeId,
  } = payload.data;

  if (Array.isArray(products)) saveStoredProducts(products);
  if (settings) saveStoredSettings(settings);
  if (pageContent) saveStoredPageContent(pageContent);
  if (Array.isArray(blogPosts)) saveStoredBlogPosts(blogPosts);
  if (Array.isArray(teamMembers)) saveStoredTeamMembers(teamMembers);
  if (Array.isArray(productReviews)) saveStoredReviews(productReviews);
  if (adSettings) saveStoredAdSettings(adSettings);
  if (customJsSettings) saveStoredCustomJs(customJsSettings);
  if (cookieConsent) saveStoredCookieConsent(cookieConsent);
  if (adminAccounts) saveStoredAdminAccounts(adminAccounts);
  if (Array.isArray(mediaItems)) saveStoredMediaItems(mediaItems);
  if (Array.isArray(mediaFolders)) saveStoredMediaFolders(mediaFolders);
  if (themeId) {
    try {
      localStorage.setItem('rt_active_theme_id_v2', themeId);
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message: `Successfully restored ${products?.length || 0} products, ${blogPosts?.length || 0} articles, ${mediaItems?.length || 0} media assets, and all settings!`,
    restoredData: payload.data,
  };
}

/**
 * 1-Click Complete Project / Files ZIP Package Generation
 */
export async function downloadFullProjectZipArchive(
  payload?: AppFullBackupPayload
): Promise<void> {
  const data = payload || gatherCompleteAppBackupData('manual_export');
  const zip = new JSZip();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folder = zip.folder(`rawal-tools-full-package-${timestamp.slice(0, 10)}`) || zip;

  // 1. Master combined backup file
  folder.file('rawal-tools-full-backup.json', JSON.stringify(data, null, 2));

  // 2. Individual modular data files for easy editing / inspection
  folder.file('catalog-products.json', JSON.stringify(data.data.products, null, 2));
  folder.file('store-settings.json', JSON.stringify(data.data.settings, null, 2));
  folder.file('page-content.json', JSON.stringify(data.data.pageContent, null, 2));
  folder.file('blog-articles.json', JSON.stringify(data.data.blogPosts, null, 2));
  folder.file('team-members.json', JSON.stringify(data.data.teamMembers, null, 2));
  folder.file('customer-reviews.json', JSON.stringify(data.data.productReviews, null, 2));
  folder.file('ads-and-tracking.json', JSON.stringify(data.data.adSettings, null, 2));
  folder.file('custom-javascript.json', JSON.stringify(data.data.customJsSettings, null, 2));
  folder.file('admin-roles-config.json', JSON.stringify(data.data.adminAccounts, null, 2));
  folder.file('media-library-registry.json', JSON.stringify(data.data.mediaItems, null, 2));

  // 3. System Manifest & Documentation
  const manifest = {
    appName: data.appInfo.name,
    version: data.appInfo.version,
    exportedAt: data.appInfo.exportedAt,
    summary: data.summary,
    totalFiles: 10,
    instructions: 'This ZIP package contains the complete operational data, catalog, articles, media references, and configuration of Rawal Tools. You can re-import `rawal-tools-full-backup.json` at any time into the Rawal Tools Admin Panel to restore all state.',
  };
  folder.file('manifest.json', JSON.stringify(manifest, null, 2));

  const readmeText = `=====================================================
RAWAL TOOLS — FULL APPLICATION BACKUP PACKAGE
Generated: ${new Date().toLocaleString()}
=====================================================

Included Files:
1. rawal-tools-full-backup.json    - Full Master Backup Snapshot (All Data & Settings)
2. catalog-products.json          - Complete Tool Catalog & Technical Specs
3. store-settings.json            - WhatsApp Numbers, Store Info, Branding
4. page-content.json              - Homepage Hero, Banners, About & Warranty Texts
5. blog-articles.json             - All Buying Guides & Tutorial CMS Posts
6. team-members.json              - Sales Reps & Staff Direct Contacts
7. customer-reviews.json          - Verified Ratings, Customer Testimonials
8. ads-and-tracking.json          - Google AdSense & Promotional Banners
9. custom-javascript.json         - Tracking Pixels & Header/Footer JS Scripts
10. admin-roles-config.json       - Sub-Admin Accounts & Permissions Matrix
11. media-library-registry.json   - Media Assets & Cloud Storage References

HOW TO RESTORE:
Open the Rawal Tools Admin Panel -> Navigate to "Google Drive & Auto-Backup" -> Click "Restore / Import Backup" and choose rawal-tools-full-backup.json.

Rawal Tools Industrial Platform © ${new Date().getFullYear()}
`;
  folder.file('README.txt', readmeText);

  // Generate blob and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rawal-tools-complete-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1-Click Master JSON File Download
 */
export function downloadFullJsonBackupFile(payload?: AppFullBackupPayload): void {
  const data = payload || gatherCompleteAppBackupData('manual_export');
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `rawal-tools-full-backup-${d}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// In-Memory Debounce Controller for Change Auto-Sync
let autoSyncDebounceTimer: NodeJS.Timeout | null = null;
let isAutoSyncingInProgress = false;

/**
 * Trigger Live Change Auto-Sync with Debounce (e.g. on Product Add, Edit, Delete, Settings update)
 */
export function queueChangeAutoSync(reason = 'Catalog modification'): void {
  if (!isAutoSyncEnabled()) return;

  const token = getDriveAccessToken();
  if (!token) return; // Only sync if authenticated

  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
  }

  autoSyncDebounceTimer = setTimeout(async () => {
    if (isAutoSyncingInProgress) return;
    isAutoSyncingInProgress = true;
    try {
      console.log(`[Auto-Sync] Triggering background sync to Google Drive due to: ${reason}`);
      await uploadBackupToGoogleDrive(undefined, 'change_auto_sync');
      console.log(`[Auto-Sync] Live sync completed successfully.`);
    } catch (err) {
      console.warn('[Auto-Sync] Background auto-sync notice:', err);
    } finally {
      isAutoSyncingInProgress = false;
    }
  }, 4000); // 4-second debounce to batch rapid edits
}

/**
 * Check and Run Daily Automatic Backup
 */
export async function checkAndRunDailyAutoBackup(): Promise<boolean> {
  if (!isDailyBackupEnabled()) return false;

  const token = getDriveAccessToken();
  if (!token) return false;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastDaily = getLastDailyBackupDate();

  if (lastDaily === todayStr) {
    // Already backed up today
    return false;
  }

  try {
    console.log(`[Daily-Backup] Generating scheduled daily backup for ${todayStr}...`);
    await uploadBackupToGoogleDrive(undefined, 'daily_auto');
    setLastDailyBackupDate(todayStr);
    console.log(`[Daily-Backup] Daily backup for ${todayStr} successfully uploaded to Google Drive!`);
    return true;
  } catch (err) {
    console.warn('[Daily-Backup] Failed to create daily backup:', err);
    return false;
  }
}
