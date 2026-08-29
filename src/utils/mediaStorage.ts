import { MediaItem, MediaFolder, MediaCategory, Product, StoreSettings, BlogPost, TeamMember } from '../types';
import { DEFAULT_MEDIA_ITEMS, DEFAULT_MEDIA_FOLDERS } from '../data/defaultMedia';
import JSZip from 'jszip';

const MEDIA_ITEMS_KEY = 'rawal_tools_media_items_v1';
const MEDIA_FOLDERS_KEY = 'rawal_tools_media_folders_v1';

export function loadStoredMediaItems(): MediaItem[] {
  try {
    const raw = localStorage.getItem(MEDIA_ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(MEDIA_ITEMS_KEY, JSON.stringify(DEFAULT_MEDIA_ITEMS));
      return DEFAULT_MEDIA_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_MEDIA_ITEMS;
  } catch (err) {
    console.error('Error loading media items:', err);
    return DEFAULT_MEDIA_ITEMS;
  }
}

export function saveStoredMediaItems(items: MediaItem[]): void {
  try {
    localStorage.setItem(MEDIA_ITEMS_KEY, JSON.stringify(items));
    // Dispatch custom event for real-time reactivity across tabs/components
    window.dispatchEvent(new CustomEvent('rawal_media_updated', { detail: items }));
  } catch (err) {
    console.error('Error saving media items:', err);
  }
}

export function loadStoredMediaFolders(): MediaFolder[] {
  try {
    const raw = localStorage.getItem(MEDIA_FOLDERS_KEY);
    if (!raw) {
      localStorage.setItem(MEDIA_FOLDERS_KEY, JSON.stringify(DEFAULT_MEDIA_FOLDERS));
      return DEFAULT_MEDIA_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_MEDIA_FOLDERS;
  } catch (err) {
    console.error('Error loading media folders:', err);
    return DEFAULT_MEDIA_FOLDERS;
  }
}

export function saveStoredMediaFolders(folders: MediaFolder[]): void {
  try {
    localStorage.setItem(MEDIA_FOLDERS_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error('Error saving media folders:', err);
  }
}

/**
 * Automatically registers or updates any image uploaded across the entire application into the central Media Library
 */
export function registerMediaItem(payload: {
  url: string;
  title?: string;
  titleUrdu?: string;
  description?: string;
  category?: MediaCategory;
  folder?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  tags?: string[];
  associatedId?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveWebContentLink?: string;
  driveThumbnailUrl?: string;
  isSyncedToDrive?: boolean;
  driveSyncedAt?: string;
}): MediaItem {
  const currentItems = loadStoredMediaItems();
  const category: MediaCategory = payload.category || 'custom';
  const defaultFolder = `uploads/${category}`;
  const folder = payload.folder || defaultFolder;

  // Check if identical URL or associated ID already exists in this folder
  const existingIdx = currentItems.findIndex(
    (item) => item.url === payload.url || (payload.associatedId && item.associatedId === payload.associatedId && item.category === category)
  );

  const now = new Date().toISOString();
  let itemToReturn: MediaItem;

  if (existingIdx >= 0) {
    const existing = currentItems[existingIdx];
    const updated: MediaItem = {
      ...existing,
      title: payload.title || existing.title,
      titleUrdu: payload.titleUrdu || existing.titleUrdu,
      description: payload.description || existing.description,
      url: payload.url,
      folder: folder || existing.folder,
      category: category || existing.category,
      fileName: payload.fileName || existing.fileName,
      fileSize: payload.fileSize || existing.fileSize,
      width: payload.width || existing.width,
      height: payload.height || existing.height,
      tags: payload.tags || existing.tags,
      associatedId: payload.associatedId || existing.associatedId,
      driveFileId: payload.driveFileId !== undefined ? payload.driveFileId : existing.driveFileId,
      driveWebViewLink: payload.driveWebViewLink !== undefined ? payload.driveWebViewLink : existing.driveWebViewLink,
      driveWebContentLink: payload.driveWebContentLink !== undefined ? payload.driveWebContentLink : existing.driveWebContentLink,
      driveThumbnailUrl: payload.driveThumbnailUrl !== undefined ? payload.driveThumbnailUrl : existing.driveThumbnailUrl,
      isSyncedToDrive: payload.isSyncedToDrive !== undefined ? payload.isSyncedToDrive : existing.isSyncedToDrive,
      driveSyncedAt: payload.driveSyncedAt !== undefined ? payload.driveSyncedAt : existing.driveSyncedAt,
      uploadedAt: now,
    };
    currentItems[existingIdx] = updated;
    itemToReturn = updated;
  } else {
    // Generate clean filename from title or timestamp
    const cleanName = (payload.fileName || payload.title || `image-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const finalFileName = cleanName.includes('.') ? cleanName : `${cleanName}.jpg`;

    const newItem: MediaItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: payload.title || 'Uploaded Image',
      titleUrdu: payload.titleUrdu,
      description: payload.description || 'Uploaded asset for Rawal Tools',
      url: payload.url,
      folder,
      category,
      fileName: finalFileName,
      fileSize: payload.fileSize || Math.round((payload.url.length * 3) / 4),
      mimeType: payload.url.startsWith('data:image/png') ? 'image/png' : payload.url.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
      width: payload.width || 1200,
      height: payload.height || 1200,
      uploadedAt: now,
      tags: payload.tags || [category, 'upload'],
      associatedId: payload.associatedId,
      isSystemDefault: false,
      driveFileId: payload.driveFileId,
      driveWebViewLink: payload.driveWebViewLink,
      driveWebContentLink: payload.driveWebContentLink,
      driveThumbnailUrl: payload.driveThumbnailUrl,
      isSyncedToDrive: payload.isSyncedToDrive || false,
      driveSyncedAt: payload.driveSyncedAt,
    };

    currentItems.unshift(newItem);
    itemToReturn = newItem;
  }

  saveStoredMediaItems(currentItems);
  return itemToReturn;
}

/**
 * Bulk exports all media files into a structured ZIP folder (`uploads/products/`, `uploads/banners/`, etc.)
 */
export async function exportMediaLibraryZip(mediaItems: MediaItem[]): Promise<void> {
  const zip = new JSZip();
  const rootUploads = zip.folder('uploads');

  const manifestData: any[] = [];

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    const categoryFolder = item.category || 'custom';
    const subFolder = rootUploads ? rootUploads.folder(categoryFolder) : zip.folder(`uploads/${categoryFolder}`);

    let fileData: Uint8Array | ArrayBuffer | string | null = null;
    let fileName = item.fileName || `media-${i + 1}.jpg`;

    if (!fileName.includes('.')) {
      fileName += '.jpg';
    }

    if (item.url.startsWith('data:image/')) {
      // Base64 data URL
      const parts = item.url.split(',');
      const base64Content = parts[1];
      if (base64Content) {
        subFolder?.file(fileName, base64Content, { base64: true });
      }
    } else if (item.url.startsWith('http://') || item.url.startsWith('https://')) {
      try {
        const response = await fetch(item.url, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          subFolder?.file(fileName, buffer);
        } else {
          // If CORS prevents direct binary download, write link file
          subFolder?.file(`${fileName}.url.txt`, `Direct Image URL: ${item.url}\nTitle: ${item.title}\nCategory: ${item.category}`);
        }
      } catch (e) {
        subFolder?.file(`${fileName}.url.txt`, `Direct Image URL: ${item.url}\nTitle: ${item.title}\nCategory: ${item.category}`);
      }
    }

    manifestData.push({
      id: item.id,
      title: item.title,
      titleUrdu: item.titleUrdu,
      category: item.category,
      folderPath: `uploads/${categoryFolder}/${fileName}`,
      description: item.description,
      tags: item.tags,
      fileSize: item.fileSize,
      uploadedAt: item.uploadedAt,
    });
  }

  // Include Manifest JSON and Readme inside ZIP
  zip.file('media-manifest.json', JSON.stringify(manifestData, null, 2));
  zip.file(
    'README_MEDIA.txt',
    `Rawal Tools Media Library Export\n================================\nTotal Files: ${mediaItems.length}\nExport Date: ${new Date().toLocaleString()}\n\nFolders included:\n- uploads/products/  (Product Catalog images)\n- uploads/banners/   (Hero and marketing banners)\n- uploads/team/      (Staff and representative avatars)\n- uploads/blog/      (Article covers and technical guides)\n- uploads/branding/  (Logos and trust marks)\n- uploads/custom/    (Custom uploads)\n\nTo host on cPanel or Hostinger, upload the 'uploads/' folder directly into public_html/\n`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `rawal-tools-media-library-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Generates an instant, zero-error cPanel / Hostinger deployment package ZIP
 * with .htaccess, manifest, site data, media catalog, and deployment instructions
 */
export async function exportCpanelHostingerDeploymentBundle(
  products: Product[],
  settings: StoreSettings,
  mediaItems: MediaItem[],
  blogPosts: BlogPost[],
  teamMembers: TeamMember[]
): Promise<void> {
  const zip = new JSZip();

  // 1. .htaccess for cPanel / Apache / LiteSpeed (ensures 0 routing/404 errors)
  const htaccessContent = `# ==============================================================================
# Rawal Tools - Apache / LiteSpeed .htaccess Configuration
# Optimized for cPanel, Hostinger, Namecheap & Cloud Hosting
# Supports Single Page App (SPA) Deep Routing, Gzip Compression, Asset Caching & Security
# ==============================================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Do not rewrite real files or directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Rewrite all other requests to index.html for React Router / SPA navigation
  RewriteRule ^ index.html [L]
</IfModule>

# ==============================================================================
# Browser Caching & Performance Headers (Images, CSS, JS, Fonts)
# ==============================================================================
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"

  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/json "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# ==============================================================================
# Gzip / Deflate Compression
# ==============================================================================
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css application/xml application/javascript application/json image/svg+xml
</IfModule>

# ==============================================================================
# Security & MIME Types
# ==============================================================================
Options -Indexes
<IfModule mod_mime.c>
  AddType image/webp .webp
  AddType font/woff2 .woff2
  AddType application/json .json
</IfModule>
`;

  zip.file('.htaccess', htaccessContent);
  zip.file('_redirects', '/*    /index.html   200\n');
  zip.file('robots.txt', 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n');

  // 2. Complete Store Catalog Data Snapshot
  const storeExport = {
    exportedAt: new Date().toISOString(),
    storeName: settings.storeName,
    settings,
    products,
    blogPosts,
    teamMembers,
    mediaLibrary: mediaItems.map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category,
      folder: m.folder,
      fileName: m.fileName,
      fileSize: m.fileSize,
      url: m.url.startsWith('data:') ? '[Embedded Data URL]' : m.url,
    })),
  };
  zip.file('store-catalog-backup.json', JSON.stringify(storeExport, null, 2));

  // 3. Step-by-Step Urdu & English Publishing Guide
  const deploymentGuide = `================================================================================
RAWAL TOOLS - cPanel & HOSTINGER ZERO-ERROR PUBLISHING GUIDE
راول ٹولز ویب سائٹ کو cPanel یا Hostinger پر شائع کرنے کا آسان طریقہ
================================================================================

1. QUICK HOSTINGER DEPLOYMENT (ہوسٹنگر پر پبلش کرنے کا طریقہ):
--------------------------------------------------------------------------------
a) Log in to Hostinger hPanel -> Go to 'Websites' -> Click 'Manage' on your domain.
b) Open 'File Manager' -> Navigate to the 'public_html' folder.
c) Delete any default 'default.php' or placeholder files in 'public_html'.
d) If you have run 'npm run build', upload all contents of your 'dist/' folder 
   (along with this '.htaccess' file) directly into 'public_html'.
e) Verify that '.htaccess' is present in public_html (enable 'Show Hidden Files' if not visible).
f) Open your custom domain in browser (e.g. https://rawaltools.com) -> It will load with 0 errors!


2. QUICK cPanel DEPLOYMENT (سی پینل پر پبلش کرنے کا طریقہ):
--------------------------------------------------------------------------------
a) Log in to your cPanel -> Open 'File Manager'.
b) Open the 'public_html' directory.
c) Click 'Upload' and select your production build zip.
d) Right-click the uploaded zip and click 'Extract' into public_html.
e) Ensure the '.htaccess' file included in this bundle is inside public_html.
f) In cPanel -> SSL/TLS Status -> Ensure 'AutoSSL' is active for green padlock.


3. WHY .HTACCESS IS CRITICAL (ایرر ختم کرنے کے لیے):
--------------------------------------------------------------------------------
- Prevents 404 Not Found errors when refreshing sub-pages or opening direct links.
- Enables super-fast browser caching for all images, WebP files, and scripts.
- Compresses pages with Gzip for instant mobile loading across Pakistan.


4. CUSTOM DOMAIN DNS SETTINGS (ڈومین کی سیٹنگز):
--------------------------------------------------------------------------------
- Point your Domain's 'A Record' to your Hosting Server IP (e.g. Hostinger / cPanel IP).
- Add 'CNAME' record: www -> yourdomain.com.

================================================================================
Generated automatically by Rawal Tools Admin System on ${new Date().toLocaleString()}
`;

  zip.file('CPANEL_HOSTINGER_INSTRUCTIONS.txt', deploymentGuide);

  // 4. Also package the media files
  const rootUploads = zip.folder('uploads');
  for (let i = 0; i < Math.min(mediaItems.length, 30); i++) {
    const item = mediaItems[i];
    const categoryFolder = item.category || 'custom';
    const subFolder = rootUploads ? rootUploads.folder(categoryFolder) : zip.folder(`uploads/${categoryFolder}`);
    const fileName = item.fileName || `media-${i + 1}.jpg`;

    if (item.url.startsWith('data:image/')) {
      const parts = item.url.split(',');
      if (parts[1]) {
        subFolder?.file(fileName, parts[1], { base64: true });
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `rawal-tools-cpanel-hostinger-bundle-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
