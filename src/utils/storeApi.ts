/**
 * Store API Client
 * Facilitates bidirectional synchronization between client storage and server persistent database.
 * Ensures entered WhatsApp numbers, products, page content, and settings are never lost after cache clear.
 */

import { 
  StoreSettings, 
  Product, 
  PageContent, 
  AdSettings, 
  CustomJsSettings, 
  BlogPost, 
  TeamMember, 
  ProductReview, 
  AdminAccountsConfig 
} from '../types';

export interface FullStorePayload {
  settings?: StoreSettings;
  products?: Product[];
  pageContent?: PageContent;
  adSettings?: AdSettings;
  customJsSettings?: CustomJsSettings;
  blogPosts?: BlogPost[];
  teamMembers?: TeamMember[];
  reviews?: ProductReview[];
  adminAccounts?: AdminAccountsConfig;
}

export interface ServerStoreResponse {
  success: boolean;
  isCustomized: boolean;
  lastUpdated: string;
  data: {
    settings: StoreSettings;
    products: Product[];
    pageContent: PageContent;
    adSettings: AdSettings;
    customJsSettings: CustomJsSettings;
    blogPosts: BlogPost[];
    teamMembers: TeamMember[];
    reviews: ProductReview[];
    adminAccounts: AdminAccountsConfig;
    isCustomized: boolean;
    lastUpdated: string;
  };
  error?: string;
}

// Debounce timer map to batch rapid edits (e.g. typing text)
const debounceTimers: Record<string, any> = {};

/**
 * Fetch latest persistent store state from the server
 */
export async function fetchServerStoreData(): Promise<ServerStoreResponse | null> {
  try {
    const res = await fetch(`/api/store/data?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[StoreApi] Server returned ${res.status} when fetching store data`);
      return null;
    }

    const data: ServerStoreResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('[StoreApi] Network error fetching server store data:', err);
    return null;
  }
}

/**
 * Save full store updates to persistent server storage
 */
export async function saveServerStoreData(payload: FullStorePayload): Promise<boolean> {
  try {
    const res = await fetch('/api/store/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[StoreApi] Failed to save store data: HTTP ${res.status}`);
      return false;
    }

    const result = await res.json();
    return Boolean(result.success);
  } catch (err) {
    console.error('[StoreApi] Error posting store data to server:', err);
    return false;
  }
}

/**
 * Save a single store section to the server with optional debouncing for text inputs
 */
export function pushStoreSectionToServer(
  section: 'settings' | 'products' | 'pageContent' | 'adSettings' | 'customJsSettings' | 'blogPosts' | 'teamMembers' | 'reviews' | 'adminAccounts',
  data: any,
  debounceMs = 600
): void {
  if (debounceTimers[section]) {
    clearTimeout(debounceTimers[section]);
  }

  debounceTimers[section] = setTimeout(async () => {
    try {
      await fetch('/api/store/section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ section, data }),
      });
      delete debounceTimers[section];
    } catch (err) {
      console.warn(`[StoreApi] Error syncing section "${section}":`, err);
    }
  }, debounceMs);
}

/**
 * Server-side Admin Logout
 */
export async function logoutAdminOnServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/logout', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    return res.ok;
  } catch {
    return true; // Still proceed client-side
  }
}
