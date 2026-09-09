import fs from 'fs';
import path from 'path';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '../src/data/defaultProducts.js';
import { DEFAULT_PAGE_CONTENT } from '../src/data/defaultPageContent.js';
import { DEFAULT_AD_SETTINGS } from '../src/data/defaultAdSettings.js';
import { DEFAULT_CUSTOM_JS_SETTINGS } from '../src/data/defaultCustomJs.js';
import { DEFAULT_BLOG_POSTS } from '../src/data/defaultBlogPosts.js';
import { DEFAULT_TEAM_MEMBERS } from '../src/data/defaultTeam.js';
import { DEFAULT_ADMIN_ACCOUNTS } from '../src/data/defaultAdminAccounts.js';
import { DEFAULT_REVIEWS } from '../src/data/defaultReviews.js';

export interface ServerStoreDatabase {
  isCustomized: boolean;
  lastUpdated: string;
  settings: typeof DEFAULT_SETTINGS;
  products: typeof DEFAULT_PRODUCTS;
  pageContent: typeof DEFAULT_PAGE_CONTENT;
  adSettings: typeof DEFAULT_AD_SETTINGS;
  customJsSettings: typeof DEFAULT_CUSTOM_JS_SETTINGS;
  blogPosts: typeof DEFAULT_BLOG_POSTS;
  teamMembers: typeof DEFAULT_TEAM_MEMBERS;
  reviews: typeof DEFAULT_REVIEWS;
  adminAccounts: typeof DEFAULT_ADMIN_ACCOUNTS;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store_database.json');
const BACKUP_FILE = path.join(DATA_DIR, 'store_database.backup.json');

// In-memory cache for fast lookups
let inMemoryDatabase: ServerStoreDatabase | null = null;

function getDefaultDatabase(): ServerStoreDatabase {
  return {
    isCustomized: false,
    lastUpdated: new Date().toISOString(),
    settings: DEFAULT_SETTINGS,
    products: DEFAULT_PRODUCTS,
    pageContent: DEFAULT_PAGE_CONTENT,
    adSettings: DEFAULT_AD_SETTINGS,
    customJsSettings: DEFAULT_CUSTOM_JS_SETTINGS,
    blogPosts: DEFAULT_BLOG_POSTS,
    teamMembers: DEFAULT_TEAM_MEMBERS,
    reviews: DEFAULT_REVIEWS,
    adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
  };
}

/**
 * Ensures data directory and JSON database file exist on disk
 */
export function initStoreDatabase(): ServerStoreDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryDatabase = {
        ...getDefaultDatabase(),
        ...parsed,
        // Preserve arrays properly
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : DEFAULT_PRODUCTS,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        pageContent: { ...DEFAULT_PAGE_CONTENT, ...(parsed.pageContent || {}) },
        adSettings: { ...DEFAULT_AD_SETTINGS, ...(parsed.adSettings || {}) },
        customJsSettings: { ...DEFAULT_CUSTOM_JS_SETTINGS, ...(parsed.customJsSettings || {}) },
        blogPosts: Array.isArray(parsed.blogPosts) ? parsed.blogPosts : DEFAULT_BLOG_POSTS,
        teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : DEFAULT_TEAM_MEMBERS,
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : DEFAULT_REVIEWS,
        adminAccounts: { ...DEFAULT_ADMIN_ACCOUNTS, ...(parsed.adminAccounts || {}) },
      };
      console.info(`[ServerStore] Loaded persistent database from ${STORE_FILE} (${inMemoryDatabase.products.length} products, isCustomized: ${inMemoryDatabase.isCustomized})`);
      return inMemoryDatabase;
    }

    // Initialize with defaults if file doesn't exist yet
    inMemoryDatabase = getDefaultDatabase();
    saveDatabaseToDisk(inMemoryDatabase);
    console.info(`[ServerStore] Initialized brand new persistent database at ${STORE_FILE}`);
    return inMemoryDatabase;
  } catch (err) {
    console.error('[ServerStore] Error initializing store database:', err);
    inMemoryDatabase = getDefaultDatabase();
    return inMemoryDatabase;
  }
}

/**
 * Atomic write to disk with backup copy to prevent data loss or corruption
 */
function saveDatabaseToDisk(db: ServerStoreDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const jsonString = JSON.stringify(db, null, 2);
    const tempFile = `${STORE_FILE}.tmp-${Date.now()}`;

    // Write to temp file first
    fs.writeFileSync(tempFile, jsonString, 'utf-8');

    // Create backup of existing file if it exists
    if (fs.existsSync(STORE_FILE)) {
      try {
        fs.copyFileSync(STORE_FILE, BACKUP_FILE);
      } catch (backupErr) {
        console.warn('[ServerStore] Backup copy warning:', backupErr);
      }
    }

    // Atomically rename temp file to real file
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    console.error('[ServerStore] Failed to write database to disk:', err);
    throw err;
  }
}

/**
 * Get current store database
 */
export function getStoreDatabase(): ServerStoreDatabase {
  if (!inMemoryDatabase) {
    return initStoreDatabase();
  }
  return inMemoryDatabase;
}

/**
 * Save store updates to persistent database
 */
export function saveStoreDatabase(updates: Partial<ServerStoreDatabase>): ServerStoreDatabase {
  const current = getStoreDatabase();

  const updated: ServerStoreDatabase = {
    ...current,
    ...updates,
    isCustomized: true, // User has explicitly entered or modified data
    lastUpdated: new Date().toISOString(),
  };

  // Preserve nested objects properly if provided
  if (updates.settings) {
    updated.settings = { ...current.settings, ...updates.settings };
  }
  if (updates.pageContent) {
    updated.pageContent = { ...current.pageContent, ...updates.pageContent };
  }
  if (updates.adSettings) {
    updated.adSettings = { ...current.adSettings, ...updates.adSettings };
  }
  if (updates.customJsSettings) {
    updated.customJsSettings = { ...current.customJsSettings, ...updates.customJsSettings };
  }
  if (updates.adminAccounts) {
    updated.adminAccounts = { ...current.adminAccounts, ...updates.adminAccounts };
  }
  if (Array.isArray(updates.products)) {
    updated.products = updates.products;
  }
  if (Array.isArray(updates.blogPosts)) {
    updated.blogPosts = updates.blogPosts;
  }
  if (Array.isArray(updates.teamMembers)) {
    updated.teamMembers = updates.teamMembers;
  }
  if (Array.isArray(updates.reviews)) {
    updated.reviews = updates.reviews;
  }

  inMemoryDatabase = updated;
  saveDatabaseToDisk(updated);
  console.info(`[ServerStore] Saved persistent store updates on disk. Store: "${updated.settings.storeName}", WhatsApp: "${updated.settings.whatsappNumber}", Products: ${updated.products.length}`);
  return updated;
}
