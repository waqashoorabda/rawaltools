import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Phone, 
  Check, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Copy, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Minus, 
  MapPin, 
  FileText, 
  Tag, 
  Sparkles, 
  Share2, 
  QrCode,
  ExternalLink,
  Link2,
  Send,
  Star
} from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { buildProductWhatsAppUrl } from '../utils/whatsapp';
import { trackWhatsAppClick } from '../utils/analytics';
import { copyProductLink, shareProduct, getProductDeepLinkUrl } from '../utils/share';
import { ProductReviewsSection } from './ProductReviewsSection';
import { getProductReviewStats } from '../utils/storage';

interface ProductDetailModalProps {
  product: Product | null;
  settings: StoreSettings;
  theme?: ThemeId;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number, note?: string, selectedSize?: string) => void;
  onOpenQrModal?: (product: Product) => void;
  isInCart: boolean;
  isAdmin: boolean;
  onEditProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  theme = 'industrial_yellow',
  isOpen,
  onClose,
  onAddToCart,
  onOpenQrModal,
  isInCart,
  isAdmin,
  onEditProduct,
}) => {
  if (!isOpen || !product) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(
    product.defaultSize || (product.availableSizes && product.availableSizes[0]) || ''
  );
  const [customerCity, setCustomerCity] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'];

  const currentImage = images[activeImageIndex] || images[0];

  const handleCopyLink = async () => {
    const res = await copyProductLink(product.id);
    if (res.success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleShareProduct = async () => {
    const shared = await shareProduct(product, settings.storeName);
    if (shared) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const shareableUrl = getProductDeepLinkUrl(product.id);
  const socialShareWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out ${product.name} at ${settings.storeName}:\n${shareableUrl}`
  )}`;

  const whatsappUrl = buildProductWhatsAppUrl(
    product,
    settings,
    quantity,
    customerNote,
    customerCity,
    selectedSize
  );

  const subtotal = product.hasPrice && product.price ? product.price * quantity : null;
  const refCode = product.sku ? `REF. ${product.sku}` : `REF. RT-${product.id.substring(0, 4).toUpperCase()}`;

  // Calculate discount percentage if discountPrice is present
  const discountPercent = product.price && product.discountPrice && product.discountPrice > product.price
    ? Math.round(((product.discountPrice - product.price) / product.discountPrice) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans animate-fadeIn">
      <div
        id="product-detail-modal"
        className={`relative border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto transition-colors ${
          isLight 
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-900/15' 
            : 'bg-[#10141D] text-[#F1F3F7] border-[#252C3C]'
        }`}
      >
        {/* Header Bar */}
        <div className={`sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-100' : 'bg-[#10141D]/95 border-[#202736]'
        }`}>
          <div className="flex items-center gap-3">
            <span 
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border"
              style={{
                backgroundColor: `${themeConfig.previewAccent}20`,
                color: themeConfig.previewAccent,
                borderColor: `${themeConfig.previewAccent}40`,
              }}
            >
              {product.category}
            </span>
            <span className="text-xs text-slate-400 font-mono tracking-wider">
              {refCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQrModal && onOpenQrModal(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              style={{
                backgroundColor: themeConfig.previewAccent,
                color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              }}
              title="Instant QR Code & Live Spec Tag"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>

            {isAdmin && onEditProduct && (
              <button
                onClick={() => {
                  onClose();
                  onEditProduct(product);
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium cursor-pointer ${
                  isLight 
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' 
                    : 'bg-[#1A202C] text-amber-400 border-[#2E3748] hover:bg-[#252E3E]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Product</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer shadow-sm ${
                copiedLink
                  ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                  : isLight 
                    ? 'text-sky-800 bg-sky-50 hover:bg-sky-100 border-sky-200' 
                    : 'text-sky-300 bg-[#162234] hover:bg-[#1E2E46] border-sky-500/40'
              }`}
              title={`Copy Deep-Link URL (?product=${product.id})`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Link2 className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              id="modal-close-btn"
              onClick={onClose}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isLight 
                  ? 'text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200' 
                  : 'text-slate-300 hover:text-white bg-[#181E2B] hover:bg-[#22293A] border-[#2A3448]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            {/* Main Stage Image */}
            <div className={`relative aspect-4/3 w-full rounded-2xl overflow-hidden border shadow-inner group flex items-center justify-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D14] border-[#222A3A]'
            }`}>
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-contain p-4 transform scale-100 group-hover:scale-95 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-md transition-all border cursor-pointer ${
                      isLight ? 'bg-white/90 hover:bg-white text-slate-800 border-slate-200' : 'bg-black/80 hover:bg-black text-white border-slate-700'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-md transition-all border cursor-pointer ${
                      isLight ? 'bg-white/90 hover:bg-white text-slate-800 border-slate-200' : 'bg-black/80 hover:bg-black text-white border-slate-700'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Stock Badge */}
              <div className="absolute top-3 left-3">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                    product.inStock
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {product.inStock ? '● In Stock Ready' : '✕ Available on Order'}
                </span>
              </div>

              {discountPercent && (
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] font-extrabold bg-rose-500 text-white px-2.5 py-1 rounded-full shadow">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'ring-2 ring-offset-1'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: activeImageIndex === idx ? themeConfig.previewAccent : isLight ? '#E2E8F0' : '#2A3448',
                    }}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Retail Trust Badges */}
            <div className={`rounded-xl p-4 border space-y-2 text-xs font-sans ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0E121B] border-[#1F2738] text-slate-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Genuine Industrial Product with 6-Month Armature Warranty</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Express Cargo (Daewoo/Faisal Movers) & TCS Dispatch across Pakistan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Direct WhatsApp Bill Quotation & Wholesale Support Desk</span>
              </div>
            </div>
          </div>

          {/* Right: Product Details & Order Actions */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-5">
            
            {/* Title & Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {product.brand && (
                  <span 
                    className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${themeConfig.previewAccent}15`,
                      color: themeConfig.previewAccent,
                      borderColor: `${themeConfig.previewAccent}40`,
                    }}
                  >
                    {product.brand}
                  </span>
                )}
                {product.isFeatured && (
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded">
                    ★ Top Seller
                  </span>
                )}

                {/* Live Star Rating Summary */}
                {(() => {
                  const stats = getProductReviewStats(product.id);
                  return (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded-md text-amber-400 text-xs font-bold">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= Math.round(stats.averageRating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono">{stats.averageRating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({stats.totalReviews} reviews)
                      </span>
                    </div>
                  );
                })()}
              </div>

              <h2 className={`text-2xl sm:text-3xl font-bold font-sans tracking-tight leading-snug ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {product.name}
              </h2>

              <p className={`text-sm font-sans leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {product.fullDescription || product.shortDescription}
              </p>
            </div>

            {/* Pricing Section */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#1F2738]'
            }`}>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Special Online / WhatsApp Price:
                </span>
                {product.hasPrice && product.price ? (
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span 
                      className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight"
                      style={{ color: themeConfig.previewAccent }}
                    >
                      {settings.currencySymbol} {product.price.toLocaleString()}
                    </span>
                    {product.discountPrice && (
                      <span className="text-sm text-slate-400 line-through font-medium font-mono">
                        {settings.currencySymbol} {product.discountPrice.toLocaleString()}
                      </span>
                    )}
                    {discountPercent && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {product.unit && (
                      <span className="text-xs text-slate-400 font-sans font-medium">
                        / {product.unit}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <span 
                      className="text-xl font-bold flex items-center gap-2 font-sans"
                      style={{ color: themeConfig.previewAccent }}
                    >
                      <Phone className="w-4 h-4" />
                      <span>Price on Request</span>
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      (قیمت معلوم کرنے کیلئے برائے مہربانی WhatsApp پر رابطہ کریں)
                    </p>
                  </div>
                )}
                <span className="text-[11px] text-slate-400 block mt-1">
                  Inclusive of all showroom taxes • Wholesale inquiry available
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantity
                </span>
                <div className={`flex items-center border rounded-xl shadow-sm ${
                  isLight ? 'bg-white border-slate-300' : 'bg-[#151A24] border-[#2A3448]'
                }`}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-400 hover:text-white rounded-l-xl transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className={`px-3.5 font-mono font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 text-slate-400 hover:text-white rounded-r-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Subtotal */}
            {subtotal !== null && (
              <div 
                className="text-xs font-sans flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{
                  backgroundColor: `${themeConfig.previewAccent}10`,
                  borderColor: `${themeConfig.previewAccent}30`,
                }}
              >
                <span className="font-medium text-slate-400">Total Calculation ({quantity} {product.unit || 'piece'}):</span>
                <span 
                  className="font-bold text-base font-mono"
                  style={{ color: themeConfig.previewAccent }}
                >
                  {settings.currencySymbol} {subtotal.toLocaleString()}
                </span>
              </div>
            )}

            {/* Size Variant Selection */}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#1F2738]'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">
                    Select Size / Spec Variant (سائز منتخب کریں):
                  </span>
                  <span 
                    className="font-bold font-mono"
                    style={{ color: themeConfig.previewAccent }}
                  >
                    {selectedSize || product.availableSizes[0]}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.availableSizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`p-2.5 rounded-lg border text-xs font-sans font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'font-bold shadow-sm'
                            : isLight
                              ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-[#151A24] hover:bg-[#1C2332] text-slate-300 border-[#2A3448]'
                        }`}
                        style={isSelected ? {
                          backgroundColor: themeConfig.previewAccent,
                          borderColor: themeConfig.previewAccent,
                          color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                        } : {}}
                      >
                        <span>{sz}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Key Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                  {product.specifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#1F2738]'
                      }`}
                    >
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">{spec.key}</span>
                      <span className={`font-bold mt-0.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* City & Note Inputs */}
            <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-700/40'}`}>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Delivery & Wholesale Details (Optional):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Delivery City (e.g. Rawalpindi)"
                    className={`w-full text-xs font-sans pl-8 pr-3 py-2 rounded-lg border outline-none ${
                      isLight 
                        ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-400' 
                        : 'bg-[#151A24] text-white border-[#2A3448] focus:border-amber-400'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Wholesale rate / note..."
                    className={`w-full text-xs font-sans px-3 py-2 rounded-lg border outline-none ${
                      isLight 
                        ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-400' 
                        : 'bg-[#151A24] text-white border-[#2A3448] focus:border-amber-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Shareable Deep-Link & Social Sharing Box */}
            <div className={`p-3.5 rounded-xl border space-y-2 text-xs font-sans ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#1F2738]'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Shareable Product Deep-Link:</span>
                </span>
                <span className="text-[10px] font-mono text-sky-500 font-bold">
                  ?product={product.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex-1 font-mono text-[11px] px-2.5 py-2 rounded-lg border truncate select-all ${
                  isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#151A24] text-slate-300 border-[#2A3448]'
                }`}>
                  {shareableUrl}
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm ${
                    copiedLink
                      ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                      : isLight
                        ? 'bg-sky-600 hover:bg-sky-700 text-white border-transparent'
                        : 'bg-sky-600 hover:bg-sky-500 text-white border-transparent'
                  }`}
                  title="Copy shareable deep-link URL"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <a
                  href={socialShareWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Share product link directly on WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <a
                id="modal-direct-whatsapp-btn"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-sm uppercase tracking-wide py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] shadow-md cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white shrink-0" />
                <span>
                  {product.hasPrice
                    ? `Order on WhatsApp (${quantity} ${product.unit || 'Item'})`
                    : `Get Quote on WhatsApp (${quantity} ${product.unit || 'Item'})`}
                </span>
              </a>

              <div className="grid grid-cols-2 gap-2 font-sans">
                <button
                  id="modal-add-to-cart-btn"
                  onClick={() => onAddToCart(product, quantity, customerNote, selectedSize)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  style={isInCart ? {
                    backgroundColor: themeConfig.previewAccent,
                    color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                    borderColor: 'transparent'
                  } : {
                    backgroundColor: isLight ? '#F1F5F9' : '#1A202C',
                    color: isLight ? '#0F172A' : '#F8FAFC',
                    borderColor: isLight ? '#E2E8F0' : '#2E384D'
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isInCart ? 'In Quote Bag' : '+ Add to Quote Bag'}</span>
                </button>

                <a
                  href={`tel:${settings.whatsappNumber}`}
                  className={`flex items-center justify-center gap-2 border py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                      : 'bg-[#181E2B] hover:bg-[#232B3D] text-slate-200 border-[#2A3448]'
                  }`}
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Call Store</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Customer Reviews & Testimonials Section */}
        <div className="px-6 pb-8">
          <ProductReviewsSection
            product={product}
            settings={settings}
            theme={theme}
            isAdmin={isAdmin}
          />
        </div>

      </div>
    </div>
  );
};
