import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  MessageCircle, 
  ShoppingBag, 
  MapPin, 
  User, 
  Phone, 
  FileText,
  ArrowRight, 
  ShieldCheck, 
  Truck,
  Sparkles,
  Edit3,
  Check,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { CartItem, Product, StoreSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { buildCartWhatsAppUrl, cleanWhatsAppNumber } from '../utils/whatsapp';
import { trackWhatsAppClick, trackAddToCart } from '../utils/analytics';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  settings: StoreSettings;
  theme?: ThemeId;
  onAddToCart: (product: Product, quantity?: number, note?: string, selectedSize?: string) => void;
  onUpdateQuantity: (productId: string, delta: number, selectedSize?: string) => void;
  onUpdateItemSize?: (productId: string, oldSize: string | undefined, newSize: string) => void;
  onRemoveItem: (productId: string, selectedSize?: string) => void;
  onClearCart: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  settings,
  theme = 'industrial_yellow',
  onAddToCart,
  onUpdateQuantity,
  onUpdateItemSize,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // WhatsApp Destination Customization State
  const [customWhatsAppNumber, setCustomWhatsAppNumber] = useState(settings.whatsappNumber || '03001234567');
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [whatsappPreset, setWhatsappPreset] = useState<'main' | 'cargo' | 'custom'>('main');

  // Relevant Product Recommendation State (local size & quantity selection per recommendation)
  const [recSelections, setRecSelections] = useState<Record<string, { size: string; quantity: number }>>({});

  // Compute Cart Subtotal
  let subtotal = 0;
  let hasUnpriced = false;

  cart.forEach((item) => {
    if (item.product.hasPrice && item.product.price) {
      subtotal += item.product.price * item.quantity;
    } else {
      hasUnpriced = true;
    }
  });

  // Calculate Relevant / Compatible Products
  const relevantProducts = useMemo(() => {
    const cartProductIds = new Set(cart.map((i) => i.product.id));
    const cartCategories = new Set(cart.map((i) => i.product.category));

    // Priority 1: Products from same categories or complementary tools not in cart
    const sameCatProducts = products.filter(
      (p) => !cartProductIds.has(p.id) && (cartCategories.has(p.category) || p.isFeatured || p.discountPrice)
    );

    // Priority 2: Other available catalog products
    const otherProducts = products.filter(
      (p) => !cartProductIds.has(p.id) && !sameCatProducts.some((s) => s.id === p.id)
    );

    return [...sameCatProducts, ...otherProducts].slice(0, 4);
  }, [cart, products]);

  // Handle Recommendation Size/Quantity change
  const handleRecSizeChange = (productId: string, size: string) => {
    setRecSelections((prev) => ({
      ...prev,
      [productId]: {
        size,
        quantity: prev[productId]?.quantity || 1,
      },
    }));
  };

  const handleRecQuantityChange = (productId: string, delta: number) => {
    setRecSelections((prev) => {
      const currentQty = prev[productId]?.quantity || 1;
      const newQty = Math.max(1, currentQty + delta);
      return {
        ...prev,
        [productId]: {
          size: prev[productId]?.size || '',
          quantity: newQty,
        },
      };
    });
  };

  const handleAddRecommendation = (product: Product) => {
    const sel = recSelections[product.id];
    const sizeToUse = sel?.size || product.defaultSize || product.availableSizes?.[0] || '';
    const qtyToUse = sel?.quantity || 1;
    onAddToCart(product, qtyToUse, 'Added from Relevant Offers', sizeToUse);
  };

  // Build target WhatsApp Number
  const activeWhatsApp = customWhatsAppNumber.trim() || settings.whatsappNumber;

  const whatsappUrl = buildCartWhatsAppUrl(
    cart,
    settings,
    customerName,
    customerCity,
    customerPhone,
    orderNotes,
    activeWhatsApp
  );

  const handleSubmitCart = () => {
    trackWhatsAppClick('Cart Quotation Submission', `Items: ${cart.length} | Subtotal: Rs. ${subtotal} | Sent to: ${activeWhatsApp}`);
  };

  const handlePresetSelect = (preset: 'main' | 'cargo' | 'custom', customNum?: string) => {
    setWhatsappPreset(preset);
    if (preset === 'main') {
      setCustomWhatsAppNumber(settings.whatsappNumber);
      setIsEditingWhatsApp(false);
    } else if (preset === 'cargo') {
      setCustomWhatsAppNumber('923008547219');
      setIsEditingWhatsApp(false);
    } else {
      setIsEditingWhatsApp(true);
      if (customNum) setCustomWhatsAppNumber(customNum);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn">
      <div
        id="cart-modal"
        className={`relative border rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto transition-colors ${
          isLight 
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-900/15' 
            : 'bg-[#12151D] text-[#F1F3F7] border-[#252A36]'
        }`}
      >
        {/* Modal Header */}
        <div className={`sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-200' : 'bg-[#12151D]/95 border-[#252A36]'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: themeConfig.previewAccent,
                color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              }}
            >
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold font-sans text-lg sm:text-xl leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Quote Cart & Order Summary
              </h3>
              <p className={`text-[11px] font-medium font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {cart.length} item(s) • سائز اور مقدار منتخب کریں
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-sans">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              id="close-cart-btn"
              onClick={onClose}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isLight 
                  ? 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200' 
                  : 'text-slate-400 hover:text-white bg-[#1A1E29] border-[#2E3545]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-[#181C26] border-[#2D3342] text-slate-500'
              }`}>
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className={`text-xl font-bold font-sans ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Your Order List is Empty
              </h4>
              <p className={`text-xs max-w-sm mx-auto font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Browse our industrial catalog and select sizes/models to build your custom wholesale or retail quotation.
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: themeConfig.previewAccent,
                  color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                }}
              >
                <span>Browse Tools & Sizes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Product Items List in Cart */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const p = item.product;
                  const itemImg = p.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80';
                  const itemTotal = p.hasPrice && p.price ? p.price * item.quantity : null;
                  const itemSize = item.selectedSize || p.defaultSize || (p.availableSizes && p.availableSizes[0]);

                  return (
                    <div
                      key={`${p.id}-${item.selectedSize || idx}`}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#181C26] border-[#2A303F]'
                      }`}
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={itemImg}
                          alt={p.name}
                          className="w-14 h-14 rounded-lg object-contain bg-white shrink-0 border border-slate-200 p-1"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className={`text-sm font-bold font-sans truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={p.name}>
                            {p.name}
                          </h4>
                          
                          {/* Price and SKU */}
                          <div className="flex items-center gap-2 text-xs font-sans mt-0.5 flex-wrap">
                            {p.hasPrice && p.price ? (
                              <span 
                                className="font-bold"
                                style={{ color: isLight ? '#0F172A' : themeConfig.previewAccent }}
                              >
                                {settings.currencySymbol} {p.price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-amber-500 font-medium">Price on Request</span>
                            )}
                            {p.sku && <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>• {p.sku}</span>}
                          </div>

                          {/* Selected Size / Model Specifier */}
                          {p.availableSizes && p.availableSizes.length > 0 && (
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                                Size:
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {p.availableSizes.map((sz) => {
                                  const isSelected = itemSize === sz;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => onUpdateItemSize && onUpdateItemSize(p.id, item.selectedSize, sz)}
                                      className={`text-[9px] font-sans px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-400 text-black border-amber-500 font-bold'
                                          : isLight
                                            ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                            : 'bg-[#10131A] text-slate-300 border-[#333]'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity controls & Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 font-sans pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                        <div className={`flex items-center rounded-lg border shadow-sm ${
                          isLight ? 'bg-white border-slate-300' : 'bg-[#10131A] border-[#313848]'
                        }`}>
                          <button
                            onClick={() => onUpdateQuantity(p.id, -1, item.selectedSize)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-l-lg transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 font-sans font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(p.id, 1, item.selectedSize)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-r-lg transition-colors cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {itemTotal !== null && (
                          <div className={`font-sans text-xs font-bold text-right min-w-[70px] ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {settings.currencySymbol} {itemTotal.toLocaleString()}
                          </div>
                        )}

                        <button
                          onClick={() => onRemoveItem(p.id, item.selectedSize)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item from order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation Box */}
              <div className={`p-4 rounded-xl border space-y-2 text-xs font-sans ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#181C26] border-[#2A303F]'
              }`}>
                {subtotal > 0 && (
                  <div className="flex items-center justify-between font-bold">
                    <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                      Priced Items Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} units):
                    </span>
                    <span 
                      className="text-base sm:text-lg font-extrabold"
                      style={{ color: isLight ? '#0F172A' : themeConfig.previewAccent }}
                    >
                      {settings.currencySymbol} {subtotal.toLocaleString()}
                    </span>
                  </div>
                )}
                {hasUnpriced && (
                  <div className={`text-[11px] p-2.5 rounded-lg border ${
                    isLight 
                      ? 'bg-amber-50 text-amber-900 border-amber-200' 
                      : 'bg-amber-950/40 text-amber-200 border-amber-800/40'
                  }`}>
                    ℹ️ Some items are marked as <strong>Price on Request</strong>. Rawal Tools will quote current factory/market pricing directly on WhatsApp.
                  </div>
                )}
              </div>

              {/* AUTOMATIC RELEVANT PRODUCTS & SPECIAL OFFERS SECTION */}
              {relevantProducts.length > 0 && (
                <div className={`p-4 sm:p-5 rounded-xl border space-y-3.5 ${
                  isLight ? 'bg-amber-50/40 border-amber-200/80' : 'bg-[#161B26] border-[#2C3345]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h4 className={`text-xs sm:text-sm font-bold font-sans uppercase tracking-wider ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Frequently Added Accessories & Relevant Offers
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded font-bold">
                      ملتے جلتے ٹولز اور آفرز
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-sans">
                    Recommended compatible attachments, drill bit packs, cutting wheels & safety gear for your selected tools:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relevantProducts.map((rec) => {
                      const recImg = rec.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80';
                      const sel = recSelections[rec.id] || {
                        size: rec.defaultSize || rec.availableSizes?.[0] || '',
                        quantity: 1,
                      };
                      const discountSaving = rec.price && rec.discountPrice && rec.discountPrice > rec.price
                        ? rec.discountPrice - rec.price
                        : null;

                      return (
                        <div
                          key={rec.id}
                          className={`p-3 rounded-lg border flex flex-col justify-between space-y-2.5 transition-all ${
                            isLight 
                              ? 'bg-white border-slate-200 hover:border-amber-400 shadow-xs' 
                              : 'bg-[#10131A] border-[#252C3D] hover:border-amber-500/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <img
                              src={recImg}
                              alt={rec.name}
                              className="w-12 h-12 rounded object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1 py-0.2 rounded uppercase">
                                  {rec.category}
                                </span>
                                {discountSaving && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 py-0.2 rounded">
                                    Save {settings.currencySymbol} {discountSaving}
                                  </span>
                                )}
                              </div>
                              <h5 className={`text-xs font-bold font-sans mt-1 line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {rec.name}
                              </h5>
                              <div className="text-xs font-sans font-bold mt-0.5" style={{ color: themeConfig.previewAccent }}>
                                {rec.hasPrice && rec.price ? `${settings.currencySymbol} ${rec.price.toLocaleString()}` : 'Price on Request'}
                              </div>
                            </div>
                          </div>

                          {/* Size Selection if Available */}
                          {rec.availableSizes && rec.availableSizes.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">
                                Select Size:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {rec.availableSizes.map((sz) => {
                                  const isSelected = (sel.size || rec.availableSizes![0]) === sz;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => handleRecSizeChange(rec.id, sz)}
                                      className={`text-[9px] font-sans px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-400 text-black border-amber-500 font-bold'
                                          : isLight
                                            ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                            : 'bg-[#181C26] text-slate-300 border-[#2D3445]'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Quantity & Add Button */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {/* Quantity Controls */}
                            <div className={`flex items-center rounded border text-xs ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151922] border-[#2B3242]'
                            }`}>
                              <button
                                type="button"
                                onClick={() => handleRecQuantityChange(rec.id, -1)}
                                className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono font-bold text-[11px]">
                                {sel.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRecQuantityChange(rec.id, 1)}
                                className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* + Add to List Button */}
                            <button
                              type="button"
                              onClick={() => handleAddRecommendation(rec)}
                              className="flex items-center gap-1 text-[11px] font-bold font-sans px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs active:scale-95"
                              style={{
                                backgroundColor: themeConfig.previewAccent,
                                color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                                borderColor: themeConfig.previewAccent,
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Add to Order</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* WHATSAPP ROUTING & NUMBER CUSTOMIZATION SECTION */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#181C26] border-[#2A303F]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className={`text-xs font-bold font-sans uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Destination WhatsApp Number / آرڈر موصول کرنے والا نمبر
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingWhatsApp(!isEditingWhatsApp)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingWhatsApp ? 'Done' : 'Change / Edit Number'}</span>
                  </button>
                </div>

                {/* Preset WhatsApp Options */}
                <div className="flex flex-wrap gap-2 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('main')}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      whatsappPreset === 'main'
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                        : isLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          : 'bg-[#12151D] text-slate-300 border-[#313848]'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${whatsappPreset === 'main' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Main Showroom ({cleanWhatsAppNumber(settings.whatsappNumber)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('cargo')}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      whatsappPreset === 'cargo'
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                        : isLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          : 'bg-[#12151D] text-slate-300 border-[#313848]'
                    }`}
                  >
                    <Truck className={`w-3.5 h-3.5 ${whatsappPreset === 'cargo' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Wholesale Cargo Line (+92 300 8547219)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('custom')}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      whatsappPreset === 'custom'
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                        : isLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          : 'bg-[#12151D] text-slate-300 border-[#313848]'
                    }`}
                  >
                    <SlidersHorizontal className={`w-3.5 h-3.5 ${whatsappPreset === 'custom' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Custom Number</span>
                  </button>
                </div>

                {/* Custom WhatsApp Number Input Field */}
                {(isEditingWhatsApp || whatsappPreset === 'custom') && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Enter Target WhatsApp Number (e.g. 03001234567 or 923001234567):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customWhatsAppNumber}
                        onChange={(e) => setCustomWhatsAppNumber(e.target.value)}
                        placeholder="03001234567"
                        className={`flex-1 text-xs font-mono px-3 py-2 rounded-lg border outline-none ${
                          isLight 
                            ? 'bg-white text-slate-900 border-slate-300 focus:border-emerald-500' 
                            : 'bg-[#10131A] text-white border-[#313848] focus:border-emerald-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingWhatsApp(false)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Contact & Delivery Info */}
              <div className={`space-y-3 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#252A36]'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Your Information (آپ کی معلومات)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans text-xs">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Name / Workshop Name"
                      className={`w-full text-xs font-sans pl-8 pr-3 py-2.5 rounded-lg border outline-none transition-colors ${
                        isLight 
                          ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' 
                          : 'bg-[#10131A] text-white border-[#313848] focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="City / Delivery Location (e.g. Rawalpindi)"
                      className={`w-full text-xs font-sans pl-8 pr-3 py-2.5 rounded-lg border outline-none transition-colors ${
                        isLight 
                          ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' 
                          : 'bg-[#10131A] text-white border-[#313848] focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans text-xs">
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Your WhatsApp Contact Number"
                      className={`w-full text-xs font-sans pl-8 pr-3 py-2.5 rounded-lg border outline-none transition-colors ${
                        isLight 
                          ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' 
                          : 'bg-[#10131A] text-white border-[#313848] focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Special wholesale / cargo notes"
                      className={`w-full text-xs font-sans pl-8 pr-3 py-2.5 rounded-lg border outline-none transition-colors ${
                        isLight 
                          ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' 
                          : 'bg-[#10131A] text-white border-[#313848] focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 font-sans">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Showroom Rate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Same-Day Cargo Dispatch</span>
                </div>
              </div>

              {/* Submit to WhatsApp Button */}
              <a
                id="cart-submit-whatsapp-btn"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSubmitCart}
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider py-4 px-6 rounded-xl transition-all active:scale-[0.98] font-sans text-center shadow-lg cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white shrink-0" />
                <span>
                  Submit {cart.length} Tool(s) Order to WhatsApp ({cleanWhatsAppNumber(activeWhatsApp)})
                </span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
