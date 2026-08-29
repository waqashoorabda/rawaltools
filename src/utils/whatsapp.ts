import { CartItem, Product, StoreSettings } from '../types';

export function cleanWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If starts with 0 (e.g. 03001234567), replace 0 with 92
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  // If starts with + (removed above), or is 300...
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '92' + cleaned;
  }
  return cleaned || '923001234567';
}

export function buildProductWhatsAppUrl(
  productOrSettings: Product | StoreSettings,
  settingsOrProduct: StoreSettings | Product,
  quantity = 1,
  customerNote = '',
  customerCity = '',
  selectedSize = '',
  targetNumber = ''
): string {
  let product: Product;
  let settings: StoreSettings;

  if (productOrSettings && 'storeName' in productOrSettings) {
    settings = productOrSettings as StoreSettings;
    product = settingsOrProduct as Product;
  } else {
    product = productOrSettings as Product;
    settings = settingsOrProduct as StoreSettings;
  }

  if (!product || !settings) return '#';

  const number = cleanWhatsAppNumber(targetNumber || settings.whatsappNumber || '923001234567');
  
  const priceText = product.hasPrice && product.price
    ? `${settings.currencySymbol || 'Rs.'} ${product.price.toLocaleString()} ${product.unit ? `(per ${product.unit})` : ''}`
    : 'Price on Request / Quote Required (قیمت برائے رابطہ)';

  const lines: string[] = [
    `*⚡ ${(settings.storeName || 'RAWAL TOOLS').toUpperCase()} - NEW ORDER / INQUIRY*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📌 *Product:* ${product.name || 'Machinery Tool'}`,
    `🏷️ *Category:* ${product.category || 'General'}`,
  ];

  if (selectedSize || product.defaultSize) {
    lines.push(`📏 *Selected Size / Variant:* ${selectedSize || product.defaultSize}`);
  }

  if (product.brand) {
    lines.push(`🏭 *Brand:* ${product.brand}`);
  }
  if (product.sku) {
    lines.push(`🔢 *SKU/Code:* ${product.sku}`);
  }

  lines.push(`💰 *Rate/Price:* ${priceText}`);
  lines.push(`📦 *Quantity:* ${quantity || 1} ${product.unit || 'unit(s)'}`);

  if (product.hasPrice && product.price) {
    const total = product.price * (quantity || 1);
    lines.push(`💵 *Estimated Total:* ${settings.currencySymbol || 'Rs.'} ${total.toLocaleString()}`);
  }

  if (customerCity && customerCity.trim()) {
    lines.push(`📍 *Delivery City:* ${customerCity.trim()}`);
  }

  if (customerNote && customerNote.trim()) {
    lines.push(`💬 *Customer Note:* ${customerNote.trim()}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Assalam-o-Alaikum! Please confirm stock availability, delivery time, and final invoice._`);

  const fullMessage = lines.join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(fullMessage)}`;
}

export function buildCartWhatsAppUrl(
  items: CartItem[],
  settings: StoreSettings,
  customerName = '',
  customerCity = '',
  customerPhone = '',
  orderNotes = '',
  targetNumber = ''
): string {
  const number = cleanWhatsAppNumber(targetNumber || settings.whatsappNumber);

  let grandTotal = 0;
  let hasUnpricedItems = false;

  const lines: string[] = [
    `*⚡ ${settings.storeName.toUpperCase()} - MULTI-ITEM ORDER / QUOTE REQUEST*`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ];

  if (customerName.trim()) {
    lines.push(`👤 *Customer Name:* ${customerName.trim()}`);
  }
  if (customerPhone.trim()) {
    lines.push(`📞 *Customer Contact:* ${customerPhone.trim()}`);
  }
  if (customerCity.trim()) {
    lines.push(`📍 *Delivery Location / City:* ${customerCity.trim()}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 *ITEMS LIST (${items.length} items):*`);

  items.forEach((item, index) => {
    const p = item.product;
    const itemPriceText = p.hasPrice && p.price
      ? `${settings.currencySymbol} ${p.price.toLocaleString()}`
      : `[Quote Required]`;

    if (p.hasPrice && p.price) {
      const subtotal = p.price * item.quantity;
      grandTotal += subtotal;
    } else {
      hasUnpricedItems = true;
    }

    let itemHeader = `${index + 1}. *${p.name}*`;
    if (item.offerBadge) {
      itemHeader += ` (${item.offerBadge})`;
    }

    let itemDetails = `   Qty: ${item.quantity} ${p.unit || 'unit'} | Rate: ${itemPriceText}${
      p.sku ? ` | Code: ${p.sku}` : ''
    }`;

    if (item.selectedSize) {
      itemDetails += `\n   📏 Size/Spec: *${item.selectedSize}*`;
    }

    lines.push(`${itemHeader}\n${itemDetails}`);
    if (item.customNote) {
      lines.push(`   Note: ${item.customNote}`);
    }
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  if (grandTotal > 0) {
    lines.push(
      `💵 *Priced Items Subtotal:* ${settings.currencySymbol} ${grandTotal.toLocaleString()}${
        hasUnpricedItems ? ' (+ unpriced items quotation needed)' : ''
      }`
    );
  } else {
    lines.push(`💰 *Total:* Quotation required for all selected items.`);
  }

  if (orderNotes.trim()) {
    lines.push(`📝 *Special Instructions:* ${orderNotes.trim()}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Assalam-o-Alaikum! Please review my order list, provide best rates and payment/delivery details._`);

  const fullMessage = lines.join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(fullMessage)}`;
}

export function buildDirectContactWhatsAppUrl(settings: StoreSettings, customTopic = ''): string {
  const number = cleanWhatsAppNumber(settings.whatsappNumber);
  const text = customTopic
    ? `Assalam-o-Alaikum ${settings.storeName}! Mujhe is silsilay mein rabta karna hai: ${customTopic}`
    : `${settings.customGreeting}\n(Industrial Tools & Equipment Inquiry)`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
