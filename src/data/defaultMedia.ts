import { MediaItem, MediaFolder } from '../types';
import { DEFAULT_PRODUCTS } from './defaultProducts';
import { DEFAULT_TEAM_MEMBERS } from './defaultTeam';
import { DEFAULT_BLOG_POSTS } from './defaultBlogPosts';

export const DEFAULT_MEDIA_FOLDERS: MediaFolder[] = [
  {
    id: 'folder-products',
    name: 'Product Catalog',
    nameUrdu: 'پراڈکٹس لسٹ',
    path: 'uploads/products',
    category: 'products',
    icon: 'Package',
    description: 'Hardware tools, machinery, and industrial accessories photos',
  },
  {
    id: 'folder-banners',
    name: 'Banners & Hero Graphics',
    nameUrdu: 'بینرز اور ہیرو تصاویر',
    path: 'uploads/banners',
    category: 'banners',
    icon: 'Layout',
    description: 'Promotional banners, retail story graphics, and carousel slides',
  },
  {
    id: 'folder-team',
    name: 'Team & Staff Photos',
    nameUrdu: 'ٹیم و فیلڈ اسٹاف',
    path: 'uploads/team',
    category: 'team',
    icon: 'Users',
    description: 'Executive officers, engineers, field reps, and staff avatars',
  },
  {
    id: 'folder-blog',
    name: 'Articles & Guides Media',
    nameUrdu: 'بلاگ و رہنمائی آرٹیکلز',
    path: 'uploads/blog',
    category: 'blog',
    icon: 'BookOpen',
    description: 'Technical guide covers, workshop maintenance graphics, and tips',
  },
  {
    id: 'folder-branding',
    name: 'Logos & Badges',
    nameUrdu: 'لوگو اور بیجز',
    path: 'uploads/branding',
    category: 'branding',
    icon: 'Palette',
    description: 'Store emblems, trust badges, watermarks, and brand marks',
  },
  {
    id: 'folder-custom',
    name: 'Custom Media & Docs',
    nameUrdu: 'کسٹم میڈیا اور فائلز',
    path: 'uploads/custom',
    category: 'custom',
    icon: 'Folder',
    description: 'Manual uploads, customer project photos, invoices, and certificates',
  },
];

// Generate default media items dynamically from seeded data
export function generateDefaultMediaItems(): MediaItem[] {
  const items: MediaItem[] = [];

  // 1. Product Images
  DEFAULT_PRODUCTS.forEach((product, idx) => {
    const mainImg = product.images?.[0];
    if (mainImg) {
      items.push({
        id: `media-prod-${product.id}`,
        title: product.name,
        titleUrdu: product.name,
        description: product.shortDescription || `Original tool photo for ${product.name}`,
        url: mainImg,
        folder: 'uploads/products',
        category: 'products',
        fileName: `${product.sku || product.id}-main.jpg`,
        fileSize: 45200 + (idx * 2300),
        mimeType: 'image/jpeg',
        width: 1200,
        height: 1200,
        uploadedAt: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString(),
        tags: [product.category, product.brand, 'catalog', 'product'],
        associatedId: product.id,
        isSystemDefault: true,
      });
    }

    // Additional gallery images
    if (product.images && product.images.length > 1) {
      product.images.slice(1).forEach((imgUrl, gIdx) => {
        items.push({
          id: `media-prod-${product.id}-gal-${gIdx}`,
          title: `${product.name} (View ${gIdx + 2})`,
          titleUrdu: `${product.name} - View ${gIdx + 2}`,
          description: `Gallery showcase angle ${gIdx + 2} for ${product.name}`,
          url: imgUrl,
          folder: 'uploads/products',
          category: 'products',
          fileName: `${product.sku || product.id}-angle-${gIdx + 2}.jpg`,
          fileSize: 38400 + (gIdx * 1500),
          mimeType: 'image/jpeg',
          width: 1200,
          height: 1200,
          uploadedAt: new Date(Date.now() - (idx + 1) * 86400000 * 2).toISOString(),
          tags: [product.category, 'gallery'],
          associatedId: product.id,
          isSystemDefault: true,
        });
      });
    }
  });

  // 2. Team Member Images
  DEFAULT_TEAM_MEMBERS.forEach((member, idx) => {
    if (member.photoUrl) {
      items.push({
        id: `media-team-${member.id}`,
        title: `${member.name} (${member.role})`,
        titleUrdu: `${member.nameUrdu || member.name} - ${member.roleUrdu || member.role}`,
        description: `Official staff avatar for ${member.name}, ${member.department}`,
        url: member.photoUrl,
        folder: 'uploads/team',
        category: 'team',
        fileName: `staff-${member.id}.jpg`,
        fileSize: 32000 + (idx * 1200),
        mimeType: 'image/jpeg',
        width: 600,
        height: 600,
        uploadedAt: new Date(Date.now() - (idx + 1) * 86400000 * 5).toISOString(),
        tags: ['team', 'staff', member.department],
        associatedId: member.id,
        isSystemDefault: true,
      });
    }
  });

  // 3. Blog Article Covers
  DEFAULT_BLOG_POSTS.forEach((post, idx) => {
    if (post.coverImage) {
      items.push({
        id: `media-blog-${post.id}`,
        title: post.title,
        description: post.excerpt,
        url: post.coverImage,
        folder: 'uploads/blog',
        category: 'blog',
        fileName: `article-${post.slug}.jpg`,
        fileSize: 52000 + (idx * 3100),
        mimeType: 'image/jpeg',
        width: 1200,
        height: 800,
        uploadedAt: new Date(Date.now() - (idx + 1) * 86400000 * 4).toISOString(),
        tags: ['article', 'guide', post.category],
        associatedId: post.id,
        isSystemDefault: true,
      });
    }
  });

  // 4. Hero & Banner Graphics
  items.push({
    id: 'media-banner-hero-1',
    title: 'Industrial Heavy Duty Workshop Tools Showcase',
    titleUrdu: 'صنعتی ٹولز و آلات کا ہیرو بینر',
    description: 'Main homepage hero background featuring precision engineering tools',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80',
    folder: 'uploads/banners',
    category: 'banners',
    fileName: 'hero-workshop-welding.jpg',
    fileSize: 128400,
    mimeType: 'image/jpeg',
    width: 1600,
    height: 900,
    uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    tags: ['banner', 'hero', 'homepage'],
    isSystemDefault: true,
  });

  items.push({
    id: 'media-banner-wholesale',
    title: 'Wholesale & B2B Supply Network Banner',
    titleUrdu: 'ہول سیل و بی ٹو بی سپلائی بینر',
    description: 'Wholesale distribution network promo card',
    url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80',
    folder: 'uploads/banners',
    category: 'banners',
    fileName: 'banner-wholesale-tools.jpg',
    fileSize: 94000,
    mimeType: 'image/jpeg',
    width: 1200,
    height: 800,
    uploadedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    tags: ['banner', 'wholesale', 'ad'],
    isSystemDefault: true,
  });

  items.push({
    id: 'media-banner-rotary-drill',
    title: 'High Speed Rotary Drill in Action',
    titleUrdu: 'ہائی اسپیڈ روٹری ڈرل کا نمونہ',
    description: 'Close-up precision boring in solid steel',
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    folder: 'uploads/banners',
    category: 'banners',
    fileName: 'banner-rotary-action.jpg',
    fileSize: 88000,
    mimeType: 'image/jpeg',
    width: 1200,
    height: 800,
    uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    tags: ['banner', 'action', 'story'],
    isSystemDefault: true,
  });

  return items;
}

export const DEFAULT_MEDIA_ITEMS: MediaItem[] = generateDefaultMediaItems();
