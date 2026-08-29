import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartModal } from './components/CartModal';
import { AdminModal } from './components/AdminModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { Footer } from './components/Footer';
import { RetailStoryBanners } from './components/RetailStoryBanners';
import { CategoryShowcase } from './components/CategoryShowcase';
import { ThemePreviewBar } from './components/ThemePreviewBar';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { FrontpageQuickEditModal } from './components/FrontpageQuickEditModal';
import { AdBanner } from './components/AdBanner';
import { ProductQrModal } from './components/ProductQrModal';
import { PillarPagesModal } from './components/PillarPagesModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { BlogSection } from './components/BlogSection';
import { ArticlePageView } from './components/ArticlePageView';
import { TeamModal } from './components/TeamModal';
import { CartItem, Product, ProductFilters, StoreSettings, AdSettings, CustomJsSettings, BlogPost, PillarPageType, CookieConsentSettings, TeamMember, ProductReview, AdminAccountsConfig, AdminRole } from './types';
import { ThemeId, THEMES } from './utils/theme';
import { PageContent } from './types';
import {
  loadStoredProducts,
  saveStoredProducts,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredCart,
  saveStoredCart,
  loadStoredPageContent,
  saveStoredPageContent,
  loadStoredAdSettings,
  saveStoredAdSettings,
  loadStoredCustomJs,
  saveStoredCustomJs,
  loadStoredBlogPosts,
  saveStoredBlogPosts,
  loadStoredCookieConsent,
  saveStoredCookieConsent,
  loadStoredTeamMembers,
  saveStoredTeamMembers,
  loadStoredReviews,
  saveStoredReviews,
  loadStoredAdminAccounts,
  saveStoredAdminAccounts,
  getStoredActiveAdminRole,
  setStoredActiveAdminRole,
  resetToDefaultCatalog,
  exportCatalogJSON,
  getStoredAdminAuthenticated,
  setStoredAdminAuthenticated,
} from './utils/storage';
import { applyCustomJsSettings } from './utils/scriptInjector';
import { 
  trackPageView, 
  trackProductView, 
  trackAddToCart, 
  trackSearch, 
  trackWhatsAppClick 
} from './utils/analytics';
import {
  queueChangeAutoSync,
  checkAndRunDailyAutoBackup,
} from './services/googleDriveBackupService';
import { 
  Package, 
  MessageCircle, 
  Sliders, 
  Palette, 
  Type, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Check, 
  Sparkles,
  BarChart3,
  Edit3,
  Megaphone,
  Code2,
  BookOpen,
  QrCode
} from 'lucide-react';
import { buildDirectContactWhatsAppUrl } from './utils/whatsapp';

export default function App() {
  // Primary State
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [settings, setSettings] = useState<StoreSettings>(() => loadStoredSettings());
  const [cart, setCart] = useState<CartItem[]>(() => loadStoredCart());
  const [pageContent, setPageContent] = useState<PageContent>(() => loadStoredPageContent());
  const [adSettings, setAdSettings] = useState<AdSettings>(() => loadStoredAdSettings());
  const [customJsSettings, setCustomJsSettings] = useState<CustomJsSettings>(() => loadStoredCustomJs());
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => loadStoredBlogPosts());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadStoredTeamMembers());
  const [reviews, setReviews] = useState<ProductReview[]>(() => loadStoredReviews());
  const [cookieConsent, setCookieConsent] = useState<CookieConsentSettings>(() => loadStoredCookieConsent());
  const [adminAccounts, setAdminAccounts] = useState<AdminAccountsConfig>(() => loadStoredAdminAccounts());
  const [activeAdminRole, setActiveAdminRole] = useState<AdminRole>(() => getStoredActiveAdminRole());
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [isVisualEditMode, setIsVisualEditMode] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<string>('analytics');

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    const saved = settings.selectedTheme as ThemeId;
    if (saved && THEMES[saved]) return saved;
    return 'industrial_yellow';
  });

  const themeConfig = THEMES[currentTheme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  // Modals state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [pillarPage, setPillarPage] = useState<PillarPageType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getStoredAdminAuthenticated());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: '',
    category: 'All Products',
    priceFilter: 'all',
    stockFilter: 'all',
    brandFilter: 'All Brands',
    sortBy: 'featured',
  });

  // Track initial page view & check daily Google Drive backup
  useEffect(() => {
    trackPageView();
    // Check if daily backup for today has been saved in Google Drive
    checkAndRunDailyAutoBackup();
  }, []);

  // Save to storage on changes and queue Google Drive live auto-sync
  useEffect(() => {
    saveStoredProducts(products);
    queueChangeAutoSync('Products updated');
  }, [products]);

  useEffect(() => {
    saveStoredSettings(settings);
    queueChangeAutoSync('Settings updated');
  }, [settings]);

  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  useEffect(() => {
    saveStoredPageContent(pageContent);
    queueChangeAutoSync('Page content updated');
  }, [pageContent]);

  useEffect(() => {
    saveStoredAdSettings(adSettings);
    queueChangeAutoSync('Ad settings updated');
  }, [adSettings]);

  useEffect(() => {
    saveStoredCustomJs(customJsSettings);
    applyCustomJsSettings(customJsSettings);
    queueChangeAutoSync('Custom JS updated');
  }, [customJsSettings]);

  useEffect(() => {
    saveStoredBlogPosts(blogPosts);
    queueChangeAutoSync('Blog articles updated');
  }, [blogPosts]);

  useEffect(() => {
    saveStoredTeamMembers(teamMembers);
    queueChangeAutoSync('Team members updated');
  }, [teamMembers]);

  useEffect(() => {
    saveStoredReviews(reviews);
    queueChangeAutoSync('Reviews updated');
  }, [reviews]);

  useEffect(() => {
    saveStoredAdminAccounts(adminAccounts);
    queueChangeAutoSync('Admin accounts updated');
  }, [adminAccounts]);

  useEffect(() => {
    if (cookieConsent) {
      saveStoredCookieConsent(cookieConsent);
    }
  }, [cookieConsent]);

  const handleScrollToBlog = () => {
    setActiveArticle(null);
    setTimeout(() => {
      const el = document.getElementById('blog-articles-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // Quick Open Handlers for Ads and Custom JS
  const handleOpenAdSlotEditor = (_slotId?: string) => {
    setAdminInitialTab('ads_manager');
    setIsAdminOpen(true);
  };

  const handleOpenCustomJsEditor = () => {
    setAdminInitialTab('custom_js');
    setIsAdminOpen(true);
  };

  // Page Content updater handlers
  const handleUpdatePageContentField = (field: keyof PageContent, value: string) => {
    setPageContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveFullPageContent = (newContent: PageContent) => {
    setPageContent(newContent);
    saveStoredPageContent(newContent);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...pageContent.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setPageContent((prev) => ({
      ...prev,
      sectionOrder: newOrder,
    }));
  };

  const handleToggleHideSection = (sectionId: string) => {
    const isHidden = pageContent.hiddenSections.includes(sectionId);
    let updatedHidden: string[];
    if (isHidden) {
      updatedHidden = pageContent.hiddenSections.filter((id) => id !== sectionId);
    } else {
      updatedHidden = [...pageContent.hiddenSections, sectionId];
    }
    setPageContent((prev) => ({
      ...prev,
      hiddenSections: updatedHidden,
    }));
  };

  // Handle Theme Selection & Persistence
  const handleSelectTheme = (newTheme: ThemeId) => {
    setCurrentTheme(newTheme);
    setSettings((prev) => ({
      ...prev,
      selectedTheme: newTheme,
    }));
  };

  // URL Path & Hash Router: Detects ?product=, #product-, /admin, /themes, /contact, etc.
  useEffect(() => {
    // Check if redirected from 404.html (GitHub Pages or static server SPA redirection)
    try {
      const redirectUrl = sessionStorage.getItem('redirect');
      if (redirectUrl) {
        sessionStorage.removeItem('redirect');
        const parsed = new URL(redirectUrl, window.location.origin);
        if (parsed.pathname !== '/' || parsed.hash || parsed.search) {
          window.history.replaceState(null, '', parsed.pathname + parsed.search + parsed.hash);
        }
      }
    } catch {
      // ignore parse error
    }

    const handleLocationRoute = () => {
      const rawPath = window.location.pathname || '';
      const path = rawPath.toLowerCase().replace(/\/+$/, '') || '/';
      const rawHash = window.location.hash || '';
      const hash = rawHash.toLowerCase();
      const rawSearch = window.location.search || '';
      const search = rawSearch.toLowerCase();

      // Handle product deep links (e.g. ?product=rt-101 or #product-rt-101 or #rt-101)
      let targetId: string | null = null;
      try {
        const urlParams = new URLSearchParams(rawSearch);
        targetId = urlParams.get('product') || urlParams.get('p') || urlParams.get('id');
      } catch {
        // ignore search parse error
      }

      if (!targetId && hash) {
        if (hash.startsWith('#product-')) {
          targetId = hash.replace('#product-', '');
        } else if (hash.startsWith('#p-')) {
          targetId = hash.replace('#p-', '');
        } else if (hash.length > 1) {
          const directHash = hash.replace('#', '');
          if (directHash !== 'admin' && directHash !== 'themes' && !directHash.startsWith('blog')) {
            const match = products.find((p) => p.id === directHash || p.sku?.toLowerCase() === directHash.toLowerCase());
            if (match) targetId = match.id;
          }
        }
      }

      if (targetId) {
        const cleanId = decodeURIComponent(targetId).trim();
        const found = products.find((p) => p.id === cleanId || p.sku?.toLowerCase() === cleanId.toLowerCase());
        if (found) {
          setSelectedProduct(found);
          setIsDetailOpen(true);
          setActiveArticle(null);
        }
      }

      // Handle pillar pages (#contact, #terms, #cookies, #privacy)
      if (path === '/contact' || hash === '#contact' || search.includes('page=contact')) {
        setPillarPage('contact');
      } else if (path === '/terms' || hash === '#terms' || search.includes('page=terms')) {
        setPillarPage('terms');
      } else if (path === '/cookies' || hash === '#cookies' || path === '/privacy' || hash === '#privacy' || search.includes('page=cookies')) {
        setPillarPage('cookies');
      }

      // Handle /themes or #themes
      if (path === '/themes' || hash === '#themes' || search.includes('themes=true')) {
        setIsThemeModalOpen(true);
      }

      // Handle /admin, /admin/, #admin, or ?admin route
      if (
        path === '/admin' || 
        path.startsWith('/admin/') || 
        hash === '#admin' || 
        hash.startsWith('#admin/') ||
        search.includes('admin=true') ||
        search.includes('page=admin')
      ) {
        if (isAdmin) {
          setIsAdminOpen(true);
          setIsLoginOpen(false);
        } else {
          setIsLoginOpen(true);
        }
      }
    };

    handleLocationRoute();
    window.addEventListener('popstate', handleLocationRoute);
    window.addEventListener('hashchange', handleLocationRoute);

    return () => {
      window.removeEventListener('popstate', handleLocationRoute);
      window.removeEventListener('hashchange', handleLocationRoute);
    };
  }, [isAdmin, products]);

  // Close Login handler with URL cleanup
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin') || window.location.hash.toLowerCase().startsWith('#admin')) {
      window.history.pushState(null, '', '/');
    }
  };

  // Close Admin Modal handler
  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    setEditingProduct(null);
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin') || window.location.hash.toLowerCase().startsWith('#admin')) {
      window.history.pushState(null, '', '/');
    }
  };

  // Admin Logout / Lock
  const handleLockAdmin = () => {
    setIsAdmin(false);
    setIsAdminOpen(false);
    setIsLoginOpen(false);
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin') || window.location.hash.toLowerCase().startsWith('#admin')) {
      window.history.pushState(null, '', '/');
    }
  };

  // Derived Categories & Brands from active products
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    set.add('All Products');
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    set.add('All Brands');
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search Query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q) || false;
          const matchSku = p.sku?.toLowerCase().includes(q) || false;
          const matchDesc = p.shortDescription.toLowerCase().includes(q);
          const matchSpecs = p.specifications?.some(
            (s) => s.key.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
          );
          if (!matchName && !matchCat && !matchBrand && !matchSku && !matchDesc && !matchSpecs) {
            return false;
          }
        }

        // Category Filter
        if (filters.category !== 'All Products' && p.category !== filters.category) {
          return false;
        }

        // Price Mode Filter (all, priced, on_request)
        if (filters.priceFilter === 'priced' && (!p.hasPrice || !p.price)) {
          return false;
        }
        if (filters.priceFilter === 'on_request' && p.hasPrice && p.price) {
          return false;
        }

        // Stock Filter
        if (filters.stockFilter === 'in_stock' && !p.inStock) {
          return false;
        }

        // Brand Filter
        if (filters.brandFilter !== 'All Brands' && p.brand !== filters.brandFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'featured') {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        }
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'price_low') {
          const priceA = a.hasPrice && a.price ? a.price : 99999999;
          const priceB = b.hasPrice && b.price ? b.price : 99999999;
          return priceA - priceB;
        }
        if (filters.sortBy === 'price_high') {
          const priceA = a.hasPrice && a.price ? a.price : 0;
          const priceB = b.hasPrice && b.price ? b.price : 0;
          return priceB - priceA;
        }
        if (filters.sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [products, filters]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, note?: string, selectedSize?: string) => {
    trackAddToCart(product, quantity);
    const sizeToUse = selectedSize || product.defaultSize || product.availableSizes?.[0] || '';
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && (item.selectedSize || '') === sizeToUse
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && (item.selectedSize || '') === sizeToUse
            ? { ...item, quantity: item.quantity + quantity, customNote: note || item.customNote }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize: sizeToUse, customNote: note }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number, selectedSize?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && (!selectedSize || item.selectedSize === selectedSize)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleUpdateItemSize = (productId: string, oldSize: string | undefined, newSize: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && (item.selectedSize || '') === (oldSize || '')) {
          return { ...item, selectedSize: newSize };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string, selectedSize?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && (!selectedSize || item.selectedSize === selectedSize))
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Product CRUD
  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      }
      return [updatedProduct, ...prev];
    });
    setEditingProduct(null);
  };

  const handleBatchUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (selectedProduct?.id === productId) {
      setIsDetailOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    if (newSettings.selectedTheme && newSettings.selectedTheme !== currentTheme) {
      setCurrentTheme(newSettings.selectedTheme as ThemeId);
    }
  };

  const handleResetCatalog = () => {
    const { products: defaultP, settings: defaultS } = resetToDefaultCatalog();
    setProducts(defaultP);
    setSettings(defaultS);
    setCart([]);
  };

  const handleExportCatalog = () => {
    exportCatalogJSON(products, settings);
  };

  const handleImportCatalog = (importedProducts: Product[], importedSettings?: StoreSettings) => {
    setProducts(importedProducts);
    if (importedSettings) {
      setSettings(importedSettings);
      if (importedSettings.selectedTheme && THEMES[importedSettings.selectedTheme as ThemeId]) {
        setCurrentTheme(importedSettings.selectedTheme as ThemeId);
      }
    }
  };

  const handleOpenAdminTrigger = () => {
    if (window.location.pathname.toLowerCase() !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
    if (isAdmin) {
      setIsAdminOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <div 
      data-theme={currentTheme}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLight
          ? 'bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white'
          : 'bg-[#0E1015] text-[#F1F3F7] selection:bg-[var(--color-accent)] selection:text-black'
      }`}
      style={{
        backgroundColor: themeConfig.previewBg,
      }}
    >
      
      {/* Top Admin Active Banner (Visible only when admin is logged in) */}
      {isAdmin && (
        <aside 
          aria-label="Admin Control Bar" 
          className="bg-[#10131A] border-b border-[#2A3140] px-4 py-2 text-xs font-mono sticky top-0 z-50 transition-colors shadow-md"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span 
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: themeConfig.previewAccent }}
              />
              <span className="text-white">
                <strong style={{ color: themeConfig.previewAccent }}>RAWAL ADMIN:</strong> Full control of Logo, 4 Themes, Analytics & Page Builder.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Visual Edit Mode Toggle Button */}
              <button
                onClick={() => setIsVisualEditMode(!isVisualEditMode)}
                className={`px-3 py-1 text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                  isVisualEditMode
                    ? 'bg-amber-400 text-black ring-2 ring-amber-300 shadow-md'
                    : 'bg-[#1E232F] hover:bg-[#283040] text-amber-300 border border-amber-500/40'
                }`}
                title="Toggle live text click-to-edit directly on the webpage (صفحہ پر کسی بھی ٹیکسٹ کو کلک کر کے ایڈٹ کریں)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isVisualEditMode ? '✏️ Front Click-to-Edit: ON' : '✏️ Front Click-to-Edit: OFF'}</span>
              </button>

              {/* Quick Text Editor Dialog Button */}
              <button
                onClick={() => setIsQuickEditModalOpen(true)}
                className="bg-amber-400/20 hover:bg-amber-400 hover:text-black text-amber-300 border border-amber-400/50 px-3 py-1 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                title="Open comprehensive text editor for all front page sections"
              >
                <span>📝 Edit Frontpage Texts</span>
              </button>

              {/* Open Visitor Analytics Shortcut */}
              <button
                onClick={() => {
                  setAdminInitialTab('analytics');
                  setIsAdminOpen(true);
                }}
                className="bg-[#1E232F] hover:bg-[#283040] text-sky-300 border border-sky-500/40 px-3 py-1 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                <span>Analytics</span>
              </button>

              {/* Ads & AdSense Shortcut */}
              <button
                onClick={() => handleOpenAdSlotEditor()}
                className="bg-[#1E232F] hover:bg-[#283040] text-amber-400 border border-amber-500/40 px-3 py-1 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                title="Manage Google AdSense & Advertising Banners"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>📢 Ads & AdSense</span>
              </button>

              {/* Custom JS Engine Shortcut */}
              <button
                onClick={() => handleOpenCustomJsEditor()}
                className="bg-[#1E232F] hover:bg-[#283040] text-emerald-400 border border-emerald-500/40 px-3 py-1 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                title="Manage Custom JavaScript & Tracking Tags"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>⚡ Custom JS</span>
              </button>

              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="bg-[#1E232F] hover:bg-[#F59E0B] hover:text-black text-white border border-[#3A4356] px-3 py-1 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Theme Studio</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setAdminInitialTab('add_edit');
                  setIsAdminOpen(true);
                }}
                className="font-bold px-3 py-1 text-xs uppercase tracking-wider transition-colors shadow-sm"
                style={{
                  backgroundColor: themeConfig.previewAccent,
                  color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                }}
              >
                + Add Product
              </button>

              <button
                onClick={() => {
                  setAdminInitialTab('page_editor');
                  setIsAdminOpen(true);
                }}
                className="bg-[#1E232F] hover:bg-[#283040] text-white border border-[#3A4356] px-3 py-1 text-xs uppercase tracking-wider transition-colors"
              >
                Admin Panel
              </button>

              <button
                onClick={handleLockAdmin}
                className="bg-[#2A0808] hover:bg-[#3D0A0A] text-rose-300 border border-rose-900/50 px-2.5 py-1 text-xs uppercase tracking-wider transition-colors"
              >
                Lock Admin
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Navbar with brand, search, WhatsApp shortcut, cart, pillar pages and Theme button */}
      <Navbar
        settings={settings}
        cart={cart}
        isAdmin={isAdmin}
        theme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={handleOpenAdminTrigger}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenPillarPage={(p) => setPillarPage(p)}
        onScrollToBlog={handleScrollToBlog}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onGoHome={() => {
          setActiveArticle(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenQrScanner={() => {
          if (products.length > 0) setQrProduct(products[0]);
        }}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => {
          if (activeArticle) setActiveArticle(null);
          setFilters((f) => ({ ...f, searchQuery: q }));
          if (q.length > 2) trackSearch(q);
        }}
        totalProductsCount={products.length}
      />

      {/* Main View: Dedicated Full Article Page OR Store Catalog */}
      {activeArticle ? (
        <ArticlePageView
          article={activeArticle}
          allArticles={blogPosts}
          products={products}
          settings={settings}
          adSettings={adSettings}
          theme={currentTheme}
          isAdmin={isAdmin}
          isVisualEditMode={isVisualEditMode}
          onBackToHome={() => {
            setActiveArticle(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectArticle={(art) => {
            setActiveArticle(art);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectCategory={(cat) => {
            setActiveArticle(null);
            setFilters((f) => ({ ...f, category: cat }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddToCart={(p, q, n, s) => {
            handleAddToCart(p, q, n, s);
            setIsCartOpen(true);
          }}
          onOpenQrModal={(p) => setQrProduct(p)}
          onOpenAdminBlog={(_postId) => {
            setAdminInitialTab('blog_cms');
            setIsAdminOpen(true);
          }}
          onOpenAdSettings={handleOpenAdSlotEditor}
        />
      ) : (
        <>
          {/* Ad Slot 1: Top Header Leaderboard Ad */}
          <AdBanner
            slot={adSettings.slots?.top_leaderboard}
            globalAdsEnabled={adSettings.globalAdsEnabled}
            theme={currentTheme}
            onEditSlot={handleOpenAdSlotEditor}
            isVisualEditMode={isVisualEditMode}
          />

      {/* Dynamic Section Ordering & Drag-and-Drop Structure */}
      {pageContent.sectionOrder.map((sectionId, index) => {
        const isHidden = pageContent.hiddenSections.includes(sectionId);
        if (isHidden && !isVisualEditMode) return null;

        return (
          <div key={sectionId} className="relative group/section">
            
            {/* Visual Edit Mode Overlay Toolbar */}
            {isVisualEditMode && (
              <div className="bg-amber-400/95 text-black px-4 py-1.5 text-xs font-mono flex items-center justify-between border-y border-amber-500 shadow-sm z-30 sticky top-10">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                  <span className="font-bold uppercase tracking-wider">
                    Section #{index + 1}: {
                      sectionId === 'hero' 
                        ? 'Hero Showcase' 
                        : sectionId === 'promo_banners' 
                          ? 'Clearance & Promo Banners' 
                          : sectionId === 'categories'
                            ? 'Category & Size Showcase'
                            : 'Catalog & Products Grid'
                    }
                  </span>
                  {isHidden && (
                    <span className="bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded text-[10px]">
                      HIDDEN FROM VISITORS
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-sans mr-2 hidden sm:inline text-black/80">
                    💡 Click any pencil ✏️ to edit headline/text
                  </span>

                  <button
                    type="button"
                    onClick={() => handleMoveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-1 bg-black/10 hover:bg-black/30 rounded disabled:opacity-30 transition-colors"
                    title="Move Section Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveSection(index, 'down')}
                    disabled={index === pageContent.sectionOrder.length - 1}
                    className="p-1 bg-black/10 hover:bg-black/30 rounded disabled:opacity-30 transition-colors"
                    title="Move Section Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHideSection(sectionId)}
                    className="p-1 bg-black/10 hover:bg-black/30 rounded transition-colors"
                    title={isHidden ? 'Show Section' : 'Hide Section'}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5 text-rose-800" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: Hero Showcase Banner */}
            {sectionId === 'hero' && (
              <HeroBanner
                settings={settings}
                theme={currentTheme}
                pageContent={pageContent}
                isEditMode={isVisualEditMode}
                onUpdateContent={handleUpdatePageContentField}
                onSelectCategory={(cat) => setFilters((f) => ({ ...f, category: cat }))}
                onOpenAdminAdd={() => {
                  setEditingProduct(null);
                  setIsAdminOpen(true);
                }}
                onOpenThemeModal={() => setIsThemeModalOpen(true)}
                isAdmin={isAdmin}
                totalProductsCount={products.length}
              />
            )}

            {/* Section 2: Promo & Clearance Banners (Bewakoof / Retail Modern Style) */}
            {sectionId === 'promo_banners' && (
              <>
                <RetailStoryBanners
                  settings={settings}
                  theme={currentTheme}
                  pageContent={pageContent}
                  isEditMode={isVisualEditMode}
                  onUpdateContent={handleUpdatePageContentField}
                  onSelectCategory={(cat) => {
                    setFilters((f) => ({ ...f, category: cat, searchQuery: '' }));
                    window.scrollTo({ top: 580, behavior: 'smooth' });
                  }}
                  onSearchFilter={(query) => {
                    setFilters((f) => ({ ...f, searchQuery: query }));
                    window.scrollTo({ top: 580, behavior: 'smooth' });
                  }}
                />

                {/* Ad Slot 2: Mid-Page Content Billboard */}
                <AdBanner
                  slot={adSettings.slots?.mid_content}
                  globalAdsEnabled={adSettings.globalAdsEnabled}
                  theme={currentTheme}
                  onEditSlot={handleOpenAdSlotEditor}
                  isVisualEditMode={isVisualEditMode}
                />
              </>
            )}

            {/* Section: Category & Size Selection Showcase */}
            {sectionId === 'categories' && (
              <CategoryShowcase
                products={products}
                settings={settings}
                theme={currentTheme}
                pageContent={pageContent}
                isEditMode={isVisualEditMode}
                onUpdateContent={handleUpdatePageContentField}
                onSelectCategory={(cat) => {
                  setFilters((f) => ({ ...f, category: cat, searchQuery: '' }));
                }}
                onAddToCart={(product, size) => {
                  handleAddToCart(product, 1, 'Quick Added from Category Showcase', size);
                  setIsCartOpen(true);
                }}
                onViewProduct={(product) => {
                  trackProductView(product);
                  setSelectedProduct(product);
                  setIsDetailOpen(true);
                }}
              />
            )}

            {/* Section 3: Interactive Catalog & Products Grid */}
            {sectionId === 'catalog' && (
              <>
                {/* Interactive Filter Bar */}
                <FilterBar
                  filters={filters}
                  theme={currentTheme}
                  onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
                  onResetFilters={() =>
                    setFilters({
                      searchQuery: '',
                      category: 'All Products',
                      priceFilter: 'all',
                      stockFilter: 'all',
                      brandFilter: 'All Brands',
                      sortBy: 'featured',
                    })
                  }
                  totalFilteredCount={filteredProducts.length}
                  totalProductsCount={products.length}
                  availableCategories={availableCategories}
                  availableBrands={availableBrands}
                />

                {/* Ad Slot 3: In-Feed Product Catalog Ad */}
                <AdBanner
                  slot={adSettings.slots?.in_feed_grid}
                  globalAdsEnabled={adSettings.globalAdsEnabled}
                  theme={currentTheme}
                  onEditSlot={handleOpenAdSlotEditor}
                  isVisualEditMode={isVisualEditMode}
                />

                {/* Main Content Area: Products Grid */}
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
                  
                  {/* Results Header */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b ${
                    isLight ? 'border-slate-200' : 'border-[#222733]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl sm:text-3xl font-serif-editorial italic ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {filters.category === 'All Products' ? (pageContent.catalogHeading || 'Industrial Equipment & Machinery') : filters.category}
                        </span>
                        <span 
                          className={`text-xs font-mono px-2.5 py-0.5 border font-bold ${
                            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#15181F] border-[#2B313F]'
                          }`}
                          style={{ color: themeConfig.previewAccent }}
                        >
                          {filteredProducts.length} SPECS
                        </span>
                      </div>
                      <p className={`text-xs mt-1 font-light ${isLight ? 'text-slate-500' : 'text-[#8E98A8]'}`}>
                        Direct quotation, wholesale pricing and instant nationwide dispatch via official WhatsApp.
                      </p>
                    </div>

                    {/* Quick WhatsApp Inquiry Action & Theme Trigger */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsThemeModalOpen(true)}
                        className={`inline-flex items-center gap-2 text-xs border px-3 py-2 font-mono uppercase tracking-wider transition-colors ${
                          isLight
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-[#15181F] hover:bg-[#1E232E] text-[#F1F3F7] border-[#2B313F]'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" style={{ color: themeConfig.previewAccent }} />
                        <span>Theme Studio</span>
                      </button>

                      <a
                        href={buildDirectContactWhatsAppUrl(settings, `Inquiry regarding category: ${filters.category}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackWhatsAppClick(`Catalog Inquiry: ${filters.category}`)}
                        className={`inline-flex items-center gap-2 text-xs border px-4 py-2 font-mono uppercase tracking-wider transition-colors ${
                          isLight
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-[#15181F] hover:bg-[#1E232E] text-[#F1F3F7] border-[#2B313F]'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" style={{ color: themeConfig.previewAccent }} />
                        <span>Need Custom Machinery / Parts?</span>
                      </a>
                    </div>
                  </div>

                  {/* Empty State */}
                  {filteredProducts.length === 0 ? (
                    <div className={`border p-12 text-center space-y-4 max-w-lg mx-auto my-8 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#15181F] border-[#262B35]'
                    }`}>
                      <div className={`w-16 h-16 border flex items-center justify-center mx-auto ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#1C212B] border-[#2B313F]'
                      }`}>
                        <Package className="w-8 h-8" style={{ color: themeConfig.previewAccent }} />
                      </div>
                      <h3 className={`text-2xl font-serif-editorial italic ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        No Matching Tools Found
                      </h3>
                      <p className={`text-xs font-light leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8E98A8]'}`}>
                        No products match your current search and filter criteria. You can reset filters or contact Rawal Tools on WhatsApp for specialized procurement.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono">
                        <button
                          onClick={() =>
                            setFilters({
                              searchQuery: '',
                              category: 'All Products',
                              priceFilter: 'all',
                              stockFilter: 'all',
                              brandFilter: 'All Brands',
                              sortBy: 'featured',
                            })
                          }
                          className={`text-xs uppercase tracking-wider px-5 py-2.5 border transition-colors ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              : 'bg-[#1C212B] hover:bg-[#252C3A] text-white border-[#2B313F]'
                          }`}
                        >
                          Reset Filters
                        </button>
                        <a
                          href={buildDirectContactWhatsAppUrl(settings, `Requesting quotation for tool: ${filters.searchQuery}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackWhatsAppClick(`No Results Inquiry: ${filters.searchQuery}`)}
                          className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 flex items-center gap-2 transition-colors shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          <span>Ask on WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* Products Grid - Responsive */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                      {filteredProducts.map((product, idx) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={idx}
                          settings={settings}
                          theme={currentTheme}
                          isInCart={cart.some((item) => item.product.id === product.id)}
                          isAdmin={isAdmin}
                          onViewDetails={(p) => {
                            trackProductView(p);
                            setSelectedProduct(p);
                            setIsDetailOpen(true);
                            if (typeof window !== 'undefined') {
                              window.history.replaceState(null, '', `${window.location.pathname}?product=${encodeURIComponent(p.id)}`);
                            }
                          }}
                          onAddToCart={(p, size) => handleAddToCart(p, 1, undefined, size)}
                          onOpenQrModal={(p) => setQrProduct(p)}
                          onEditProduct={(p) => {
                            setEditingProduct(p);
                            setIsAdminOpen(true);
                          }}
                          onDeleteProduct={handleDeleteProduct}
                        />
                      ))}
                    </div>
                  )}

                </main>
              </>
            )}

          </div>
        );
      })}

      {/* Industrial Knowledge & Buying Guides Blog Section (Controlled by Admin Settings & Page Editor) */}
      {settings.showArticlesOnFrontpage && (
        <div id="blog-articles-section">
          <BlogSection
            posts={blogPosts}
            products={products}
            settings={settings}
            theme={currentTheme}
            isAdmin={isAdmin}
            isVisualEditMode={isVisualEditMode}
            onSelectArticle={(art) => {
              setActiveArticle(art);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAdminBlog={(_editingPostId) => {
              setAdminInitialTab('blog_cms');
              setIsAdminOpen(true);
            }}
            onAddToCart={(p, q, n, s) => {
              handleAddToCart(p, q, n, s);
              setIsCartOpen(true);
            }}
          />
        </div>
      )}

      {/* Ad Slot 4: Bottom Footer Leaderboard Banner */}
      <AdBanner
        slot={adSettings.slots?.bottom_footer}
        globalAdsEnabled={adSettings.globalAdsEnabled}
        theme={currentTheme}
        onEditSlot={handleOpenAdSlotEditor}
        isVisualEditMode={isVisualEditMode}
      />
        </>
      )}

      {/* Footer with Pillar Links */}
      <Footer
        settings={settings}
        theme={currentTheme}
        onOpenAdmin={handleOpenAdminTrigger}
        isAdmin={isAdmin}
        pageContent={pageContent}
        isEditMode={isVisualEditMode}
        onUpdateContent={handleUpdatePageContentField}
        onOpenPillarPage={(p) => setPillarPage(p)}
        onScrollToBlog={handleScrollToBlog}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      {/* Frontpage Quick Text & Content Editor Modal */}
      <FrontpageQuickEditModal
        isOpen={isQuickEditModalOpen}
        onClose={() => setIsQuickEditModalOpen(false)}
        pageContent={pageContent}
        settings={settings}
        theme={currentTheme}
        onSaveContent={(newContent) => {
          setPageContent(newContent);
          saveStoredPageContent(newContent);
        }}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          saveStoredSettings(newSettings);
        }}
      />

      {/* Floating 24/7 WhatsApp Quick Assistant */}
      <WhatsAppFloat settings={settings} />

      {/* Meet Our Team & Staff Directory Modal */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        settings={settings}
        theme={currentTheme}
      />

      {/* Full Theme Selector & Studio Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={(t) => {
          handleSelectTheme(t);
        }}
      />

      {/* Product Details Modal */}
      <ProductDetailModal
        product={selectedProduct}
        settings={settings}
        theme={currentTheme}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProduct(null);
          if (typeof window !== 'undefined' && (window.location.search.includes('product=') || window.location.hash.startsWith('#product-'))) {
            const cleanUrl = window.location.pathname || '/';
            window.history.replaceState(null, '', cleanUrl);
          }
        }}
        onAddToCart={(p, qty, note, size) => {
          handleAddToCart(p, qty, note, size);
          setIsCartOpen(true);
        }}
        onOpenQrModal={(p) => setQrProduct(p)}
        isInCart={selectedProduct ? cart.some((i) => i.product.id === selectedProduct.id) : false}
        isAdmin={isAdmin}
        onEditProduct={(p) => {
          setEditingProduct(p);
          setIsAdminOpen(true);
        }}
      />

      {/* Instant Product QR Code Modal with Live WhatsApp & Specs */}
      <ProductQrModal
        product={qrProduct}
        allProducts={products}
        settings={settings}
        theme={currentTheme}
        isOpen={!!qrProduct}
        onClose={() => setQrProduct(null)}
        onSelectProduct={(p) => setQrProduct(p)}
        onViewProductDetails={(p) => {
          setQrProduct(null);
          setSelectedProduct(p);
          setIsDetailOpen(true);
        }}
        onAddToCart={(p, sz) => {
          handleAddToCart(p, 1, undefined, sz);
          setIsCartOpen(true);
        }}
      />

      {/* Pillar Informational Pages Modal (Contact, Terms, Cookies) */}
      <PillarPagesModal
        activePage={pillarPage}
        settings={settings}
        pageContent={pageContent}
        theme={currentTheme}
        isOpen={!!pillarPage}
        onClose={() => setPillarPage(null)}
        onSelectPage={(page) => setPillarPage(page)}
      />

      {/* Cookie Consent Notification & Preference Banner */}
      <CookieConsentBanner 
        consent={cookieConsent}
        onSaveConsent={(c) => setCookieConsent(c)}
        onOpenPillarPage={(p) => setPillarPage(p)}
        theme={currentTheme} 
      />

      {/* Cart / Multi-Item Quote Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={products}
        settings={settings}
        theme={currentTheme}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onUpdateItemSize={handleUpdateItemSize}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        products={products}
        settings={settings}
        pageContent={pageContent}
        onSavePageContent={handleSaveFullPageContent}
        adSettings={adSettings}
        onSaveAdSettings={(s) => setAdSettings(s)}
        customJsSettings={customJsSettings}
        onSaveCustomJs={(s) => setCustomJsSettings(s)}
        blogPosts={blogPosts}
        onSaveBlogPosts={(posts) => setBlogPosts(posts)}
        teamMembers={teamMembers}
        onSaveTeamMembers={(members) => setTeamMembers(members)}
        reviews={reviews}
        onSaveReviews={(revs) => setReviews(revs)}
        adminAccounts={adminAccounts}
        onSaveAdminAccounts={(accs) => setAdminAccounts(accs)}
        activeRole={activeAdminRole}
        onSwitchActiveRole={(role) => {
          setActiveAdminRole(role);
          setStoredActiveAdminRole(role);
        }}
        onPreviewTeamModal={() => setIsTeamModalOpen(true)}
        initialTab={adminInitialTab}
        isVisualEditMode={isVisualEditMode}
        onToggleVisualEditMode={() => setIsVisualEditMode(!isVisualEditMode)}
        onSaveProduct={handleSaveProduct}
        onBatchUpdateProducts={handleBatchUpdateProducts}
        onDeleteProduct={handleDeleteProduct}
        onSaveSettings={handleSaveSettings}
        onResetCatalog={handleResetCatalog}
        onExportCatalog={handleExportCatalog}
        onImportCatalog={handleImportCatalog}
        editingProduct={editingProduct}
        onCancelEdit={() => setEditingProduct(null)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onViewProductDetails={(p) => {
          setSelectedProduct(p);
          setIsDetailOpen(true);
        }}
      />

      {/* Admin Login Modal with Protected PIN/Password */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={handleCloseLogin}
        onSuccess={(role) => {
          setIsAdmin(true);
          if (role) {
            setActiveAdminRole(role);
            setStoredActiveAdminRole(role);
          }
          setIsLoginOpen(false);
          setIsAdminOpen(true);
        }}
        settings={settings}
      />

      {/* Full Theme & Palette Studio Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

    </div>
  );
}
