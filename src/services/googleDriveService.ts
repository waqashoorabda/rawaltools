import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleDriveFile, GoogleDriveUser, MediaItem } from '../types';

// App initialization guard
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with Drive Scopes
const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive');
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-Memory Token Cache
let cachedAccessToken: string | null = null;
let cachedDriveUser: GoogleDriveUser | null = null;
let isSigningIn = false;

// Root folder name in Google Drive for all media assets
export const ROOT_VAULT_FOLDER_NAME = 'RawalTools_Media_Vault';

// LocalStorage Keys for persistent connection and multi-account auto-sync
const STORAGE_KEY_CONNECTED_USER = 'rawal_drive_connected_account_v3';
const STORAGE_KEY_TOKEN_DATA = 'rawal_drive_token_meta_v3';
const STORAGE_KEY_LAST_SYNCED_EMAIL = 'rawal_drive_last_synced_email_v3';
const STORAGE_KEY_PREV_DISCONNECTED_EMAIL = 'rawal_drive_prev_disconnected_email_v3';
const CUSTOM_CLIENT_ID_KEY = 'rawal_drive_custom_client_id_v1';
const CUSTOM_API_KEY_KEY = 'rawal_drive_custom_api_key_v1';

export interface StoredDriveSession {
  user: GoogleDriveUser | null;
  accessToken: string | null;
  isTokenValid: boolean;
  hasStoredUser: boolean;
  expiresAt?: number;
}

/**
 * Save connected Drive session persistently so user never has to repeat login
 */
export function saveStoredDriveSession(
  user: GoogleDriveUser,
  accessToken: string,
  expiresInSeconds = 3500
): void {
  try {
    const tokenMeta = {
      accessToken,
      expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 300) * 1000,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_TOKEN_DATA, JSON.stringify(tokenMeta));

    const userMeta: GoogleDriveUser & { lastActiveAt: string } = {
      ...user,
      lastActiveAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_CONNECTED_USER, JSON.stringify(userMeta));

    cachedAccessToken = accessToken;
    cachedDriveUser = user;
  } catch (err) {
    console.warn('Failed to save persistent Drive session:', err);
  }
}

/**
 * Get stored persistent Drive session
 */
export function getStoredDriveSession(): StoredDriveSession {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY_CONNECTED_USER);
    const rawToken = localStorage.getItem(STORAGE_KEY_TOKEN_DATA);

    let user: GoogleDriveUser | null = null;
    if (rawUser) {
      user = JSON.parse(rawUser);
    }

    let accessToken: string | null = null;
    let isTokenValid = false;
    let expiresAt: number | undefined;

    if (rawToken) {
      const tokenData = JSON.parse(rawToken);
      if (tokenData && tokenData.accessToken) {
        expiresAt = tokenData.expiresAt;
        // Check if token is still valid (at least 30 seconds left)
        if (tokenData.expiresAt && tokenData.expiresAt > Date.now() + 30000) {
          accessToken = tokenData.accessToken;
          isTokenValid = true;
        }
      }
    }

    return {
      user,
      accessToken,
      isTokenValid,
      hasStoredUser: !!user,
      expiresAt,
    };
  } catch (err) {
    return {
      user: null,
      accessToken: null,
      isTokenValid: false,
      hasStoredUser: false,
    };
  }
}

/**
 * Clear stored Drive session on account disconnect
 */
export function clearStoredDriveSession(): void {
  try {
    const current = getStoredDriveSession();
    if (current.user?.email) {
      localStorage.setItem(STORAGE_KEY_PREV_DISCONNECTED_EMAIL, current.user.email);
    }
    localStorage.removeItem(STORAGE_KEY_TOKEN_DATA);
    localStorage.removeItem(STORAGE_KEY_CONNECTED_USER);
  } catch (err) {
    // ignore
  }
  cachedAccessToken = null;
  cachedDriveUser = null;
}

/**
 * Track last synced Google email to automatically detect when a new email connects
 */
export function getLastSyncedDriveEmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNCED_EMAIL);
  } catch {
    return null;
  }
}

export function saveLastSyncedDriveEmail(email: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SYNCED_EMAIL, email.trim().toLowerCase());
  } catch {
    // ignore
  }
}

export function getPrevDisconnectedEmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PREV_DISCONNECTED_EMAIL);
  } catch {
    return null;
  }
}

export function getStoredCustomOAuthClientId(): string {
  try {
    const config = firebaseConfig as Record<string, any>;
    return localStorage.getItem(CUSTOM_CLIENT_ID_KEY) || config.oAuthClientId || '389943074417-c22skhgilllv4g5s57094voeb1eu7ag6.apps.googleusercontent.com';
  } catch {
    const config = firebaseConfig as Record<string, any>;
    return config.oAuthClientId || '389943074417-c22skhgilllv4g5s57094voeb1eu7ag6.apps.googleusercontent.com';
  }
}

export function saveStoredCustomOAuthClientId(clientId: string): void {
  try {
    localStorage.setItem(CUSTOM_CLIENT_ID_KEY, clientId.trim());
  } catch {
    // ignore
  }
}

/**
 * Initialize Auth State Listener with Persistent Session Restoration
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: User | GoogleDriveUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // 1. Immediately check persistent session from localStorage
  const session = getStoredDriveSession();
  if (session.user && session.accessToken && session.isTokenValid) {
    cachedAccessToken = session.accessToken;
    cachedDriveUser = session.user;
    if (onAuthSuccess) {
      onAuthSuccess(session.user as any, session.accessToken);
    }
  } else if (session.user) {
    // We remember the user email, keep cached user profile so UI shows connected email
    cachedDriveUser = session.user;
    if (session.accessToken) {
      cachedAccessToken = session.accessToken;
    }
    if (onAuthSuccess && session.accessToken) {
      onAuthSuccess(session.user as any, session.accessToken);
    }
  }

  // 2. Also listen for Firebase auth changes
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const currentToken = cachedAccessToken || getStoredDriveSession().accessToken;
      if (currentToken) {
        if (onAuthSuccess) onAuthSuccess(user, currentToken);
      }
    } else {
      const activeSession = getStoredDriveSession();
      if (!activeSession.isTokenValid && !cachedAccessToken) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Fetch Google Profile via Access Token
 */
export async function fetchGoogleProfile(accessToken: string): Promise<GoogleDriveUser> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        uid: data.id || 'google_user',
        email: data.email || '',
        displayName: data.name || data.email || 'Google User',
        photoUrl: data.picture || undefined,
      };
    }
  } catch (err) {
    console.warn('Profile fetch warning:', err);
  }
  return {
    uid: 'google_user_' + Date.now(),
    email: 'connected@google.account',
    displayName: 'Google Drive User',
  };
}

/**
 * Request Access Token directly via Google Identity Services (GSI)
 * This avoids Firebase unauthorized-domain errors on custom domains like rawaltools.com
 */
export function signInWithGsiTokenClient(
  customClientId?: string,
  userHint?: string
): Promise<{
  user: GoogleDriveUser;
  accessToken: string;
  isNewAccount: boolean;
  previousEmail: string | null;
}> {
  return new Promise((resolve, reject) => {
    const clientId = customClientId || getStoredCustomOAuthClientId();

    if (typeof window === 'undefined') {
      return reject(new Error('Window environment required'));
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services (GSI) library is loading. Please retry in a second.'));
    }

    const stored = getStoredDriveSession();
    const hint = userHint || stored.user?.email || undefined;

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope:
        'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      hint,
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        if (!tokenResponse.access_token) {
          reject(new Error('No access token returned by Google'));
          return;
        }

        const token = tokenResponse.access_token;
        const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3599;

        const profile = await fetchGoogleProfile(token);

        // Detect if this is a newly connected email or changed account
        const lastSynced = getLastSyncedDriveEmail();
        const prevDisconnected = getPrevDisconnectedEmail();
        const isNewAccount =
          !lastSynced ||
          lastSynced.toLowerCase() !== profile.email.toLowerCase() ||
          (prevDisconnected !== null && prevDisconnected.toLowerCase() !== profile.email.toLowerCase());

        // Save persistently so login persists indefinitely
        saveStoredDriveSession(profile, token, expiresIn);

        resolve({
          user: profile,
          accessToken: token,
          isNewAccount,
          previousEmail: lastSynced || prevDisconnected,
        });
      },
    });

    tokenClient.requestAccessToken({ prompt: hint ? '' : 'consent' });
  });
}

/**
 * Sign In with Google and request Google Drive Scopes
 * Gracefully handles Firebase errors, falls back to GSI, and saves persistent session
 */
export const signInWithGoogleDrive = async (
  customClientId?: string,
  userHint?: string
): Promise<{
  user: GoogleDriveUser;
  accessToken: string;
  isNewAccount: boolean;
  previousEmail: string | null;
} | null> => {
  isSigningIn = true;

  // Try Google Identity Services (GSI) first if script is ready
  const google = typeof window !== 'undefined' ? (window as any).google : null;
  if (google?.accounts?.oauth2) {
    try {
      const gsiResult = await signInWithGsiTokenClient(customClientId, userHint);
      isSigningIn = false;
      return gsiResult;
    } catch (gsiErr: any) {
      console.warn('GSI Token Client attempt failed, trying Firebase Auth fallback:', gsiErr);
    }
  }

  // Fallback to Firebase Popup
  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Drive access token from authentication.');
    }

    const driveUser: GoogleDriveUser = {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || result.user.email || 'Google User',
      photoUrl: result.user.photoURL || undefined,
    };

    // Detect if new account
    const lastSynced = getLastSyncedDriveEmail();
    const prevDisconnected = getPrevDisconnectedEmail();
    const isNewAccount =
      !lastSynced ||
      lastSynced.toLowerCase() !== driveUser.email.toLowerCase() ||
      (prevDisconnected !== null && prevDisconnected.toLowerCase() !== driveUser.email.toLowerCase());

    // Save persistently
    saveStoredDriveSession(driveUser, credential.accessToken, 3500);

    return {
      user: driveUser,
      accessToken: credential.accessToken,
      isNewAccount,
      previousEmail: lastSynced || prevDisconnected,
    };
  } catch (error: any) {
    console.warn('Firebase Sign-in Error:', error);

    // If unauthorized domain, retry with GSI
    if (error.code === 'auth/unauthorized-domain') {
      if (google?.accounts?.oauth2) {
        return await signInWithGsiTokenClient(customClientId, userHint);
      }
      throw new Error(
        `Domain not authorized in Firebase Auth. Added direct Google Identity Services client. Please click retry.`
      );
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached or stored access token
 */
export const getDriveAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  const session = getStoredDriveSession();
  if (session.accessToken) {
    cachedAccessToken = session.accessToken;
    if (session.user) cachedDriveUser = session.user;
    return session.accessToken;
  }
  return null;
};

/**
 * Get currently connected user profile (from memory or persistent storage)
 */
export const getConnectedDriveUser = (): GoogleDriveUser | null => {
  if (cachedDriveUser) return cachedDriveUser;
  const session = getStoredDriveSession();
  if (session.user) {
    cachedDriveUser = session.user;
    return session.user;
  }
  return null;
};

/**
 * Manually set access token if provided from external handler or manual token input
 */
export const setDriveAccessToken = (token: string | null, user?: GoogleDriveUser) => {
  cachedAccessToken = token;
  if (token && user) {
    saveStoredDriveSession(user, token, 3500);
  } else if (token) {
    fetchGoogleProfile(token).then((p) => {
      cachedDriveUser = p;
      saveStoredDriveSession(p, token, 3500);
    });
  } else {
    clearStoredDriveSession();
  }
};

/**
 * Disconnect Google Drive account with explicit confirmation support
 */
export const disconnectGoogleDriveAccount = async (
  options: { skipConfirm?: boolean } = {}
): Promise<{ success: boolean; disconnectedEmail: string | null }> => {
  const current = getConnectedDriveUser();
  const currentEmail = current?.email || 'Connected Google Account';

  if (!options.skipConfirm && typeof window !== 'undefined') {
    const confirmed = window.confirm(
      `کیا آپ گوگل ڈرائیو کا اکاؤنٹ (${currentEmail}) ڈسکیکٹ کرنا چاہتے ہیں؟\n\nآپ کا اسٹور ڈیٹا محفوظ رہے گا، اور جب آپ دوسرا ای میل کنیکٹ کریں گے تو تمام ڈیٹا خودکار طور پر نئے گوگل ڈرائیو میں سنک ہو جائے گا۔`
    );
    if (!confirmed) {
      return { success: false, disconnectedEmail: null };
    }
  }

  // Revoke GSI token if available
  try {
    const token = cachedAccessToken || getStoredDriveSession().accessToken;
    const google = typeof window !== 'undefined' ? (window as any).google : null;
    if (token && google?.accounts?.oauth2?.revoke) {
      google.accounts.oauth2.revoke(token, () => {
        console.log('Google OAuth token revoked');
      });
    }
  } catch {
    // ignore
  }

  try {
    await signOut(auth);
  } catch {
    // ignore
  }

  const disconnectedEmail = current?.email || null;
  clearStoredDriveSession();

  return { success: true, disconnectedEmail };
};

/**
 * Sign Out and clear cached token (backward compatibility)
 */
export const signOutGoogleDrive = async () => {
  return await disconnectGoogleDriveAccount({ skipConfirm: true });
};

/**
 * Convert Base64 / Data URL to Blob for Drive Upload
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Helper to generate direct preview URL for Drive Image
 */
export function getDriveDirectImageUrl(fileId: string): string {
  // Using direct Google User Content thumbnail / display URL with high resolution
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Find or Create a Folder in Google Drive
 */
export async function findOrCreateDriveFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  // Check if folder already exists
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    throw new Error(`Drive folder search failed: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const createdData = await createRes.json();
  return createdData.id;
}

/**
 * Get or Create the Root Vault Folder & Category Folders
 */
export async function getOrCreateAppDriveStructure(category = 'products'): Promise<{
  rootFolderId: string;
  categoryFolderId: string;
}> {
  const rootFolderId = await findOrCreateDriveFolder(ROOT_VAULT_FOLDER_NAME);
  const categoryFolderId = await findOrCreateDriveFolder(category, rootFolderId);
  return { rootFolderId, categoryFolderId };
}

/**
 * Make file publicly accessible for web embedding
 */
export async function makeDriveFilePublic(fileId: string): Promise<void> {
  const token = getDriveAccessToken();
  if (!token) return;

  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (err) {
    console.warn('Could not set public permission on Drive file:', err);
  }
}

/**
 * Upload Image (Blob or DataURL) to Google Drive
 */
export async function uploadImageToGoogleDrive(
  imageSource: Blob | File | string,
  fileName: string,
  category = 'products',
  meta: {
    title?: string;
    description?: string;
    makePublic?: boolean;
  } = {}
): Promise<{
  fileId: string;
  name: string;
  directUrl: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  fileSize?: number;
}> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive. Please Sign In with Google.');

  // 1. Ensure folder structure exists
  const { categoryFolderId } = await getOrCreateAppDriveStructure(category);

  // 2. Prepare Blob
  let blob: Blob;
  if (typeof imageSource === 'string') {
    blob = dataUrlToBlob(imageSource);
  } else {
    blob = imageSource;
  }

  // 3. Metadata for Drive File
  const metadata = {
    name: fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.webp') ? fileName : `${fileName}.jpg`,
    parents: [categoryFolderId],
    description: meta.description || meta.title || 'Uploaded via Rawal Tools Media Manager',
  };

  // 4. Multipart upload boundary
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const base64DataPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const base64Data = await base64DataPromise;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${blob.type || 'image/jpeg'}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink,size',
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
    const errBody = await uploadRes.text();
    throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errBody}`);
  }

  const uploadedFile = await uploadRes.json();

  // Make public so it can be previewed seamlessly inside web app
  if (meta.makePublic !== false) {
    await makeDriveFilePublic(uploadedFile.id);
  }

  const directUrl = getDriveDirectImageUrl(uploadedFile.id);

  return {
    fileId: uploadedFile.id,
    name: uploadedFile.name,
    directUrl,
    webViewLink: uploadedFile.webViewLink,
    webContentLink: uploadedFile.webContentLink,
    thumbnailLink: uploadedFile.thumbnailLink || directUrl,
    fileSize: uploadedFile.size ? parseInt(uploadedFile.size, 10) : blob.size,
  };
}

/**
 * List Images from Google Drive
 */
export async function listGoogleDriveImages(options: {
  folderId?: string;
  pageSize?: number;
  searchQuery?: string;
} = {}): Promise<GoogleDriveFile[]> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  const { folderId, pageSize = 40, searchQuery } = options;

  let q = "mimeType contains 'image/' and trashed = false";
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }
  if (searchQuery) {
    q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&pageSize=${pageSize}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,createdTime,modifiedTime,parents)&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to list files from Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Delete a file from Google Drive (with Mandatory Confirmation per guidelines)
 */
export async function deleteGoogleDriveFile(
  fileId: string,
  fileName = 'file',
  skipConfirm = false
): Promise<boolean> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  if (!skipConfirm) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}" from Google Drive? This action cannot be undone.`
    );
    if (!confirmed) return false;
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete Google Drive file: ${res.statusText}`);
  }

  return true;
}

/**
 * Batch Sync Unsynced Media Items to Google Drive
 */
export async function syncAllMediaToGoogleDrive(
  items: MediaItem[],
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<{
  syncedItems: MediaItem[];
  uploadedCount: number;
  errors: { itemId: string; error: string }[];
}> {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Please Sign In with Google to sync media with Google Drive.');

  const updatedItems = [...items];
  let uploadedCount = 0;
  const errors: { itemId: string; error: string }[] = [];

  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];

    // If already synced and has driveFileId, skip unless requested
    if (item.isSyncedToDrive && item.driveFileId) {
      continue;
    }

    if (onProgress) {
      onProgress(i + 1, updatedItems.length, item.title || item.fileName);
    }

    try {
      // Upload
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

      // Update item metadata
      updatedItems[i] = {
        ...item,
        isSyncedToDrive: true,
        driveFileId: res.fileId,
        driveWebViewLink: res.webViewLink,
        driveWebContentLink: res.webContentLink,
        driveThumbnailUrl: res.thumbnailLink,
        driveSyncedAt: new Date().toISOString(),
      };
      uploadedCount++;
    } catch (err: any) {
      console.error(`Error syncing media ${item.id} to Drive:`, err);
      errors.push({ itemId: item.id, error: err.message || 'Upload failed' });
    }
  }

  return { syncedItems: updatedItems, uploadedCount, errors };
}
