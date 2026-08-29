import { Product } from '../types';

/**
 * Generates a clean, shareable deep-link URL for a product using the `?product=` query parameter.
 */
export function getProductDeepLinkUrl(productId: string): string {
  if (typeof window === 'undefined') {
    return `?product=${encodeURIComponent(productId)}`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/+$/, '');
  const cleanPath = pathname || '';
  return `${origin}${cleanPath}/?product=${encodeURIComponent(productId)}`;
}

/**
 * Copies text to the user's clipboard safely with modern Clipboard API and legacy fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Try modern navigator.clipboard
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Proceed to fallback
    }
  }

  // Fallback using temporary textarea element
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Copies the product's deep link URL to clipboard and returns status.
 */
export async function copyProductLink(productId: string): Promise<{ success: boolean; url: string }> {
  const url = getProductDeepLinkUrl(productId);
  const success = await copyTextToClipboard(url);
  return { success, url };
}

/**
 * Native Web Share API trigger for mobile / supported browsers.
 */
export async function shareProduct(product: Product, storeName = 'Rawal Tools'): Promise<boolean> {
  const url = getProductDeepLinkUrl(product.id);
  const title = `${product.name} | ${storeName}`;
  const text = `Check out ${product.name} on ${storeName}:\n${url}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return false; // User cancelled share dialog
      }
    }
  }

  // Fallback to copy link
  return await copyTextToClipboard(url);
}
