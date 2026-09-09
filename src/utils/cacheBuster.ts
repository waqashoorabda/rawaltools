/**
 * Auto-Cache & Cookie Management Engine
 * Ensures 100% fresh app delivery across all devices:
 * - Desktop & Laptops (Windows, Mac, Linux - Chrome, Edge, Safari, Firefox)
 * - Mobile Phones (Android Chrome, Samsung Internet, iOS Safari, PWA mode)
 * - Tablets & iPads
 */

const CLIENT_BUILD_TOKEN = `build-${Date.now()}`;
const STORED_VERSION_KEY = 'rt_app_build_version';
const LAST_CACHE_PURGE_KEY = 'rt_last_cache_purge_timestamp';

export interface AppVersionState {
  currentVersion: string;
  serverVersion?: string;
  isUpToDate: boolean;
  lastChecked: number;
}

let versionCheckInterval: any = null;
let isCheckingVersion = false;

/**
 * Clear all accessible cookies for the current domain and path
 */
export function clearAllBrowserCookies(): void {
  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        // Expire cookie on root path and various path depths
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};SameSite=Lax`;
        
        // In case hostname has subdomain
        const hostParts = window.location.hostname.split('.');
        if (hostParts.length > 2) {
          const rootDomain = hostParts.slice(-2).join('.');
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${rootDomain};SameSite=Lax`;
        }
      }
    }
    console.info('[CacheBuster] All client cookies cleared successfully.');
  } catch (err) {
    console.warn('[CacheBuster] Error clearing cookies:', err);
  }
}

/**
 * Unregister any service workers and clear browser CacheStorage API
 */
export async function purgeServiceWorkersAndCacheStorage(): Promise<void> {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.info('[CacheBuster] Unregistered service worker:', registration.scope);
      }
    }

    // 2. Clear browser Cache Storage API (PWAs / Safari / Chrome Cache)
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      for (const name of cacheNames) {
        await window.caches.delete(name);
        console.info('[CacheBuster] Deleted CacheStorage pool:', name);
      }
    }
  } catch (err) {
    console.warn('[CacheBuster] CacheStorage purge warning:', err);
  }
}

/**
 * Force purge cache, unregister workers, clear cookies and perform a fresh reload
 */
export async function forcePurgeAndReloadFresh(reason = 'manual_trigger'): Promise<void> {
  console.info(`[CacheBuster] Triggering hard purge & fresh reload (Reason: ${reason})`);
  
  try {
    // 1. Clear Cookies
    clearAllBrowserCookies();

    // 2. Clear Cache Storage & Workers
    await purgeServiceWorkersAndCacheStorage();

    // 3. Clear session storage
    try {
      sessionStorage.clear();
    } catch (_) {}

    // Record last purge timestamp
    localStorage.setItem(LAST_CACHE_PURGE_KEY, Date.now().toString());

    // 4. Force reload with fresh timestamp query to bust intermediate ISP/network caches
    const url = new URL(window.location.href);
    url.searchParams.set('fresh', Date.now().toString());
    
    window.location.replace(url.toString());
  } catch (err) {
    // Fallback hard reload
    window.location.reload();
  }
}

/**
 * Check if the server has a newer build version deployed
 */
export async function checkServerAppVersion(): Promise<{ hasUpdate: boolean; serverVersion: string; currentVersion: string }> {
  if (isCheckingVersion) {
    return { hasUpdate: false, serverVersion: '', currentVersion: CLIENT_BUILD_TOKEN };
  }

  isCheckingVersion = true;
  try {
    const response = await fetch(`/api/version?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { hasUpdate: false, serverVersion: '', currentVersion: CLIENT_BUILD_TOKEN };
    }

    const data = await response.json();
    const serverVersion = data.version;
    const storedVersion = localStorage.getItem(STORED_VERSION_KEY);

    // If first load, save current server version
    if (!storedVersion) {
      if (serverVersion) {
        localStorage.setItem(STORED_VERSION_KEY, serverVersion);
      }
      return { hasUpdate: false, serverVersion, currentVersion: CLIENT_BUILD_TOKEN };
    }

    // If version changed, an update was deployed
    const hasUpdate = Boolean(serverVersion && storedVersion && serverVersion !== storedVersion);
    if (hasUpdate) {
      console.info(`[CacheBuster] New app version detected: Server=${serverVersion}, Stored=${storedVersion}`);
    }

    return {
      hasUpdate,
      serverVersion: serverVersion || '',
      currentVersion: storedVersion || CLIENT_BUILD_TOKEN,
    };
  } catch (err) {
    return { hasUpdate: false, serverVersion: '', currentVersion: CLIENT_BUILD_TOKEN };
  } finally {
    isCheckingVersion = false;
  }
}

/**
 * Master initializer for automatic cache invalidation
 * Run on main app initialization
 */
export function initAutoCacheBuster(): void {
  // 1. Unregister any rogue service workers and purge CacheStorage on startup
  purgeServiceWorkersAndCacheStorage();

  // 2. Clean URL if ?fresh= parameter was used
  if (typeof window !== 'undefined' && window.location.search.includes('fresh=')) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('fresh');
      const cleanUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (_) {}
  }

  // 3. Initial Version check
  checkServerAppVersion().then((result) => {
    if (result.hasUpdate && result.serverVersion) {
      // Auto-update stored version token and dispatch update event
      localStorage.setItem(STORED_VERSION_KEY, result.serverVersion);
      window.dispatchEvent(new CustomEvent('app_version_updated', { detail: result }));
    }
  });

  // 4. Listen to visibility change (when mobile users unlock phone or switch back to browser tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkServerAppVersion().then((result) => {
        if (result.hasUpdate) {
          window.dispatchEvent(new CustomEvent('app_version_updated', { detail: result }));
        }
      });
    }
  });

  // 5. Periodic version check every 4 minutes
  if (!versionCheckInterval) {
    versionCheckInterval = setInterval(() => {
      checkServerAppVersion().then((result) => {
        if (result.hasUpdate) {
          window.dispatchEvent(new CustomEvent('app_version_updated', { detail: result }));
        }
      });
    }, 4 * 60 * 1000);
  }
}
