import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, 
  Eye, 
  Plus, 
  Check, 
  Edit3, 
  Trash2, 
  PhoneCall,
  QrCode,
  Link2,
  Share2,
  Star,
} from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { buildProductWhatsAppUrl } from '../utils/whatsapp';
import { copyProductLink } from '../utils/share';
import { ThemeId, THEMES } from '../utils/theme';
import { getProductReviewStats } from '../utils/storage';

interface ProductCardProps {
  product: Product;
  settings: StoreSettings;
  isInCart: boolean;
  isAdmin: boolean;
  theme?: ThemeId;
  index?: number;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product, selectedSize?: string) => void;
  onOpenQrModal?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  isInCart,
  isAdmin,
  theme = 'industrial_yellow',
  index = 0,
  onViewDetails,
  onAddToCart,
  onOpenQrModal,
  onEditProduct,
  onDeleteProduct,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [selectedSize, setSelectedSize] = React.useState<string>(
    product.defaultSize || (product.availableSizes && product.availableSizes[0]) || ''
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await copyProductLink(product.id);
    if (res.success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const mainImage = product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';

  const whatsappUrl = buildProductWhatsAppUrl(product, settings, 1, '', '', selectedSize);
  const refNumber = product.sku ? `REF. ${product.sku}` : `REF. RT-${product.id.substring(0, 4).toUpperCase()}`;

  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ 
        duration: 0.42, 
        delay: Math.min((index % 4) * 0.06, 0.24),
        ease: [0.22, 1, 0.36, 1] 
      }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`group p-5 sm:p-6 flex flex-col justify-between relative rounded-none font-sans border ${
        isLight
          ? 'bg-white border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-md text-slate-900'
          : 'bg-[#15181F] border-[#262B35] hover:border-[var(--color-border-hover)] text-[#F1F3F7]'
      }`}
      style={{
        backgroundColor: isLight ? '#FFFFFF' : themeConfig.previewBg,
        borderColor: isLight ? '#E2E8F0' : undefined,
      }}
    >
      {/* Top Header Tag & Reference Code */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span 
          className="text-[10px] uppercase font-mono tracking-widest font-bold truncate"
          style={{ color: themeConfig.previewAccent }}
        >
          {product.category}
        </span>
        <span className={`text-[10px] font-mono tracking-widest shrink-0 ${isLight ? 'text-slate-400' : 'text-[#666]'}`}>
          {refNumber}
        </span>
      </div>

      {/* Image Preview Container with Smooth Hover Zoom-Out Effect */}
      <div 
        className={`h-48 w-full mb-5 flex items-center justify-center border relative overflow-hidden cursor-pointer transition-colors ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-[#2A2A2A]'
        }`}
        onClick={() => onViewDetails(product)}
      >
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transform scale-105 group-hover:scale-90 transition-transform duration-500 ease-out opacity-95 group-hover:opacity-100"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Featured / Stock Minimal Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {product.isFeatured && (
            <span 
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 font-mono shadow-sm"
              style={{
                backgroundColor: themeConfig.previewAccent,
                color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              }}
            >
              FEATURED
            </span>
          )}
          {product.brand && (
            <span className={`border text-[9px] font-mono uppercase px-1.5 py-0.5 ${
              isLight ? 'bg-white/90 text-slate-700 border-slate-300' : 'bg-black/80 text-[#AAA] border-[#333]'
            }`}>
              {product.brand}
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`p-1.5 rounded shadow-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono border ${
              copiedLink
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                : 'bg-black/80 hover:bg-sky-500 text-sky-400 hover:text-white border-sky-500/40'
            }`}
            title={copiedLink ? 'Deep-Link Copied to Clipboard!' : `Copy Shareable Deep-Link URL (?product=${product.id})`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Link2 className="w-3.5 h-3.5" />}
            <span className="font-bold">{copiedLink ? 'Copied!' : 'Link'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenQrModal) onOpenQrModal(product);
            }}
            className="p-1.5 bg-black/80 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/50 rounded shadow-md transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
            title="Scan / View Instant Product QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">QR</span>
          </button>
        </div>

        <div className="absolute bottom-2 right-2">
          <span
            className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
              product.inStock
                ? 'bg-black/90 text-[#22c55e] border-[#22c55e]/50'
                : 'bg-black/90 text-[#f43f5e] border-[#f43f5e]/50'
            }`}
          >
            {product.inStock ? '● In Stock' : '✕ Sold Out'}
          </span>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Star Rating & Social Proof Line */}
          {(() => {
            const stats = getProductReviewStats(product.id);
            return (
              <div 
                onClick={() => onViewDetails(product)}
                className="flex items-center gap-1.5 mb-1.5 cursor-pointer group-hover:opacity-90"
              >
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
                <span className="text-[11px] font-mono font-bold text-amber-500">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({stats.totalReviews})
                </span>
              </div>
            );
          })()}

          {/* Product Title in Modern E-Commerce Sans-Serif Font */}
          <h3
            onClick={() => onViewDetails(product)}
            className={`text-base sm:text-lg font-sans font-bold leading-snug transition-colors cursor-pointer line-clamp-2 ${
              isLight ? 'text-slate-900 hover:text-amber-600' : 'text-white hover:text-[var(--color-accent)]'
            }`}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Short Description */}
          <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed font-sans ${
            isLight ? 'text-slate-500' : 'text-[#888888]'
          }`}>
            {product.shortDescription}
          </p>

          {/* Available Sizes / Variants Selector */}
          {product.availableSizes && product.availableSizes.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-1 text-slate-400">
                <span>Select Size / Model:</span>
                <span className="text-amber-600 dark:text-amber-400 lowercase font-mono">
                  {selectedSize || product.availableSizes[0]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSize(sz);
                      }}
                      className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-500 font-bold shadow-xs'
                          : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            : 'bg-black/40 hover:bg-black/80 text-slate-300 border-[#333]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specifications Pills */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {product.specifications.slice(0, 2).map((spec, i) => (
                <span
                  key={i}
                  className={`border text-[10px] font-sans px-2 py-0.5 rounded ${
                    isLight 
                      ? 'bg-slate-100 text-slate-700 border-slate-200' 
                      : 'bg-black/30 text-[#AAA] border-[#2A2A2A]'
                  }`}
                >
                  <span className={isLight ? 'text-slate-400' : 'text-[#666]'}>{spec.key}:</span> {spec.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Section */}
        <div className={`pt-3 border-t space-y-2.5 ${isLight ? 'border-slate-200' : 'border-[#222222]'}`}>
          
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className={`text-[10px] uppercase mb-0.5 font-sans font-bold tracking-wider ${isLight ? 'text-slate-400' : 'text-[#555]'}`}>
                {product.hasPrice && product.price ? 'Special Price' : 'Status'}
              </div>
              {product.hasPrice && product.price ? (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span 
                    className="text-xl sm:text-2xl font-sans font-extrabold tracking-tight"
                    style={{ color: isLight ? '#0F172A' : themeConfig.previewAccent }}
                  >
                    {settings.currencySymbol} {product.price.toLocaleString()}
                  </span>
                  {product.discountPrice && (
                    <span className={`text-xs font-sans line-through ${isLight ? 'text-slate-400' : 'text-[#666]'}`}>
                      {settings.currencySymbol} {product.discountPrice.toLocaleString()}
                    </span>
                  )}
                  {product.unit && (
                    <span className={`text-[10px] font-sans ${isLight ? 'text-slate-400' : 'text-[#666]'}`}>
                      /{product.unit}
                    </span>
                  )}
                </div>
              ) : (
                <div className={`text-sm font-sans font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Price on Request
                </div>
              )}
            </div>

            {/* Quick Details, QR & Copy Link Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`p-2 border text-xs font-sans rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  copiedLink
                    ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                    : isLight 
                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200 hover:border-sky-300'
                      : 'bg-black/40 hover:bg-[#121E2F] text-sky-400 hover:text-sky-300 border-sky-500/30'
                }`}
                title={copiedLink ? 'Link Copied to Clipboard!' : `Copy Shareable Product Link (?product=${product.id})`}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-950 stroke-[2.5]" /> : <Link2 className="w-4 h-4" />}
                <span className="text-[10px] font-mono font-bold hidden sm:inline">{copiedLink ? 'Copied' : 'Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenQrModal && onOpenQrModal(product)}
                className={`p-2 border text-xs font-sans rounded-md transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-black/40 hover:bg-amber-400 hover:text-black text-amber-400 border-amber-500/40'
                }`}
                title="Instant Product QR Code & Specs"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                onClick={() => onViewDetails(product)}
                className={`p-2 border text-xs font-sans rounded-md transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-black/30 hover:bg-black/60 text-[#AAA] border-[#333] hover:text-white'
                }`}
                title="View Specifications & Full Images"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Action: Direct WhatsApp Order / Quote Button */}
          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Order on WhatsApp</span>
            </a>

            {/* Add to Quote Cart */}
            <button
              onClick={() => onAddToCart(product, selectedSize)}
              className={`p-2.5 border rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer ${
                isInCart
                  ? 'border-transparent shadow-sm'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-black/30 hover:bg-black/60 border-[#333] text-[#AAA] hover:text-white'
              }`}
              style={isInCart ? {
                backgroundColor: themeConfig.previewAccent,
                color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              } : undefined}
              title={isInCart ? 'In Quote List (Click to add more)' : 'Add to Multi-Item Quote List'}
            >
              {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Admin Management Quick Actions */}
          {isAdmin && (
            <div className="pt-2 border-t border-[#333] flex items-center justify-between gap-2 font-mono text-[10px]">
              <button
                onClick={() => onEditProduct && onEditProduct(product)}
                className="flex items-center gap-1 text-sky-400 hover:underline"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Specs / Price</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete product "${product.name}"?`)) {
                    onDeleteProduct && onDeleteProduct(product.id);
                  }
                }}
                className="flex items-center gap-1 text-rose-400 hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
};
