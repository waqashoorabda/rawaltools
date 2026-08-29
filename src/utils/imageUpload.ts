/**
 * Image Compression & Optimization Utility for Rawal Tools Admin
 * Automatically compresses high-resolution product photos, company logos,
 * and banner graphics upon upload to ensure ultra-fast page loading speeds.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  maxSizeBytes?: number; // Optional target size cap
}

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
  savingsPercentage: number;
  reductionLabel: string;
}

/**
 * Format bytes to readable KB/MB string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Core image compression helper using HTML5 Canvas & high-quality downsampling.
 * Automatically handles oversized camera photos (4K / 12MP+), shrinks file payload,
 * and converts to lightweight, web-optimized format.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.80,
    mimeType = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    // If SVG or very small file (< 40 KB), preserve directly
    if (file.type === 'image/svg+xml' || (file.size < 40 * 1024 && file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        // Estimate dimensions if possible
        const img = new Image();
        img.onload = () => {
          resolve({
            dataUrl,
            originalSize,
            compressedSize: originalSize,
            originalWidth: img.width,
            originalHeight: img.height,
            compressedWidth: img.width,
            compressedHeight: img.height,
            savingsPercentage: 0,
            reductionLabel: `${formatBytes(originalSize)} (Optimal)`,
          });
        };
        img.onerror = () => {
          resolve({
            dataUrl,
            originalSize,
            compressedSize: originalSize,
            originalWidth: 500,
            originalHeight: 500,
            compressedWidth: 500,
            compressedHeight: 500,
            savingsPercentage: 0,
            reductionLabel: `${formatBytes(originalSize)} (Direct)`,
          });
        };
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // Scale down proportionally if larger than maximum allowed bounds
        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          if (targetWidth / maxWidth > targetHeight / maxHeight) {
            targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
            targetWidth = maxWidth;
          } else {
            targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
            targetHeight = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          const fallbackUrl = event.target?.result as string;
          resolve({
            dataUrl: fallbackUrl,
            originalSize,
            compressedSize: originalSize,
            originalWidth,
            originalHeight,
            compressedWidth: targetWidth,
            compressedHeight: targetHeight,
            savingsPercentage: 0,
            reductionLabel: formatBytes(originalSize),
          });
          return;
        }

        // Apply smooth bilinear image smoothing for pristine tool details
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // If rendering JPEG, fill white background for transparent PNGs
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Draw compressed image frame
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Determine optimal format: if source is PNG and user didn't force JPEG, try WebP or JPEG
        const outputMime = file.type === 'image/png' && mimeType !== 'image/jpeg' 
          ? 'image/png' 
          : mimeType;

        const dataUrl = canvas.toDataURL(outputMime, quality);
        
        // Calculate rough compressed byte size from base64 length
        const base64Content = dataUrl.split(',')[1] || '';
        const compressedSize = Math.round((base64Content.length * 3) / 4);

        const savedBytes = Math.max(0, originalSize - compressedSize);
        const savingsPercentage = originalSize > 0 
          ? Math.round((savedBytes / originalSize) * 100) 
          : 0;

        const reductionLabel = savingsPercentage > 0
          ? `${formatBytes(originalSize)} ➔ ${formatBytes(compressedSize)} (${savingsPercentage}% saved)`
          : formatBytes(compressedSize);

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          originalWidth,
          originalHeight,
          compressedWidth: targetWidth,
          compressedHeight: targetHeight,
          savingsPercentage,
          reductionLabel,
        });
      };

      img.onerror = (err) => {
        const fallback = event.target?.result as string;
        resolve({
          dataUrl: fallback,
          originalSize,
          compressedSize: originalSize,
          originalWidth: 800,
          originalHeight: 800,
          compressedWidth: 800,
          compressedHeight: 800,
          savingsPercentage: 0,
          reductionLabel: formatBytes(originalSize),
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

import { registerMediaItem } from './mediaStorage';
import { MediaCategory } from '../types';

/**
 * Lightweight wrapper for backwards compatibility with existing forms.
 * Returns compressed data URL directly and automatically registers the image into central Media Library.
 */
export async function compressAndReadFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.80,
  category: MediaCategory = 'custom',
  title?: string
): Promise<string> {
  const res = await compressImage(file, { maxWidth, maxHeight, quality });
  
  // Automatically register into central Media Library!
  try {
    registerMediaItem({
      url: res.dataUrl,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      fileSize: res.compressedSize,
      width: res.compressedWidth,
      height: res.compressedHeight,
      category,
      folder: `uploads/${category}`,
      tags: [category, 'upload'],
    });
  } catch (e) {
    console.warn('Auto media registration note:', e);
  }

  return res.dataUrl;
}

/**
 * Explicit helper to compress file and register directly to Media Library
 */
export async function compressAndRegisterMedia(
  file: File,
  meta: {
    category?: MediaCategory;
    folder?: string;
    title?: string;
    titleUrdu?: string;
    description?: string;
    tags?: string[];
    associatedId?: string;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
) {
  const {
    category = 'custom',
    folder,
    title,
    titleUrdu,
    description,
    tags,
    associatedId,
    maxWidth = 1400,
    maxHeight = 1400,
  } = meta;

  const res = await compressImage(file, { maxWidth, maxHeight, quality: 0.85 });

  const mediaItem = registerMediaItem({
    url: res.dataUrl,
    title: title || file.name.replace(/\.[^/.]+$/, ''),
    titleUrdu,
    description,
    fileName: file.name,
    fileSize: res.compressedSize,
    width: res.compressedWidth,
    height: res.compressedHeight,
    category,
    folder: folder || `uploads/${category}`,
    tags: tags || [category, 'upload'],
    associatedId,
  });

  return { result: res, mediaItem };
}

/**
 * Batch compress multiple image files concurrently
 */
export async function compressMultipleImages(
  files: FileList | File[],
  options?: CompressionOptions
): Promise<CompressedImageResult[]> {
  const fileArray = Array.from(files);
  const promises = fileArray.map((file) => compressImage(file, options));
  return Promise.all(promises);
}

export const PRESET_TOOL_IMAGES = [
  {
    name: 'Power Rotary Drill',
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Angle Grinder',
    url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Welding Machine',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Cordless Impact Driver',
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Socket & Spanner Tool Set',
    url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Precision Caliper & Gauge',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Heavy Bench Vise',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Industrial Workshop',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
  },
];
