import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '../data/defaultProducts';
import { DEFAULT_PAGE_CONTENT } from '../data/defaultPageContent';
import { DEFAULT_AD_SETTINGS } from '../data/defaultAdSettings';
import { DEFAULT_CUSTOM_JS_SETTINGS } from '../data/defaultCustomJs';
import { DEFAULT_BLOG_POSTS } from '../data/defaultBlogPosts';
import { DEFAULT_TEAM_MEMBERS } from '../data/defaultTeam';
import { DEFAULT_ADMIN_ACCOUNTS } from '../data/defaultAdminAccounts';
import { DEFAULT_REVIEWS } from '../data/defaultReviews';
import { 
  CartItem, 
  Product, 
  StoreSettings, 
  PageContent, 
  AdSettings, 
  CustomJsSettings, 
  BlogPost, 
  CookieConsentSettings, 
  TeamMember,
  AdminAccountsConfig,
  AdminAccount,
  AdminRole,
  AdminPermission,
  ProductReview,
  ReviewStats
} from '../types';

export const APP_BUILD_SYNC_VERSION = '2026.08.27.v5_sync';
const VERSION_KEY = 'rawal_tools_build_version_v1';

const PRODUCTS_KEY = 'rawal_tools_products_v1';
const SETTINGS_KEY = 'rawal_tools_settings_v1';
const CART_KEY = 'rawal_tools_cart_v1';
const PAGE_CONTENT_KEY = 'rawal_tools_page_content_v1';
const AD_SETTINGS_KEY = 'rawal_tools_ads_v1';
const CUSTOM_JS_KEY = 'rawal_tools_custom_js_v1';
const BLOG_POSTS_KEY = 'rawal_tools_blog_posts_v1';
const COOKIE_CONSENT_KEY = 'rawal_tools_cookie_consent_v1';
const TEAM_MEMBERS_KEY = 'rawal_tools_team_members_v1';
const ADMIN_SESSION_KEY = 'rawal_tools_admin_session_v1';
const ADMIN_ACCOUNTS_KEY = 'rawal_tools_admin_accounts_v1';
const ADMIN_ACTIVE_ROLE_KEY = 'rawal_tools_active_admin_role_v1';
const REVIEWS_KEY = 'rawal_tools_reviews_v1';

/**
 * Check if the browser cache is holding an older build version and sync
 */
export function checkAndPerformAutoBuildSync(): boolean {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== APP_BUILD_SYNC_VERSION) {
      localStorage.setItem(VERSION_KEY, APP_BUILD_SYNC_VERSION);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Purges all stale localStorage, resets cache, loads fresh defaults from codebase and reloads
 */
export function purgeCacheAndSyncLatest(): void {
  try {
    const keysToRemove = [
      PRODUCTS_KEY,
      SETTINGS_KEY,
      CART_KEY,
      PAGE_CONTENT_KEY,
      AD_SETTINGS_KEY,
      CUSTOM_JS_KEY,
      BLOG_POSTS_KEY,
      COOKIE_CONSENT_KEY,
      TEAM_MEMBERS_KEY,
      'rawal_tools_media_items_v1',
      'rawal_tools_media_folders_v1',
    ];

    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, APP_BUILD_SYNC_VERSION);

    // Clear cookies where accessible
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });

    // Unregister any cached service workers if present
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }

    // Force hard reload from server
    window.location.reload();
  } catch (err) {
    console.error('Error purging cache:', err);
    window.location.reload();
  }
}

/**
 * Admin Session & Multi-Role helpers
 */
export function isStoredAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated' || sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

export const getStoredAdminAuthenticated = isStoredAdminAuthenticated;

export function setStoredAdminAuthenticated(status: boolean): void {
  try {
    if (status) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_ACTIVE_ROLE_KEY);
      sessionStorage.removeItem(ADMIN_ACTIVE_ROLE_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadStoredAdminAccounts(): AdminAccountsConfig {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ADMIN_ACCOUNTS));
      return DEFAULT_ADMIN_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return {
      superAdmin: { ...DEFAULT_ADMIN_ACCOUNTS.superAdmin, ...(parsed.superAdmin || {}) },
      subAdmin1: { ...DEFAULT_ADMIN_ACCOUNTS.subAdmin1, ...(parsed.subAdmin1 || {}) },
      subAdmin2: { ...DEFAULT_ADMIN_ACCOUNTS.subAdmin2, ...(parsed.subAdmin2 || {}) },
    };
  } catch (err) {
    console.error('Error loading admin accounts:', err);
    return DEFAULT_ADMIN_ACCOUNTS;
  }
}

export function saveStoredAdminAccounts(config: AdminAccountsConfig): void {
  try {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving admin accounts:', err);
  }
}

export function getStoredActiveAdminRole(): AdminRole {
  try {
    const role = (localStorage.getItem(ADMIN_ACTIVE_ROLE_KEY) || sessionStorage.getItem(ADMIN_ACTIVE_ROLE_KEY)) as AdminRole;
    if (role === 'super_admin' || role === 'sub_admin_1' || role === 'sub_admin_2') {
      return role;
    }
    return 'super_admin';
  } catch {
    return 'super_admin';
  }
}

export function setStoredActiveAdminRole(role: AdminRole): void {
  try {
    localStorage.setItem(ADMIN_ACTIVE_ROLE_KEY, role);
    sessionStorage.setItem(ADMIN_ACTIVE_ROLE_KEY, role);
  } catch {
    // ignore
  }
}

/**
 * Validates PIN against all active admin accounts
 */
export function authenticateAdminCredentials(
  enteredPin: string,
  accounts: AdminAccountsConfig,
  preferredRole?: AdminRole
): { success: boolean; account?: AdminAccount; role?: AdminRole; error?: string } {
  const pin = enteredPin.trim();
  if (!pin) {
    return { success: false, error: 'Please enter a PIN / Password.' };
  }

  // If specific role requested
  if (preferredRole) {
    const account = preferredRole === 'super_admin'
      ? accounts.superAdmin
      : preferredRole === 'sub_admin_1'
      ? accounts.subAdmin1
      : accounts.subAdmin2;

    if (!account.isActive) {
      return { success: false, error: 'This Admin account has been disabled by the Super Admin.' };
    }

    if (account.pin.trim() === pin) {
      return { success: true, account, role: account.role };
    }

    return { success: false, error: 'Incorrect PIN for the selected account.' };
  }

  // Check Super Admin first
  if (accounts.superAdmin.pin.trim() === pin) {
    return { success: true, account: accounts.superAdmin, role: 'super_admin' };
  }

  // Check Sub Admin 1
  if (accounts.subAdmin1.isActive && accounts.subAdmin1.pin.trim() === pin) {
    return { success: true, account: accounts.subAdmin1, role: 'sub_admin_1' };
  }

  // Check Sub Admin 2
  if (accounts.subAdmin2.isActive && accounts.subAdmin2.pin.trim() === pin) {
    return { success: true, account: accounts.subAdmin2, role: 'sub_admin_2' };
  }

  return { success: false, error: 'Invalid PIN. No matching active Admin account found.' };
}

export function hasAdminPermission(
  account: AdminAccount | undefined,
  permission: AdminPermission
): boolean {
  if (!account) return false;
  if (account.role === 'super_admin') return true;
  if (!account.isActive) return false;
  return account.permissions.includes(permission);
}

export function loadStoredTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
    if (!raw) {
      localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(DEFAULT_TEAM_MEMBERS));
      return DEFAULT_TEAM_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_TEAM_MEMBERS;
  } catch (err) {
    console.error('Error loading team members:', err);
    return DEFAULT_TEAM_MEMBERS;
  }
}

export function saveStoredTeamMembers(members: TeamMember[]): void {
  try {
    localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Error saving team members:', err);
  }
}

export const DEFAULT_COOKIE_CONSENT: CookieConsentSettings = {
  hasAnswered: false,
  necessary: true,
  analytics: true,
  advertising: true,
};

export function loadStoredBlogPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem(BLOG_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(BLOG_POSTS_KEY, JSON.stringify(DEFAULT_BLOG_POSTS));
      return DEFAULT_BLOG_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_BLOG_POSTS;
  } catch (err) {
    console.error('Error loading blog posts:', err);
    return DEFAULT_BLOG_POSTS;
  }
}

export function saveStoredBlogPosts(posts: BlogPost[]): void {
  try {
    localStorage.setItem(BLOG_POSTS_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('Error saving blog posts:', err);
  }
}

export function loadStoredCookieConsent(): CookieConsentSettings {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return DEFAULT_COOKIE_CONSENT;
    return { ...DEFAULT_COOKIE_CONSENT, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_COOKIE_CONSENT;
  }
}

export function saveStoredCookieConsent(consent: CookieConsentSettings): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch (err) {
    console.error('Error saving cookie consent:', err);
  }
}


export function loadStoredPageContent(): PageContent {
  try {
    const raw = localStorage.getItem(PAGE_CONTENT_KEY);
    if (!raw) {
      localStorage.setItem(PAGE_CONTENT_KEY, JSON.stringify(DEFAULT_PAGE_CONTENT));
      return DEFAULT_PAGE_CONTENT;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PAGE_CONTENT, ...parsed };
  } catch (err) {
    console.error('Error loading page content:', err);
    return DEFAULT_PAGE_CONTENT;
  }
}

export function saveStoredPageContent(content: PageContent): void {
  try {
    localStorage.setItem(PAGE_CONTENT_KEY, JSON.stringify(content));
  } catch (err) {
    console.error('Error saving page content:', err);
  }
}

export function loadStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PRODUCTS;
  } catch (err) {
    console.error('Error loading stored products:', err);
    return DEFAULT_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products to storage:', err);
  }
}

export function loadStoredSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Error loading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to storage:', err);
  }
}

export function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveStoredCart(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error('Error saving cart:', err);
  }
}

export function resetToDefaultCatalog(): { products: Product[]; settings: StoreSettings } {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return { products: DEFAULT_PRODUCTS, settings: DEFAULT_SETTINGS };
}

export function exportCatalogJSON(products: Product[], settings: StoreSettings): void {
  const data = {
    exportedAt: new Date().toISOString(),
    storeName: settings.storeName,
    settings,
    products,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rawal-tools-catalog-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadStoredAdSettings(): AdSettings {
  try {
    const raw = localStorage.getItem(AD_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(DEFAULT_AD_SETTINGS));
      return DEFAULT_AD_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AD_SETTINGS,
      ...parsed,
      slots: {
        ...DEFAULT_AD_SETTINGS.slots,
        ...(parsed.slots || {}),
      },
    };
  } catch (err) {
    console.error('Error loading Ad settings:', err);
    return DEFAULT_AD_SETTINGS;
  }
}

export function saveStoredAdSettings(settings: AdSettings): void {
  try {
    localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving Ad settings:', err);
  }
}

export function loadStoredCustomJs(): CustomJsSettings {
  try {
    const raw = localStorage.getItem(CUSTOM_JS_KEY);
    if (!raw) {
      localStorage.setItem(CUSTOM_JS_KEY, JSON.stringify(DEFAULT_CUSTOM_JS_SETTINGS));
      return DEFAULT_CUSTOM_JS_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CUSTOM_JS_SETTINGS,
      ...parsed,
      customScripts: parsed.customScripts || DEFAULT_CUSTOM_JS_SETTINGS.customScripts,
    };
  } catch (err) {
    console.error('Error loading Custom JS settings:', err);
    return DEFAULT_CUSTOM_JS_SETTINGS;
  }
}

export function saveStoredCustomJs(settings: CustomJsSettings): void {
  try {
    localStorage.setItem(CUSTOM_JS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving Custom JS settings:', err);
  }
}

/**
 * Reviews & Social Proof Testimonials Storage Helpers
 */
export function loadStoredReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
      return DEFAULT_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return DEFAULT_REVIEWS;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading reviews:', err);
    return DEFAULT_REVIEWS;
  }
}

export function saveStoredReviews(reviews: ProductReview[]): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.error('Error saving reviews:', err);
  }
}

export function getProductReviews(productId: string, includePending = false, reviewsList?: ProductReview[]): ProductReview[] {
  const all = reviewsList || loadStoredReviews();
  return all.filter((r) => {
    if (r.productId !== productId) return false;
    if (includePending) return true;
    return r.status === 'approved';
  });
}

export function getProductReviewStats(productId: string, reviewsList?: ProductReview[]): ReviewStats {
  const approved = getProductReviews(productId, false, reviewsList);
  if (approved.length === 0) {
    return {
      averageRating: 5.0, // default display or 0
      totalReviews: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  approved.forEach((r) => {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
    sum += r.rating;
  });

  const avg = Number((sum / approved.length).toFixed(1));

  return {
    averageRating: avg,
    totalReviews: approved.length,
    ratingCounts,
  };
}

export function addStoredReview(
  newReview: Omit<ProductReview, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): ProductReview[] {
  const current = loadStoredReviews();
  const fullReview: ProductReview = {
    id: newReview.id || `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: newReview.createdAt || new Date().toISOString(),
    productId: newReview.productId,
    customerName: newReview.customerName.trim(),
    customerCity: newReview.customerCity?.trim(),
    rating: Math.min(5, Math.max(1, Number(newReview.rating) || 5)),
    title: newReview.title?.trim(),
    comment: newReview.comment.trim(),
    isVerifiedPurchase: Boolean(newReview.isVerifiedPurchase),
    status: newReview.status || 'approved',
    adminReply: newReview.adminReply?.trim(),
    adminRepliedAt: newReview.adminRepliedAt,
    helpfulCount: newReview.helpfulCount || 0,
  };

  const updated = [fullReview, ...current];
  saveStoredReviews(updated);
  return updated;
}

export function updateStoredReview(updatedReview: ProductReview): ProductReview[] {
  const current = loadStoredReviews();
  const updated = current.map((r) => (r.id === updatedReview.id ? updatedReview : r));
  saveStoredReviews(updated);
  return updated;
}

export function deleteStoredReview(reviewId: string): ProductReview[] {
  const current = loadStoredReviews();
  const updated = current.filter((r) => r.id !== reviewId);
  saveStoredReviews(updated);
  return updated;
}

export function approveStoredReview(reviewId: string): ProductReview[] {
  const current = loadStoredReviews();
  const updated = current.map((r) => (r.id === reviewId ? { ...r, status: 'approved' as const } : r));
  saveStoredReviews(updated);
  return updated;
}

export function rejectStoredReview(reviewId: string): ProductReview[] {
  const current = loadStoredReviews();
  const updated = current.map((r) => (r.id === reviewId ? { ...r, status: 'rejected' as const } : r));
  saveStoredReviews(updated);
  return updated;
}


