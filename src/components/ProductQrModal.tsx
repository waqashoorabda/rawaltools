import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { 
  X, 
  QrCode, 
  Download, 
  Printer, 
  Share2, 
  Check, 
  ShoppingCart, 
  MessageCircle, 
  Layers, 
  Cpu, 
  ExternalLink, 
  Scan, 
  Sparkles, 
  Info,
  CheckCircle2,
  Camera,
  Upload,
  RefreshCw,
  Search,
  ArrowRight,
  Eye,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { buildProductWhatsAppUrl } from '../utils/whatsapp';

interface ProductQrModalProps {
  product: Product | null;
  allProducts?: Product[];
  settings: StoreSettings;
  theme?: ThemeId;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number, customNote?: string, size?: string) => void;
  onSelectProduct?: (product: Product) => void;
  onViewProductDetails?: (product: Product) => void;
}

export const ProductQrModal: React.FC<ProductQrModalProps> = ({
  product,
  allProducts = [],
  settings,
  theme = 'industrial_yellow',
  isOpen,
  onClose,
  onAddToCart,
  onSelectProduct,
  onViewProductDetails,
}) => {
  if (!isOpen || !product) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    return product.defaultSize || (product.availableSizes && product.availableSizes[0]) || '';
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  
  // Tabs: 'qr_card' (QR code & label) | 'scanner_sim' (Scanner & simulator)
  const [activeTab, setActiveTab] = useState<'qr_card' | 'scanner_sim'>('qr_card');
  
  // Scanner Sub-Modes: 'camera' | 'upload' | 'simulate'
  const [scannerMode, setScannerMode] = useState<'camera' | 'upload' | 'simulate'>('simulate');
  
  // Camera & Detection States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [searchSimQuery, setSearchSimQuery] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Deep link URL encoded inside the QR Code: Includes both query param (?product=) and hash (#product-)
  const qrTargetUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?product=${encodeURIComponent(product.id)}#product-${encodeURIComponent(product.id)}`
    : `https://rawaltools.pk/?product=${product.id}#product-${product.id}`;

  // Update selected size if product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.defaultSize || (product.availableSizes && product.availableSizes[0]) || '');
    }
  }, [product]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Process decoded QR text payload
  const handleDecodedQrString = useCallback((rawCode: string) => {
    let matchedProduct: Product | undefined;
    
    // 1. Try JSON parsing
    try {
      if (rawCode.startsWith('{') && rawCode.endsWith('}')) {
        const parsed = JSON.parse(rawCode);
        if (parsed.id) {
          matchedProduct = allProducts.find((p) => p.id === parsed.id || p.sku === parsed.id);
        }
        if (!matchedProduct && parsed.sku) {
          matchedProduct = allProducts.find((p) => p.sku?.toLowerCase() === parsed.sku.toLowerCase());
        }
      }
    } catch {
      // not JSON, continue
    }

    // 2. Try URL param extraction (?product= or #product-)
    if (!matchedProduct) {
      try {
        const url = new URL(rawCode, window.location.origin);
        const pId = url.searchParams.get('product') || url.searchParams.get('p') || url.searchParams.get('id');
        if (pId) {
          matchedProduct = allProducts.find((p) => p.id === pId || p.sku?.toLowerCase() === pId.toLowerCase());
        }
        if (!matchedProduct && url.hash) {
          const hashId = url.hash.replace('#product-', '').replace('#p-', '').replace('#', '');
          matchedProduct = allProducts.find((p) => p.id === hashId || p.sku?.toLowerCase() === hashId.toLowerCase());
        }
      } catch {
        // not a valid URL, continue
      }
    }

    // 3. Try raw ID or SKU match
    if (!matchedProduct) {
      const clean = rawCode.trim();
      matchedProduct = allProducts.find(
        (p) => p.id === clean || p.sku?.toLowerCase() === clean.toLowerCase() || p.name.toLowerCase().includes(clean.toLowerCase())
      );
    }

    if (matchedProduct) {
      if (onSelectProduct) {
        onSelectProduct(matchedProduct);
      }
      setScanSuccessMessage(`✓ QR Verified: ${matchedProduct.name} (${matchedProduct.sku || matchedProduct.id})`);
      setTimeout(() => setScanSuccessMessage(null), 4000);
    } else {
      setScanSuccessMessage(`Scanned Code: "${rawCode.substring(0, 35)}..." (Searching inventory...)`);
      setTimeout(() => setScanSuccessMessage(null), 3000);
    }
  }, [allProducts, onSelectProduct]);

  // Continuous Camera Scan Loop
  const scanCameraFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanCameraFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDecodedQrString(code.data);
        }
      } catch {
        // ignore frame scan hiccups
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanCameraFrame);
  }, [handleDecodedQrString]);

  // Start Live Camera
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or container.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(scanCameraFrame);
      }
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permission or use the simulated selector.');
      setIsCameraActive(false);
    }
  };

  // Switch scanner mode handler
  useEffect(() => {
    if (activeTab === 'scanner_sim' && scannerMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, scannerMode]);

  // Handle uploaded QR image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDecodedQrString(code.data);
          } else {
            setCameraError('No valid QR code was detected in this image. Please try a clearer photo.');
            setTimeout(() => setCameraError(null), 3500);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity, undefined, selectedSize);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1800);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const handleDownloadQrSvg = () => {
    const svgElement = document.getElementById(`product-qr-${product.id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `rawal-tools-${product.sku || product.id}-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Filter products for simulator search
  const filteredSimulatorProducts = allProducts.filter((p) => {
    if (!searchSimQuery.trim()) return true;
    const q = searchSimQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans">
      <div 
        className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border flex flex-col my-auto transition-all animate-in zoom-in-95 ${
          isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-[#0E121B] text-white border-[#273248]'
        }`}
      >
        
        {/* Header Bar */}
        <div className={`sticky top-0 z-20 px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0E121B]/95 border-[#222A3A]'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-black shadow-sm shrink-0"
              style={{ backgroundColor: themeConfig.previewAccent }}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold leading-tight">
                  Instant Product QR Code & Specification Sync
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 border font-bold uppercase hidden sm:inline" style={{ color: themeConfig.previewAccent, borderColor: `${themeConfig.previewAccent}60` }}>
                  LIVE SYNC
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs font-mono line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Scan to instantly view machine specs, live stock & open full product page.
              </p>
            </div>
          </div>

          {/* Action Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center border rounded-lg p-0.5 text-xs font-mono ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#151923] border-[#2B3447]'}`}>
              <button
                type="button"
                onClick={() => setActiveTab('qr_card')}
                className={`px-2.5 sm:px-3 py-1 rounded transition-colors cursor-pointer text-xs ${
                  activeTab === 'qr_card' 
                    ? 'bg-amber-400 text-black font-bold shadow-sm' 
                    : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                QR Label
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scanner_sim')}
                className={`px-2.5 sm:px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                  activeTab === 'scanner_sim' 
                    ? 'bg-amber-400 text-black font-bold shadow-sm' 
                    : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scan className="w-3 h-3" />
                <span>Test Scanner</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 sm:p-2 border transition-colors cursor-pointer ${
                isLight 
                  ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300' 
                  : 'text-slate-400 hover:text-white bg-[#161B26] hover:bg-[#202736] border-[#2A3448]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-7 space-y-6">
          
          {activeTab === 'scanner_sim' ? (
            /* =========================================================================
               Interactive QR Code Scanner & Inventory Fetch Simulator
               ========================================================================= */
            <div className="space-y-6">
              
              {/* Scan Mode Sub-Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                    Scan Input Method:
                  </span>
                  
                  <div className={`flex items-center border rounded-lg p-0.5 text-xs font-mono ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#141924] border-[#263145]'}`}>
                    <button
                      type="button"
                      onClick={() => setScannerMode('simulate')}
                      className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                        scannerMode === 'simulate'
                          ? 'bg-amber-400 text-black font-bold shadow-sm'
                          : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tool Simulator</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScannerMode('camera')}
                      className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                        scannerMode === 'camera'
                          ? 'bg-amber-400 text-black font-bold shadow-sm'
                          : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Live Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScannerMode('upload');
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                        scannerMode === 'upload'
                          ? 'bg-amber-400 text-black font-bold shadow-sm'
                          : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR Photo</span>
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Scanner Engine Ready</span>
                </div>
              </div>

              {/* Success / Error Feedback Banners */}
              {scanSuccessMessage && (
                <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-mono flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">{scanSuccessMessage}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80">LIVE SYNCED</span>
                </div>
              )}

              {cameraError && (
                <div className="p-3 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-lg text-xs font-mono flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* 1. Live Camera Scanning Viewport */}
              {scannerMode === 'camera' && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-black aspect-video sm:max-h-[320px] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Laser Target Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-amber-400/80 rounded-xl relative shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_8px_#F59E0B] animate-bounce" />
                      <div className="absolute top-2 left-2 text-[10px] font-mono text-amber-400 bg-black/70 px-1.5 py-0.5 rounded">
                        Aim at Rawal Tools QR
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono bg-black/80 backdrop-blur-sm p-2 rounded text-white border border-slate-700">
                    <span>📷 Point camera at any tool QR code</span>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-2.5 py-1 bg-amber-400 text-black font-bold flex items-center gap-1 rounded hover:bg-amber-300 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Restart Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Upload QR Image Viewport */}
              {scannerMode === 'upload' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-xl text-center space-y-3 cursor-pointer transition-colors ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 hover:border-amber-500 hover:bg-amber-50/20' 
                      : 'bg-[#131722] border-[#283247] hover:border-amber-400 hover:bg-[#181E2B]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base">Upload QR Code Photo or Screenshot</h4>
                    <p className="text-xs text-slate-400">Click to select an image from your phone gallery or computer storage</p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-amber-400 text-black text-xs font-mono font-bold uppercase tracking-wider rounded shadow-sm hover:bg-amber-300"
                  >
                    Select QR Image File
                  </button>
                </div>
              )}

              {/* 3. Fast Inventory Simulator Dropdown / Search */}
              {scannerMode === 'simulate' && (
                <div className={`p-4 sm:p-5 border rounded-xl space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#263145]'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Tool to Simulate Live QR Data Fetch:</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {allProducts.length} Tools Available in Catalog
                    </span>
                  </div>

                  {/* Search Bar for Quick Filtering */}
                  <div className="relative">
                    <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={searchSimQuery}
                      onChange={(e) => setSearchSimQuery(e.target.value)}
                      placeholder="Type tool name, SKU, or category (e.g. hammer, grinder, RT-101)..."
                      className={`w-full text-xs font-mono pl-8 pr-3 py-2 border rounded-lg outline-none transition-colors ${
                        isLight 
                          ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' 
                          : 'bg-[#0E121B] text-white border-[#2A3448] focus:border-amber-400'
                      }`}
                    />
                  </div>

                  {/* Standard High-Contrast Select Input */}
                  <select
                    value={product.id}
                    onChange={(e) => {
                      const found = allProducts.find((p) => p.id === e.target.value);
                      if (found && onSelectProduct) {
                        onSelectProduct(found);
                        setScanSuccessMessage(`✓ Selected: ${found.name} (${found.sku || found.id})`);
                        setTimeout(() => setScanSuccessMessage(null), 3000);
                      }
                    }}
                    className={`w-full p-3 text-xs sm:text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 cursor-pointer font-bold ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-900 focus:ring-amber-500' 
                        : 'bg-[#0E121B] border-[#2B3447] text-white focus:ring-amber-400'
                    }`}
                  >
                    {filteredSimulatorProducts.map((p) => (
                      <option 
                        key={p.id} 
                        value={p.id}
                        className={isLight ? 'bg-white text-slate-900 py-1' : 'bg-[#0E121B] text-white py-1'}
                      >
                        [{p.sku || p.id}] {p.name} — {p.category} ({p.hasPrice ? `${settings.currencySymbol} ${p.price?.toLocaleString()}` : 'Price on Quote'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* =========================================================================
                  LIVE SCANNED PRODUCT OUTPUT & "VIEW FULL PRODUCT PAGE" ACTION
                  ========================================================================= */}
              <div className={`p-5 sm:p-6 border-2 rounded-xl space-y-5 transition-all shadow-lg ${
                isLight ? 'bg-white border-amber-400/80 text-slate-900' : 'bg-[#10141F] border-amber-400/70 text-white'
              }`}>
                
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/30 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-emerald-400">
                      LIVE SCANNED PRODUCT SYNCED (لائیو ڈیٹا کنفرمڈ)
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    SKU Hash: {product.sku || product.id}
                  </span>
                </div>

                {/* Main Product Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* Product Image Preview */}
                  <div 
                    onClick={() => {
                      if (onViewProductDetails) {
                        onViewProductDetails(product);
                      } else if (onClose) {
                        onClose();
                        window.location.hash = `#product-${product.id}`;
                      }
                    }}
                    className="md:col-span-4 relative rounded-xl overflow-hidden border border-slate-700/40 bg-black/40 aspect-square sm:aspect-auto sm:h-52 cursor-pointer group"
                    title="Click to open full product page"
                  >
                    <img
                      src={(product.images && product.images[0]) || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80"}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-black/80 text-amber-400 border border-amber-400/40 backdrop-blur-sm">
                        {product.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 bg-amber-400 text-black text-xs font-mono font-bold uppercase tracking-wider rounded shadow-md flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View Page
                      </span>
                    </div>
                  </div>

                  {/* Product Details & Specifications */}
                  <div className="md:col-span-8 space-y-3">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {product.brand && (
                          <span className={`text-[11px] font-mono px-2 py-0.5 border ${isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#181E2B] border-[#273247] text-slate-300'}`}>
                            {product.brand}
                          </span>
                        )}
                        <span className={`text-[11px] font-mono px-2 py-0.5 font-bold ${
                          product.inStock 
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' 
                            : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                        }`}>
                          {product.inStock ? '● In Stock Ready in Warehouse' : '○ Available on Order'}
                        </span>
                      </div>

                      <h3 
                        onClick={() => {
                          if (onViewProductDetails) {
                            onViewProductDetails(product);
                          } else if (onClose) {
                            onClose();
                            window.location.hash = `#product-${product.id}`;
                          }
                        }}
                        className="text-lg sm:text-xl font-bold font-serif-editorial leading-tight cursor-pointer hover:text-amber-400 transition-colors flex items-center gap-1.5"
                        title="Click to open full product page"
                      >
                        <span>{product.name}</span>
                        <ExternalLink className="w-4 h-4 opacity-50 shrink-0" />
                      </h3>
                      
                      <div className="pt-1">
                        {product.hasPrice && product.price ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-mono font-bold" style={{ color: themeConfig.previewAccent }}>
                              {settings.currencySymbol} {product.price.toLocaleString()}
                            </span>
                            {product.discountPrice && (
                              <span className="text-xs line-through font-mono text-slate-500">
                                {settings.currencySymbol} {product.discountPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400">/ {product.unit || 'Piece'}</span>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-amber-400 font-mono">
                            Price on WhatsApp Request (Industrial Tier)
                          </div>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs font-light line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {product.shortDescription}
                    </p>

                    {/* Quick Specs Strip */}
                    {product.specifications && product.specifications.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                        {product.specifications.slice(0, 4).map((spec, i) => (
                          <div key={i} className={`p-1.5 rounded flex items-center justify-between border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161B27] border-[#253046]'}`}>
                            <span className="text-slate-400 truncate mr-1">{spec.key}:</span>
                            <span className="font-bold truncate">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                </div>

                {/* =========================================================================
                    PRIMARY CONVERSION ACTIONS: OPEN FULL PAGE, ADD TO CART, WHATSAPP
                    ========================================================================= */}
                <div className="pt-3 border-t border-slate-700/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                  
                  {/* PRIMARY ACTION: OPEN FULL PRODUCT PAGE & SPECS */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewProductDetails) {
                        onViewProductDetails(product);
                      } else if (onClose) {
                        onClose();
                        window.location.hash = `#product-${product.id}`;
                      }
                    }}
                    className="flex-1 sm:flex-none px-5 py-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-black" />
                    <span>Open Full Product Page & Specs (پروڈکٹ کا مکمل صفحہ کھولیں)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onAddToCart && (
                      <button
                        type="button"
                        onClick={handleAddToCartClick}
                        className={`flex-1 sm:flex-none px-4 py-3 border text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          addedAnimation 
                            ? 'bg-emerald-500 text-white border-emerald-400' 
                            : isLight 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300' 
                              : 'bg-[#181F2E] hover:bg-[#232D42] text-white border-[#2A354C]'
                        }`}
                      >
                        {addedAnimation ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{addedAnimation ? 'Added!' : 'Add to Quote'}</span>
                      </button>
                    )}

                    <a
                      href={buildProductWhatsAppUrl(settings, product, 1, `(Scanned QR Code: ${product.sku || product.id})`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            /* =========================================================================
               Standard Printable QR Code Card & Live Product Sheet
               ========================================================================= */
            <div ref={printAreaRef} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Crisp High-Res SVG QR Code */}
              <div className={`md:col-span-5 p-5 border rounded-xl flex flex-col items-center justify-center text-center space-y-4 ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#121620] border-[#222A3A]'
              }`}>
                <div className="relative p-4 bg-white rounded-xl shadow-md border-2 border-slate-200 group">
                  <QRCodeSVG
                    id={`product-qr-${product.id}`}
                    value={qrTargetUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: settings.logoUrl || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80",
                      x: undefined,
                      y: undefined,
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none rounded-xl" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    DIRECT RECOGNITION CODE
                  </span>
                  <div className="font-mono text-xs font-bold flex items-center justify-center gap-1.5" style={{ color: themeConfig.previewAccent }}>
                    <span>SKU: {product.sku || product.id}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scan with smartphone camera for instant WhatsApp checkout.
                  </p>
                </div>

                {/* QR Quick Actions */}
                <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/30">
                  <button
                    type="button"
                    onClick={handleDownloadQrSvg}
                    className={`py-2 px-1 text-[11px] font-mono border rounded flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#19202E] hover:bg-[#232C3E] text-slate-200 border-[#2D384D]'
                    }`}
                    title="Download SVG QR Graphic"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>SVG QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintLabel}
                    className={`py-2 px-1 text-[11px] font-mono border rounded flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#19202E] hover:bg-[#232C3E] text-slate-200 border-[#2D384D]'
                    }`}
                    title="Print Workshop Shelf Tag"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    <span>Print Tag</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`py-2 px-1 text-[11px] font-mono border rounded flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#19202E] hover:bg-[#232C3E] text-slate-200 border-[#2D384D]'
                    }`}
                    title="Copy direct web link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Instant Live Product Information & Direct Action Card */}
              <div className="md:col-span-7 space-y-5">
                
                {/* Product Header & Pricing */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span 
                      className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 font-bold"
                      style={{ backgroundColor: `${themeConfig.previewAccent}25`, color: themeConfig.previewAccent }}
                    >
                      {product.category}
                    </span>
                    {product.brand && (
                      <span className={`text-xs font-mono px-2 py-0.5 border ${isLight ? 'border-slate-300 text-slate-600' : 'border-[#2B3447] text-slate-400'}`}>
                        {product.brand}
                      </span>
                    )}
                    <span className={`text-xs font-mono px-2 py-0.5 font-semibold ${
                      product.inStock 
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' 
                        : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                    }`}>
                      {product.inStock ? '● In Stock Ready to Ship' : '○ Made on Order'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial leading-snug">
                    {product.name}
                  </h2>

                  <div className="flex items-baseline gap-3 pt-1">
                    {product.hasPrice && product.price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-mono font-bold" style={{ color: themeConfig.previewAccent }}>
                          {settings.currencySymbol} {product.price.toLocaleString()}
                        </span>
                        {product.discountPrice && (
                          <span className="text-sm line-through font-mono text-slate-500">
                            {settings.currencySymbol} {product.discountPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">/ {product.unit || 'Piece'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-amber-400 font-mono">
                          Price on WhatsApp Request
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          (Special Industrial Project Tier)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <p className={`text-xs sm:text-sm font-light leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {product.shortDescription}
                </p>

                {/* Live Specifications Quick Table */}
                {product.specifications && product.specifications.length > 0 && (
                  <div className={`p-3.5 border rounded-lg space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121620] border-[#222A3A]'}`}>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      <span>Technical Specifications (QR Verified)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {product.specifications.slice(0, 4).map((spec, i) => (
                        <div key={i} className={`p-2 rounded flex items-center justify-between border ${isLight ? 'bg-white border-slate-200' : 'bg-[#181E2B] border-[#263145]'}`}>
                          <span className="text-slate-400">{spec.key}:</span>
                          <span className="font-bold">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size / Variant Selector (if applicable) */}
                {product.availableSizes && product.availableSizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Size / Disc Diameter:</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1.5 text-xs font-mono font-bold border transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-amber-400 text-black border-amber-300 shadow-md ring-1 ring-amber-300'
                              : isLight 
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                                : 'bg-[#151924] hover:bg-[#1E2536] text-slate-300 border-[#2A3448]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Qty Selector */}
                    <div className={`flex items-center border font-mono ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#151924] border-[#2A3448]'}`}>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 text-sm font-bold hover:bg-black/10 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 text-sm font-bold min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-2 text-sm font-bold hover:bg-black/10 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* View Full Product Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewProductDetails) {
                          onViewProductDetails(product);
                        } else if (onClose) {
                          onClose();
                          window.location.hash = `#product-${product.id}`;
                        }
                      }}
                      className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Full Details</span>
                    </button>

                    {/* Direct Add to Cart Button */}
                    <button
                      type="button"
                      onClick={handleAddToCartClick}
                      className={`flex-1 py-2.5 px-4 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        addedAnimation 
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' 
                          : 'bg-amber-400 hover:bg-amber-300 text-black'
                      }`}
                    >
                      {addedAnimation ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added! (شامل ہو گیا)</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Quote ({quantity}x)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Direct WhatsApp Order CTA */}
                  <a
                    href={buildProductWhatsAppUrl(settings, product, quantity, `(Via Live QR Scan: ${selectedSize || 'Standard'})`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Instant Direct Order on WhatsApp</span>
                  </a>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
