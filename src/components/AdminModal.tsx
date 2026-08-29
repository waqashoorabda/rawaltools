import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Save, 
  Check, 
  Settings, 
  Package, 
  Sliders, 
  Phone, 
  MessageCircle, 
  Key, 
  RotateCcw, 
  Download, 
  FileJson, 
  Eye, 
  EyeOff, 
  Sparkles,
  HelpCircle,
  Copy,
  ExternalLink,
  Edit3,
  Shield,
  Lock,
  ShieldCheck,
  AlertCircle,
  Palette,
  Sun,
  Flame,
  Zap,
  CheckCircle2,
  ShoppingBag,
  Cloud
} from 'lucide-react';
import { CATEGORIES, BRANDS } from '../data/defaultProducts';
import { Product, Specification, StoreSettings, PageContent } from '../types';
import { 
  compressImage, 
  compressMultipleImages, 
  compressAndReadFile, 
  formatBytes, 
  PRESET_TOOL_IMAGES 
} from '../utils/imageUpload';
import { cleanWhatsAppNumber } from '../utils/whatsapp';
import { ThemeId, THEMES } from '../utils/theme';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminPageEditorView } from './AdminPageEditorView';
import { AdminCustomJsView } from './AdminCustomJsView';
import { AdminAdsManagerView } from './AdminAdsManagerView';
import { BarChart3, Layout, Code2, Megaphone, BookOpen, Star } from 'lucide-react';
import { AdSettings, CustomJsSettings, BlogPost, TeamMember, ProductReview } from '../types';
import { AdminBlogManagerView } from './AdminBlogManagerView';
import { AdminTeamManagerView } from './AdminTeamManagerView';
import { AdminMediaManagerView } from './AdminMediaManagerView';
import { AdminAiCategorizerModal } from './AdminAiCategorizerModal';
import { AdminRoleRightsManagerView } from './AdminRoleRightsManagerView';
import { AdminReviewsManagerView } from './AdminReviewsManagerView';
import { AdminGoogleDriveBackupView } from './AdminGoogleDriveBackupView';
import { suggestProductCategory, isProductMissingCategory } from '../services/geminiCategoryService';
import { 
  CategorySuggestion, 
  AdminRole, 
  AdminPermission, 
  AdminAccount, 
  AdminAccountsConfig 
} from '../types';
import { registerMediaItem } from '../utils/mediaStorage';
import { 
  purgeCacheAndSyncLatest, 
  APP_BUILD_SYNC_VERSION, 
  setStoredAdminAuthenticated,
  loadStoredAdminAccounts,
  saveStoredAdminAccounts,
  getStoredActiveAdminRole,
  setStoredActiveAdminRole,
  hasAdminPermission,
  loadStoredReviews
} from '../utils/storage';
import { Users, Crown, ShieldAlert, CheckCircle } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: StoreSettings;
  pageContent?: PageContent;
  onSavePageContent?: (content: PageContent) => void;
  adSettings?: AdSettings;
  onSaveAdSettings?: (settings: AdSettings) => void;
  customJsSettings?: CustomJsSettings;
  onSaveCustomJs?: (settings: CustomJsSettings) => void;
  blogPosts?: BlogPost[];
  onSaveBlogPosts?: (posts: BlogPost[]) => void;
  teamMembers?: TeamMember[];
  onSaveTeamMembers?: (members: TeamMember[]) => void;
  reviews?: ProductReview[];
  onSaveReviews?: (reviews: ProductReview[]) => void;
  onPreviewTeamModal?: () => void;
  initialTab?: string;
  isVisualEditMode?: boolean;
  onToggleVisualEditMode?: () => void;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onResetCatalog: () => void;
  onExportCatalog: () => void;
  onImportCatalog: (importedProducts: Product[], importedSettings?: StoreSettings) => void;
  onBatchUpdateProducts?: (updatedProducts: Product[]) => void;
  editingProduct: Product | null;
  onCancelEdit: () => void;
  currentTheme?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
  onOpenThemeModal?: () => void;
  adminAccounts?: AdminAccountsConfig;
  onSaveAdminAccounts?: (updated: AdminAccountsConfig) => void;
  activeRole?: AdminRole;
  onSwitchActiveRole?: (role: AdminRole) => void;
  onOpenLoginModal?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  pageContent,
  onSavePageContent,
  adSettings,
  onSaveAdSettings,
  customJsSettings,
  onSaveCustomJs,
  blogPosts = [],
  onSaveBlogPosts,
  teamMembers = [],
  onSaveTeamMembers,
  reviews: initialReviewsProp,
  onSaveReviews: onSaveReviewsProp,
  onPreviewTeamModal,
  initialTab,
  isVisualEditMode = false,
  onToggleVisualEditMode,
  onSaveProduct,
  onDeleteProduct,
  onSaveSettings,
  onResetCatalog,
  onExportCatalog,
  onImportCatalog,
  onBatchUpdateProducts,
  editingProduct,
  onCancelEdit,
  currentTheme = 'industrial_yellow',
  onSelectTheme,
  onOpenThemeModal,
  adminAccounts: initialAdminAccountsProp,
  onSaveAdminAccounts: onSaveAdminAccountsProp,
  activeRole: activeRoleProp,
  onSwitchActiveRole: onSwitchActiveRoleProp,
  onOpenLoginModal,
}) => {
  if (!isOpen) return null;

  // Reviews State
  const [reviewsState, setReviewsState] = useState<ProductReview[]>(() => 
    initialReviewsProp || loadStoredReviews()
  );

  useEffect(() => {
    if (initialReviewsProp) setReviewsState(initialReviewsProp);
  }, [initialReviewsProp]);

  // RBAC State: Admin Accounts Configuration and Current Active Admin Role
  const [adminAccountsState, setAdminAccountsState] = useState<AdminAccountsConfig>(() => 
    initialAdminAccountsProp || loadStoredAdminAccounts()
  );
  const [activeRoleState, setActiveRoleState] = useState<AdminRole>(() => 
    activeRoleProp || getStoredActiveAdminRole()
  );

  useEffect(() => {
    if (initialAdminAccountsProp) setAdminAccountsState(initialAdminAccountsProp);
  }, [initialAdminAccountsProp]);

  useEffect(() => {
    if (activeRoleProp) setActiveRoleState(activeRoleProp);
  }, [activeRoleProp]);

  const currentAccount: AdminAccount = activeRoleState === 'super_admin'
    ? adminAccountsState.superAdmin
    : activeRoleState === 'sub_admin_1'
    ? adminAccountsState.subAdmin1
    : adminAccountsState.subAdmin2;

  const handleUpdateAdminAccounts = (updated: AdminAccountsConfig) => {
    setAdminAccountsState(updated);
    saveStoredAdminAccounts(updated);
    if (onSaveAdminAccountsProp) {
      onSaveAdminAccountsProp(updated);
    }
    // Synchronize Super Admin PIN with settings if modified
    if (updated.superAdmin.pin && updated.superAdmin.pin !== settings.adminPin) {
      onSaveSettings({ ...settings, adminPin: updated.superAdmin.pin });
    }
  };

  const handleSwitchRoleInternal = (role: AdminRole) => {
    setActiveRoleState(role);
    setStoredActiveAdminRole(role);
    if (onSwitchActiveRoleProp) {
      onSwitchActiveRoleProp(role);
    }
  };

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'page_editor' | 'ads_manager' | 'custom_js' | 'blog_cms' | 'team_manager' | 'media_library' | 'add_edit' | 'manage_products' | 'branding_theme' | 'store_settings' | 'security' | 'admin_roles' | 'reviews_manager' | 'google_drive_backup'
  >(
    editingProduct ? 'add_edit' : (initialTab as any) || 'analytics'
  );

  // Form State for Product
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Power Tools');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('Rawal Pro');
  const [sku, setSku] = useState('');

  // Gemini AI Category Suggestion States
  const [isAiCategorizerOpen, setIsAiCategorizerOpen] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [aiCategorySuggestion, setAiCategorySuggestion] = useState<CategorySuggestion | null>(null);
  const [aiCategoryError, setAiCategoryError] = useState<string | null>(null);
  const [quickClassifyingId, setQuickClassifyingId] = useState<string | null>(null);
  const [hasPrice, setHasPrice] = useState(true); // Toggle to skip price
  const [price, setPrice] = useState<string>('12500');
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [unit, setUnit] = useState('piece');
  const [availableSizes, setAvailableSizes] = useState<string[]>(['Standard']);
  const [sizeInput, setSizeInput] = useState('');
  const [defaultSize, setDefaultSize] = useState('Standard');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [specifications, setSpecifications] = useState<Specification[]>([
    { key: 'Input Power', value: '850 Watts' },
    { key: 'Voltage', value: '220V 50Hz' },
    { key: 'Warranty', value: 'Official Warranty' },
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);
  const [logoCompressionStatus, setLogoCompressionStatus] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form State for Store Settings & Branding
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState(settings.logoUrl || '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Security / Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Search in manage tab
  const [manageSearch, setManageSearch] = useState('');

  // Keep settingsForm in sync when settings prop updates
  useEffect(() => {
    setSettingsForm({ ...settings });
    setLogoUrlInput(settings.logoUrl || '');
  }, [settings]);

  // Load editing product when prop changes
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setCategory(editingProduct.category || 'Power Tools');
      setBrand(editingProduct.brand || 'Rawal Pro');
      setSku(editingProduct.sku || '');
      setHasPrice(editingProduct.hasPrice);
      setPrice(editingProduct.price ? editingProduct.price.toString() : '');
      setDiscountPrice(editingProduct.discountPrice ? editingProduct.discountPrice.toString() : '');
      setUnit(editingProduct.unit || 'piece');
      setAvailableSizes(
        editingProduct.availableSizes && editingProduct.availableSizes.length > 0
          ? [...editingProduct.availableSizes]
          : ['Standard']
      );
      setDefaultSize(editingProduct.defaultSize || 'Standard');
      setShortDescription(editingProduct.shortDescription || '');
      setFullDescription(editingProduct.fullDescription || '');
      setSpecifications(
        editingProduct.specifications && editingProduct.specifications.length > 0
          ? [...editingProduct.specifications]
          : [{ key: 'Quality', value: 'Heavy Duty' }]
      );
      setImages(editingProduct.images && editingProduct.images.length > 0 ? [...editingProduct.images] : []);
      setInStock(editingProduct.inStock);
      setIsFeatured(!!editingProduct.isFeatured);
      setIsNew(!!editingProduct.isNew);
      setActiveTab('add_edit');
    }
  }, [editingProduct]);

  // Reset Add Product form to blank
  const resetForm = () => {
    setName('');
    setCategory('Power Tools');
    setCustomCategory('');
    setBrand('Rawal Pro');
    setSku(`RT-${Math.floor(1000 + Math.random() * 9000)}`);
    setHasPrice(true);
    setPrice('');
    setDiscountPrice('');
    setUnit('piece');
    setAvailableSizes(['Standard']);
    setSizeInput('');
    setDefaultSize('Standard');
    setShortDescription('');
    setFullDescription('');
    setSpecifications([
      { key: 'Voltage', value: '220V' },
      { key: 'Warranty', value: '6 Months' },
    ]);
    setImages([]);
    setInStock(true);
    setIsFeatured(false);
    setIsNew(true);
    setSaveSuccess(false);
    setAiCategorySuggestion(null);
    setAiCategoryError(null);
    onCancelEdit();
  };

  // AI Category Suggestion handler for single product
  const handleAiSuggestCategory = async () => {
    if (!name.trim() && !shortDescription.trim() && !fullDescription.trim()) {
      setAiCategoryError('Please enter a product title or description first.');
      setTimeout(() => setAiCategoryError(null), 4000);
      return;
    }

    setIsSuggestingCategory(true);
    setAiCategoryError(null);

    try {
      const suggestion = await suggestProductCategory({
        title: name,
        shortDescription,
        fullDescription,
        availableCategories: CATEGORIES,
      });

      setAiCategorySuggestion(suggestion);

      if (CATEGORIES.includes(suggestion.suggestedCategory)) {
        setCategory(suggestion.suggestedCategory);
      } else {
        setCategory('CUSTOM');
        setCustomCategory(suggestion.suggestedCategory);
      }
    } catch (err: any) {
      setAiCategoryError(err.message || 'Failed to analyze category with Gemini.');
      setTimeout(() => setAiCategoryError(null), 5000);
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  // Quick 1-click classify for table row
  const handleQuickClassifyItem = async (p: Product) => {
    setQuickClassifyingId(p.id);
    try {
      const suggestion = await suggestProductCategory({
        title: p.name,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        availableCategories: CATEGORIES,
      });
      onSaveProduct({
        ...p,
        category: suggestion.suggestedCategory,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert(err.message || 'Failed to categorize product with Gemini.');
    } finally {
      setQuickClassifyingId(null);
    }
  };

  // Image Upload handler for product with automatic compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadError('');
    setCompressionStatus(null);

    try {
      const results = await compressMultipleImages(fileList, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.80,
      });

      const newUrls = results.map((r) => r.dataUrl);
      setImages((prev) => [...prev, ...newUrls]);

      // Calculate total original and compressed savings
      const totalOrig = results.reduce((acc, r) => acc + r.originalSize, 0);
      const totalComp = results.reduce((acc, r) => acc + r.compressedSize, 0);
      const totalSavedPct = totalOrig > 0 ? Math.round(((totalOrig - totalComp) / totalOrig) * 100) : 0;

      if (results.length === 1) {
        setCompressionStatus(`⚡ Auto-Compressed: ${results[0].reductionLabel} for instant page load!`);
      } else {
        setCompressionStatus(`⚡ Auto-Compressed ${results.length} images: ${formatBytes(totalOrig)} ➔ ${formatBytes(totalComp)} (${totalSavedPct}% reduction)!`);
      }

      setTimeout(() => setCompressionStatus(null), 7000);
    } catch (err: any) {
      setUploadError(err.message || 'Error compressing and processing image file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Logo file upload handler with automatic compression
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLogoUploading(true);
    setLogoCompressionStatus(null);
    try {
      const file = files[0];
      const result = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.90,
        mimeType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      });

      const base64Url = result.dataUrl;
      setLogoUrlInput(base64Url);
      const updated = {
        ...settings,
        logoUrl: base64Url,
      };
      onSaveSettings(updated);
      setSettingsForm(updated);
      setBrandingSaved(true);
      setLogoCompressionStatus(`⚡ Logo optimized: ${result.reductionLabel}`);
      setTimeout(() => {
        setBrandingSaved(false);
        setLogoCompressionStatus(null);
      }, 5000);
    } catch (err: any) {
      alert(err.message || 'Error uploading logo image.');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  // Save Logo manual URL
  const handleSaveLogoUrl = () => {
    const updated = {
      ...settings,
      logoUrl: logoUrlInput.trim() || undefined,
    };
    onSaveSettings(updated);
    setSettingsForm(updated);
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 3000);
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    setLogoUrlInput('');
    const updated = {
      ...settings,
      logoUrl: undefined,
    };
    onSaveSettings(updated);
    setSettingsForm(updated);
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 3000);
  };

  // Add Image URL for product
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  // Remove Image from product
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Spec management
  const handleAddSpec = () => {
    setSpecifications((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'key' | 'value', val: string) => {
    setSpecifications((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: val } : spec))
    );
  };

  const handleRemoveSpec = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Product Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const actualCategory = category === 'CUSTOM' ? customCategory.trim() || 'General Machinery' : category;

    const parsedPrice = hasPrice && price ? parseFloat(price) : null;
    const parsedDiscountPrice = hasPrice && discountPrice ? parseFloat(discountPrice) : null;

    const finalProduct: Product = {
      id: editingProduct ? editingProduct.id : `rt-${Date.now()}`,
      name: name.trim(),
      category: actualCategory,
      brand: brand.trim() || 'Rawal Pro',
      sku: sku.trim() || `RT-${Math.floor(1000 + Math.random() * 9000)}`,
      hasPrice,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      unit: unit.trim() || 'piece',
      availableSizes: availableSizes.length > 0 ? availableSizes : ['Standard'],
      defaultSize: defaultSize || availableSizes[0] || 'Standard',
      shortDescription: shortDescription.trim() || name.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim(),
      specifications: specifications.filter((s) => s.key.trim() && s.value.trim()),
      images: images.length > 0 ? images : [PRESET_TOOL_IMAGES[0].url],
      inStock,
      isFeatured,
      isNew,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(finalProduct);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      resetForm();
      setActiveTab('manage_products');
    }, 900);
  };

  // Submit Store Settings Save
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Change Admin Password / PIN
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (currentPassword.trim() !== settings.adminPin) {
      setPasswordError('Current Password / Old PIN is incorrect.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    const updated = {
      ...settings,
      ...settingsForm,
      adminPin: newPassword.trim(),
    };

    onSaveSettings(updated);
    setSettingsForm(updated);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  // Import JSON File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportCatalog(parsed);
          alert(`Successfully imported ${parsed.length} products!`);
        } else if (parsed.products && Array.isArray(parsed.products)) {
          onImportCatalog(parsed.products, parsed.settings);
          alert(`Successfully imported ${parsed.products.length} products and store settings!`);
        } else {
          alert('Invalid catalog JSON format.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredManageProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(manageSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(manageSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(manageSearch.toLowerCase()))
  );

  const themeList = Object.values(THEMES);
  const activeThemeConfig = THEMES[currentTheme] || THEMES.industrial_yellow;

  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'ecom_light':
        return <ShoppingBag className="w-4 h-4 text-[#FACC15]" />;
      case 'industrial_yellow':
        return <Zap className="w-4 h-4 text-[#F59E0B]" />;
      case 'modern_light':
        return <Sun className="w-4 h-4 text-[#2563EB]" />;
      case 'power_red':
        return <Flame className="w-4 h-4 text-[#EF4444]" />;
      case 'titanium_bronze':
        return <Sparkles className="w-4 h-4 text-[#D97706]" />;
      default:
        return <Palette className="w-4 h-4 text-[#F59E0B]" />;
    }
  };

  const navItems: Array<{
    id: 'analytics' | 'page_editor' | 'blog_cms' | 'manage_products' | 'reviews_manager' | 'media_library' | 'add_edit' | 'ads_manager' | 'custom_js' | 'branding_theme' | 'team_manager' | 'admin_roles' | 'store_settings' | 'security' | 'google_drive_backup';
    label: string;
    urdu: string;
    icon: React.ReactNode;
    badge?: string | number;
    group: 'OVERVIEW' | 'INVENTORY' | 'MARKETING' | 'SETTINGS' | 'SECURITY & ACCESS';
    permission: AdminPermission;
  }> = [
    {
      id: 'analytics',
      label: 'Visitor Analytics',
      urdu: 'وزیٹر رپورٹس',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      group: 'OVERVIEW',
      permission: 'analytics',
    },
    {
      id: 'page_editor',
      label: 'Page Customizer',
      urdu: 'صفحہ و سیکشن',
      icon: <Layout className="w-4 h-4 shrink-0" />,
      group: 'OVERVIEW',
      permission: 'page_editor',
    },
    {
      id: 'blog_cms',
      label: 'Articles & Blog CMS',
      urdu: 'بلاگ و آرٹیکلز ایڈیٹر',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      badge: blogPosts.length > 0 ? blogPosts.length : undefined,
      group: 'OVERVIEW',
      permission: 'blog_cms',
    },
    {
      id: 'manage_products',
      label: 'Catalog & Inventory',
      urdu: 'پراڈکٹس لسٹ',
      icon: <Package className="w-4 h-4 shrink-0" />,
      badge: products.length,
      group: 'INVENTORY',
      permission: 'manage_products',
    },
    {
      id: 'reviews_manager',
      label: 'Reviews & Ratings',
      urdu: 'کسٹمر ریویوز و ریٹنگ',
      icon: <Star className="w-4 h-4 text-amber-400 shrink-0" />,
      badge: reviewsState.filter((r) => r.status === 'pending').length > 0
        ? `${reviewsState.filter((r) => r.status === 'pending').length} new`
        : reviewsState.length > 0 ? reviewsState.length : undefined,
      group: 'INVENTORY',
      permission: 'reviews_manager',
    },
    {
      id: 'media_library',
      label: 'Media Library & Files',
      urdu: 'میڈیا لائبریری و فائلز',
      icon: <ImageIcon className="w-4 h-4 shrink-0" />,
      group: 'INVENTORY',
      permission: 'media_library',
    },
    {
      id: 'add_edit',
      label: editingProduct ? 'Edit Product' : '+ Add New Product',
      urdu: 'پراڈکٹ شامل کریں',
      icon: <Plus className="w-4 h-4 shrink-0" />,
      badge: editingProduct ? 'Editing' : undefined,
      group: 'INVENTORY',
      permission: 'add_edit_products',
    },
    {
      id: 'ads_manager',
      label: 'Ads & AdSense',
      urdu: 'اشتہارات و ایڈسینس',
      icon: <Megaphone className="w-4 h-4 shrink-0" />,
      group: 'MARKETING',
      permission: 'ads_manager',
    },
    {
      id: 'custom_js',
      label: 'Custom JavaScript',
      urdu: 'جاوا اسکرپٹ کوڈ',
      icon: <Code2 className="w-4 h-4 shrink-0" />,
      group: 'MARKETING',
      permission: 'custom_js',
    },
    {
      id: 'branding_theme',
      label: 'Logo & Themes',
      urdu: 'لوگو اور تھیمز',
      icon: <Palette className="w-4 h-4 shrink-0" />,
      group: 'SETTINGS',
      permission: 'branding_theme',
    },
    {
      id: 'team_manager',
      label: 'Our Team & Staff',
      urdu: 'ہماری ٹیم و عملہ',
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: teamMembers.length > 0 ? teamMembers.length : undefined,
      group: 'SETTINGS',
      permission: 'team_manager',
    },
    {
      id: 'admin_roles',
      label: 'Manage Sub-Admins',
      urdu: 'سب ایڈمنز و اختیارات',
      icon: <Crown className="w-4 h-4 text-amber-400 shrink-0" />,
      badge: 'Super Admin',
      group: 'SECURITY & ACCESS',
      permission: 'manage_admins',
    },
    {
      id: 'google_drive_backup',
      label: 'Google Drive & Backup',
      urdu: 'گوگل ڈرائیو و آٹومیٹک بیک اپ',
      icon: <Cloud className="w-4 h-4 text-sky-400 shrink-0" />,
      badge: 'Auto-Sync',
      group: 'SETTINGS',
      permission: 'export_import_reset',
    },
    {
      id: 'store_settings',
      label: 'WhatsApp & Store Info',
      urdu: 'نمبر اور معلومات',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      group: 'SETTINGS',
      permission: 'store_settings',
    },
    {
      id: 'security',
      label: 'Admin Password & PIN',
      urdu: 'پاسورڈ سیٹنگ',
      icon: <Shield className="w-4 h-4 shrink-0" />,
      group: 'SECURITY & ACCESS',
      permission: 'store_settings',
    },
  ];

  // RBAC Filtering: Show only authorized tabs to Sub-Admins
  const visibleNavItems = navItems.filter((item) => {
    if (activeRoleState === 'super_admin') return true;
    return hasAdminPermission(currentAccount, item.permission);
  });

  // Auto-switch to first available tab if activeTab is not permitted
  useEffect(() => {
    const isCurrentTabAllowed = visibleNavItems.some((item) => item.id === activeTab);
    if (!isCurrentTabAllowed && visibleNavItems.length > 0) {
      setActiveTab(visibleNavItems[0].id);
    }
  }, [activeRoleState, adminAccountsState]);

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const isCurrentTabAuthorized = activeRoleState === 'super_admin' || hasAdminPermission(currentAccount, activeItem.permission);

  return (
    <div className="admin-modal-root fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans overflow-hidden">
      <div
        id="admin-management-modal"
        className="admin-modal-container relative bg-[#0E1118] border border-[#2B3448] rounded-xl w-full max-w-7xl h-[92vh] max-h-[92vh] min-h-[500px] shadow-2xl text-[#F5F5F5] flex flex-col my-auto overflow-hidden"
      >
        {/* Fixed Modal Header */}
        <div className="shrink-0 bg-[#121620] px-4 sm:px-6 py-3 border-b border-[#222A3A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                  Rawal Tools Admin Management Panel
                </h3>
                
                {/* Active Admin Role Indicator Badge */}
                {activeRoleState === 'super_admin' ? (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/50 rounded-full text-[10px] font-bold font-mono shadow-sm">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>👑 SUPER ADMIN</span>
                  </div>
                ) : activeRoleState === 'sub_admin_1' ? (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/50 rounded-full text-[10px] font-bold font-mono shadow-sm">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>🛡️ SUB ADMIN 1 ({currentAccount.name})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/50 rounded-full text-[10px] font-bold font-mono shadow-sm">
                    <Shield className="w-3 h-3 text-purple-400" />
                    <span>🛡️ SUB ADMIN 2 ({currentAccount.name})</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400 line-clamp-1">
                Centralized CMS, Inventory ({products.length} Items), AdSense & WhatsApp Order Routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Super Admin Fast Role Switcher (Simulate / Test Views) */}
            {activeRoleState === 'super_admin' ? (
              <div className="hidden lg:flex items-center gap-1 bg-[#151C2C] border border-[#26354D] rounded-lg p-1 text-[11px] font-mono">
                <span className="text-slate-400 px-1 text-[10px]">Test View:</span>
                <button
                  type="button"
                  onClick={() => handleSwitchRoleInternal('super_admin')}
                  className="px-2 py-1 rounded bg-amber-400 text-black font-bold cursor-pointer"
                  title="Full Super Admin View"
                >
                  Super
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRoleInternal('sub_admin_1')}
                  className="px-2 py-1 rounded hover:bg-[#1E293B] text-slate-300 hover:text-white cursor-pointer"
                  title="Test Sub Admin 1 permissions view"
                >
                  Sub 1
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRoleInternal('sub_admin_2')}
                  className="px-2 py-1 rounded hover:bg-[#1E293B] text-slate-300 hover:text-white cursor-pointer"
                  title="Test Sub Admin 2 permissions view"
                >
                  Sub 2
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSwitchRoleInternal('super_admin')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/40 cursor-pointer"
                title="Return to Super Admin mode"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Return to Super Admin</span>
              </button>
            )}

            {/* Quick Articles Front Page Visibility Toggle in Header */}
            {hasAdminPermission(currentAccount, 'store_settings') && (
              <button
                type="button"
                onClick={() => {
                  const updated = !settings.showArticlesOnFrontpage;
                  onSaveSettings({ ...settings, showArticlesOnFrontpage: updated });
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  settings.showArticlesOnFrontpage
                    ? 'bg-[#2D1414] hover:bg-[#401C1C] text-rose-300 border-rose-500/50'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                }`}
                title="Toggle whether articles & technical guides are displayed on the front page"
              >
                {settings.showArticlesOnFrontpage ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Articles: Shown</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Articles: Hidden</span>
                  </>
                )}
              </button>
            )}

            {/* Instant Cache Purge & Hard Sync button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all local cache and reload fresh data from code defaults?')) {
                  purgeCacheAndSyncLatest();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#1C2538] hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-colors shadow-sm"
              title="Purges stale browser cache and force-syncs with latest published codebase"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">⚡ Hard Sync</span>
              <span className="sm:hidden">Sync</span>
            </button>

            {onToggleVisualEditMode && hasAdminPermission(currentAccount, 'page_editor') && (
              <button
                onClick={onToggleVisualEditMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isVisualEditMode
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                    : 'bg-[#182030] text-slate-300 border-[#2A344A] hover:text-white'
                }`}
                title="Click elements on store page to edit directly"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visual Edit:</span> {isVisualEditMode ? 'ON' : 'OFF'}
              </button>
            )}

            <button
              id="admin-logout-btn"
              onClick={() => {
                setStoredAdminAuthenticated(false);
                onClose();
              }}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 bg-[#1B2232] hover:bg-[#252F44] border border-[#2E3A52] rounded-lg transition-colors cursor-pointer"
              title="Sign Out / Close Admin Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Sidebar on Left, Content on Right */}
        <div className="admin-modal-split-body flex-1 flex flex-col md:flex-row min-h-0 h-full w-full overflow-hidden">
          
          {/* =========================================================================
              NAVIGATION SIDEBAR (Desktop Fixed Vertical / Mobile Horizontal Scroll)
              ========================================================================= */}
          <aside className="admin-modal-sidebar w-full md:w-64 lg:w-72 md:min-w-[16rem] md:max-w-[18rem] shrink-0 bg-[#0A0D14] border-b md:border-b-0 md:border-r border-[#1E2536] flex flex-col md:h-full overflow-hidden">
            
            {/* Desktop Navigation Header */}
            <div className="hidden md:flex items-center justify-between px-4 py-2.5 bg-[#0C1018] border-b border-[#1A2234] text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span>ADMIN MENU ({visibleNavItems.length} Tabs)</span>
              <span className="text-amber-400 font-bold">{activeRoleState === 'super_admin' ? 'ALL ACCESS' : 'RBAC'}</span>
            </div>

            {/* Desktop Scrollable Vertical Menu List */}
            <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-3 space-y-4 custom-scrollbar">
              
              {/* Role Profile Box in Sidebar */}
              <div className="p-3 rounded-lg bg-[#141926] border border-[#232D42] space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeRoleState === 'super_admin' ? (
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white truncate">
                      {currentAccount.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    activeRoleState === 'super_admin'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {activeRoleState === 'super_admin' ? 'FULL' : `${currentAccount.permissions.length} RIGHTS`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {activeRoleState === 'super_admin'
                    ? 'Super Admin has complete authority to modify catalog, settings, and assign sub-admin rights.'
                    : `Active permissions managed and granted by Super Admin.`}
                </div>
              </div>

              {(['OVERVIEW', 'INVENTORY', 'MARKETING', 'SETTINGS', 'SECURITY & ACCESS'] as const).map((groupName) => {
                const groupItems = visibleNavItems.filter((item) => item.group === groupName);
                if (groupItems.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-1">
                    <div className="px-2 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      {groupName === 'OVERVIEW' && 'Overview & Content'}
                      {groupName === 'INVENTORY' && 'Catalog & Products'}
                      {groupName === 'MARKETING' && 'Ads & Tracking'}
                      {groupName === 'SETTINGS' && 'Store Configuration'}
                      {groupName === 'SECURITY & ACCESS' && 'Security & Roles'}
                    </div>

                    <div className="space-y-1">
                      {groupItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-2.5 border cursor-pointer ${
                              isActive
                                ? 'bg-amber-400 text-black font-extrabold border-amber-300 shadow-md translate-x-0.5'
                                : 'bg-[#121622]/60 hover:bg-[#1A2232] text-slate-300 border-transparent hover:border-[#263148] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={isActive ? 'text-black' : 'text-amber-400'}>
                                {item.icon}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold leading-tight truncate">
                                  {item.label}
                                </span>
                                <span className={`text-[9px] font-mono leading-none truncate ${
                                  isActive ? 'text-black/80 font-bold' : 'text-slate-500'
                                }`}>
                                  {item.urdu}
                                </span>
                              </div>
                            </div>

                            {item.badge !== undefined && (
                              <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded shrink-0 ${
                                isActive 
                                  ? 'bg-black text-amber-400' 
                                  : 'bg-[#1C2436] text-slate-300 border border-[#2B364E]'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Horizontal Pill Bar */}
            <div className="flex md:hidden overflow-x-auto scrollbar-thin p-2 gap-1.5 shrink-0 bg-[#080B10]">
              {visibleNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                        : 'bg-[#121622] text-slate-300 border-[#222A3A] hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-black' : 'text-amber-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-black/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Sidebar Footer Status */}
            <div className="hidden md:flex items-center justify-between p-3 bg-[#080B10] border-t border-[#1A2234] text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeRoleState === 'super_admin' ? 'Super Admin Mode' : `${currentAccount.name}`}
              </span>
              <span className="text-slate-500">
                Theme: {activeThemeConfig.name.split(' ')[0]}
              </span>
            </div>

          </aside>

          {/* =========================================================================
              MAIN CONTENT PANEL (Fixed Height, Internal Smooth Scroll)
              ========================================================================= */}
          <main className="admin-modal-main flex-1 flex flex-col h-full min-w-0 bg-[#07090E] overflow-hidden">
            
            {/* Content Header Bar */}
            <div className="shrink-0 px-4 sm:px-6 py-3 bg-[#0C1018] border-b border-[#1A2234] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">{activeItem.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                      {activeItem.label}
                    </h4>
                    <span className="text-xs font-mono text-amber-400 font-bold hidden sm:inline">
                      ({activeItem.urdu})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Section: {activeItem.group} • Role: {currentAccount.name}
                  </p>
                </div>
              </div>

              {/* Contextual Action Shortcuts */}
              <div className="flex items-center gap-2 text-xs font-mono">
                {activeRoleState === 'super_admin' && activeTab !== 'admin_roles' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('admin_roles')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 cursor-pointer"
                    title="Manage Sub-Admin permissions"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Manage Sub-Admins</span>
                    <span className="sm:hidden">Roles</span>
                  </button>
                )}

                {activeTab === 'manage_products' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('add_edit')}
                    className="px-3 py-1.5 bg-amber-400 text-black font-bold flex items-center gap-1 rounded hover:bg-amber-300 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Product</span>
                  </button>
                )}

                {activeTab === 'branding_theme' && onOpenThemeModal && (
                  <button
                    type="button"
                    onClick={onOpenThemeModal}
                    className="px-3 py-1.5 bg-amber-400 text-black font-bold flex items-center gap-1 rounded hover:bg-amber-300 cursor-pointer shadow-sm"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Open Theme Studio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Main Body Content */}
            <div className="admin-modal-scrollable-content flex-1 overflow-y-auto bg-[#07090E] p-4 sm:p-6 lg:p-7 custom-scrollbar min-h-0">

          {/* Tab: Visitor Analytics */}
          {activeTab === 'analytics' && (
            <div>
              <AdminAnalyticsView products={products} settings={settings} />
            </div>
          )}

          {/* Tab: Page Content & Section Layout Editor */}
          {activeTab === 'page_editor' && pageContent && (
            <div>
              <AdminPageEditorView
                pageContent={pageContent}
                onSaveContent={(content) => {
                  if (onSavePageContent) onSavePageContent(content);
                }}
                isVisualEditMode={isVisualEditMode}
                onToggleVisualEditMode={onToggleVisualEditMode || (() => {})}
                settings={settings}
                onSaveSettings={onSaveSettings}
              />
            </div>
          )}

          {/* Tab: Google AdSense & Advertisement Banners Manager */}
          {activeTab === 'ads_manager' && adSettings && onSaveAdSettings && (
            <div>
              <AdminAdsManagerView
                adSettings={adSettings}
                onSaveAdSettings={onSaveAdSettings}
              />
            </div>
          )}

          {/* Tab: Custom JavaScript Engine */}
          {activeTab === 'custom_js' && customJsSettings && onSaveCustomJs && (
            <div>
              <AdminCustomJsView
                customJsSettings={customJsSettings}
                onSaveCustomJs={onSaveCustomJs}
              />
            </div>
          )}

          {/* Tab: Blog & Articles CMS */}
          {activeTab === 'blog_cms' && (
            <div>
              <AdminBlogManagerView
                posts={blogPosts}
                products={products}
                settings={settings}
                onSavePosts={(updatedPosts) => {
                  if (onSaveBlogPosts) onSaveBlogPosts(updatedPosts);
                }}
                onSaveSettings={onSaveSettings}
              />
            </div>
          )}

          {/* Tab: Team & Staff Management */}
          {activeTab === 'team_manager' && (
            <div>
              <AdminTeamManagerView
                teamMembers={teamMembers}
                onUpdateTeamMembers={(updatedMembers) => {
                  if (onSaveTeamMembers) onSaveTeamMembers(updatedMembers);
                }}
                settings={settings}
                onPreviewTeamModal={onPreviewTeamModal}
              />
            </div>
          )}

          {/* Tab: Centralized Media Library & Asset Manager */}
          {activeTab === 'media_library' && (
            <div>
              <AdminMediaManagerView
                products={products}
                settings={settings}
                blogPosts={blogPosts}
                teamMembers={teamMembers}
              />
            </div>
          )}

          {/* Tab: Reviews & Ratings Moderation Manager */}
          {activeTab === 'reviews_manager' && (
            <div className="w-full">
              <AdminReviewsManagerView
                products={products}
                settings={settings}
                reviews={reviewsState}
                onUpdateReviews={(updatedReviews) => {
                  setReviewsState(updatedReviews);
                  if (onSaveReviewsProp) {
                    onSaveReviewsProp(updatedReviews);
                  }
                }}
                onReviewsUpdated={(updatedReviews) => {
                  setReviewsState(updatedReviews);
                  if (onSaveReviewsProp) {
                    onSaveReviewsProp(updatedReviews);
                  }
                }}
              />
            </div>
          )}

        {/* Tab 1: Add or Edit Product */}
        {activeTab === 'add_edit' && (
          <form onSubmit={handleSaveProduct} className="space-y-6">
            {/* Header banner if editing */}
            {editingProduct && (
              <div className="bg-[#18120B] border border-[#FF5F1F]/40 p-3.5 flex items-center justify-between text-xs text-[#FF8540] font-mono">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#FF5F1F]" />
                  <span>
                    Editing: <strong className="text-white">{editingProduct.name}</strong> (REF: {editingProduct.sku || editingProduct.id})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-[#242424] hover:bg-[#333] text-white px-3 py-1 text-xs uppercase"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] flex items-center gap-1.5 border-b border-[#222] pb-1">
                <span>1. Product Basics & Identification</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Heavy Duty Rotary Hammer Drill 26mm (850W)"
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none font-sans"
                  />
                </div>

                {/* SKU / Code */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-1">
                    SKU / Reference Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. RT-HD-2601"
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection with AI Assistant */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888]">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={handleAiSuggestCategory}
                      disabled={isSuggestingCategory}
                      className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      title="Analyze Title & Description with Gemini to auto-select best category"
                    >
                      {isSuggestingCategory ? (
                        <>
                          <RotateCcw className="w-3 h-3 animate-spin text-amber-400" />
                          <span>Gemini Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>✨ AI Auto-Suggest (Gemini)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] px-3.5 py-2.5 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none cursor-pointer font-mono"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Products').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Other Custom Category</option>
                  </select>

                  {category === 'CUSTOM' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Type custom category name..."
                      className="mt-2 w-full bg-[#141414] text-sm text-[#F5F5F5] px-3.5 py-2 rounded-none border border-[#FF5F1F] outline-none font-mono"
                    />
                  )}

                  {/* AI Suggestion Insight Card */}
                  {aiCategorySuggestion && (
                    <div className="mt-2 p-2.5 bg-[#141C28] border border-amber-400/40 rounded text-xs font-mono text-slate-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-amber-300">
                            Gemini Suggested: {aiCategorySuggestion.suggestedCategory}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            {Math.round(aiCategorySuggestion.confidence * 100)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          {aiCategorySuggestion.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {aiCategoryError && (
                    <p className="mt-1.5 text-xs text-rose-400 font-mono flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{aiCategoryError}</span>
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Rawal Pro, Bosch, Makita, DeWalt"
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Price & Quotation Settings */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] flex items-center gap-1.5">
                  <span>2. Price & Quote Mode (قیمت کی ترتیبات)</span>
                </h4>

                <label className="flex items-center gap-2 cursor-pointer bg-[#141414] px-3 py-1.5 rounded-none border border-[#333] hover:border-[#FF5F1F]">
                  <input
                    type="checkbox"
                    checked={!hasPrice}
                    onChange={(e) => setHasPrice(!e.target.checked)}
                    className="w-4 h-4 accent-[#FF5F1F] bg-black"
                  />
                  <span className="text-xs font-mono text-[#DDD]">
                    Skip Price (Show "Price on Request / Contact" instead)
                  </span>
                </label>
              </div>

              {hasPrice ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#141414] p-4 rounded-none border border-[#262626] font-mono">
                  <div>
                    <label className="block text-[10px] uppercase text-[#888] mb-1">
                      Selling Price ({settings.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 13500"
                      className="w-full bg-[#0A0A0A] text-sm text-[#FF5F1F] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#888] mb-1">
                      Original / Strike Price (Optional)
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full bg-[#0A0A0A] text-sm text-[#AAA] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#888] mb-1">
                      Unit (per piece, set, box)
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. piece, set, box, pair"
                      className="w-full bg-[#0A0A0A] text-sm text-[#F5F5F5] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-[#18120B] border border-[#FF5F1F]/40 p-4 rounded-none flex items-center gap-3 text-xs text-[#FF8540] font-mono">
                  <EyeOff className="w-5 h-5 text-[#FF5F1F] shrink-0" />
                  <div>
                    <strong className="text-white">Price Hidden:</strong> This tool will be displayed with a high-conversion <strong>"Price on Request / Contact for Quote"</strong> badge and direct WhatsApp inquiry trigger.
                  </div>
                </div>
              )}
            </div>

            {/* Available Sizes / Variants Options */}
            <div className="space-y-3 pt-4 border-t border-[#222]">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] flex items-center gap-1.5">
                  <span>3. Available Sizes / Model Variants (سائزز اور ویرینٹس)</span>
                </h4>
                <span className="text-[10px] font-mono text-[#888]">
                  {availableSizes.length} size option(s) configured
                </span>
              </div>

              <p className="text-xs text-[#888] font-sans">
                Add sizes/models so buyers can select their required size when adding to cart or ordering on WhatsApp:
              </p>

              {/* Add new size */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sizeInput.trim()) {
                      e.preventDefault();
                      if (!availableSizes.includes(sizeInput.trim())) {
                        setAvailableSizes([...availableSizes, sizeInput.trim()]);
                        if (!defaultSize) setDefaultSize(sizeInput.trim());
                      }
                      setSizeInput('');
                    }
                  }}
                  placeholder="Type size/spec (e.g. 4-inch, 1/2-inch, 26mm, 13-Pc) and press Add..."
                  className="flex-1 bg-[#141414] text-xs text-[#F5F5F5] placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (sizeInput.trim() && !availableSizes.includes(sizeInput.trim())) {
                      setAvailableSizes([...availableSizes, sizeInput.trim()]);
                      if (!defaultSize) setDefaultSize(sizeInput.trim());
                      setSizeInput('');
                    }
                  }}
                  className="bg-[#282828] hover:bg-[#FF5F1F] hover:text-black text-white text-xs font-mono uppercase px-4 py-2.5 transition-colors cursor-pointer"
                >
                  + Add Size
                </button>
              </div>

              {/* Quick Presets for Sizes */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[10px]">
                <span className="text-[#666]">Quick Presets:</span>
                {['4" (100mm)', '5" (125mm)', '7" (180mm)', '9" (230mm)', '1/2" Drive', '3/8" Drive', '13-Pc Set', '19-Pc Set', 'Standard'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (!availableSizes.includes(preset)) {
                        setAvailableSizes([...availableSizes, preset]);
                      }
                    }}
                    className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-[#AAA] hover:text-white px-2 py-0.5 border border-[#333] rounded"
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              {/* Configured sizes list */}
              {availableSizes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableSizes.map((sz, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 border flex items-center gap-2 text-xs font-mono rounded ${
                        defaultSize === sz
                          ? 'bg-[#FF5F1F]/20 border-[#FF5F1F] text-white font-bold'
                          : 'bg-[#141414] border-[#333] text-[#CCC]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setDefaultSize(sz)}
                        title="Set as Default Selected Size"
                        className="hover:underline cursor-pointer"
                      >
                        {sz} {defaultSize === sz ? '(Default)' : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = availableSizes.filter((_, i) => i !== idx);
                          setAvailableSizes(filtered);
                          if (defaultSize === sz) {
                            setDefaultSize(filtered[0] || 'Standard');
                          }
                        }}
                        className="text-[#777] hover:text-rose-500 cursor-pointer"
                        title="Remove size"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images Management */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>4. Product Images (Upload from Phone/PC or URL)</span>
              </h4>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#282828] text-white border border-[#333] px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-[#FF5F1F]" />
                    <span>{isUploading ? 'Compressing & Optimizing...' : 'Upload Photos (Auto-Compress)'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <span className="text-xs text-[#666] font-mono">OR paste Web URL:</span>

                  <div className="flex-1 min-w-[200px] flex items-center gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-[#141414] text-xs text-[#F5F5F5] placeholder-[#555] px-3 py-2 rounded-none border border-[#333] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-[#282828] hover:bg-[#FF5F1F] hover:text-black text-white text-xs px-3 py-2 font-mono uppercase cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Compression Status Notification */}
                {compressionStatus && (
                  <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2.5 font-mono animate-in fade-in">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{compressionStatus}</span>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-400 font-mono">{uploadError}</p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#777] font-mono">
                  <span>💡 High-res photos (up to 40MB) are automatically resized to 1200px & compressed for ultra-fast catalog speeds.</span>
                  <span>{images.length} photo(s) selected</span>
                </div>

                {/* Uploaded Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group border border-[#333] bg-[#141414] aspect-square flex items-center justify-center overflow-hidden">
                        <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white p-1 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#FF5F1F] text-black text-[9px] font-mono font-bold px-1.5 py-0.5">
                            COVER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F]">
                4. Descriptions & Overview
              </h4>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-1">
                  Short Highlight / Summary *
                </label>
                <textarea
                  rows={2}
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Industrial 3-mode SDS-plus rotary hammer with vibration control and pure copper motor."
                  className="w-full bg-[#141414] text-xs text-[#F5F5F5] placeholder-[#555] p-3 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-1">
                  Detailed Specifications & Features (Optional)
                </label>
                <textarea
                  rows={3}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Additional application details, technical background, warranty terms..."
                  className="w-full bg-[#141414] text-xs text-[#F5F5F5] placeholder-[#555] p-3 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none font-sans"
                />
              </div>
            </div>

            {/* Technical Specifications Table */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F]">
                  5. Technical Specifications Table
                </h4>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="text-xs font-mono text-[#FF5F1F] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> + Add Specification Row
                </button>
              </div>

              <div className="space-y-2 font-mono">
                {specifications.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Spec Name (e.g. Chuck Size, Power)"
                      value={spec.key}
                      onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                      className="w-1/2 bg-[#141414] text-xs text-white placeholder-[#555] px-3 py-2 rounded-none border border-[#333] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Spec Value (e.g. 26mm, 850W)"
                      value={spec.value}
                      onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                      className="w-1/2 bg-[#141414] text-xs text-white placeholder-[#555] px-3 py-2 rounded-none border border-[#333] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="p-2 text-[#777] hover:text-rose-500 bg-[#141414] border border-[#333]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges & Stock */}
            <div className="space-y-4 pt-4 border-t border-[#222] font-mono">
              <h4 className="text-[11px] uppercase tracking-widest text-[#FF5F1F]">
                6. Inventory & Catalog Flags
              </h4>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-xs text-white">In Stock (موجود ہے)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#FF5F1F]"
                  />
                  <span className="text-xs text-white">Feature in Hero / Highlight</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-xs text-white">Mark as "NEW SPEC 2026"</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-[#222] flex items-center justify-between font-mono">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs uppercase text-[#888] hover:text-white px-4 py-2 bg-[#1A1A1A] border border-[#333]"
              >
                Clear Form
              </button>

              <button
                id="admin-save-product-btn"
                type="submit"
                className="flex items-center gap-2 bg-[#FF5F1F] hover:bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-none shadow-xl transition-colors active:scale-[0.98]"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingProduct ? 'Update Product Details' : 'Publish Product to Showcase'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Manage All Products */}
        {activeTab === 'manage_products' && (
          <div className="p-6 space-y-4 font-mono">
            {/* Missing Categories Alert Banner */}
            {products.filter(isProductMissingCategory).length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/70 via-[#1C160B] to-[#121824] border border-amber-500/40 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{products.filter(isProductMissingCategory).length} Product(s) Missing Category</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                        Action Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans mt-0.5">
                      Analyze product titles and descriptions using Gemini to automatically assign standard categories.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAiCategorizerOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>✨ Auto-Categorize with Gemini</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="Search products by title, SKU, category..."
                  className="w-full bg-[#141414] text-xs text-[#F5F5F5] placeholder-[#555] px-3 py-2 rounded-none border border-[#333] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiCategorizerOpen(true)}
                  className="flex items-center gap-1.5 bg-[#172133] hover:bg-amber-400 hover:text-black text-amber-300 border border-amber-400/40 text-xs font-bold uppercase px-3.5 py-2 rounded-none transition-all cursor-pointer"
                  title="Open Gemini AI Product Categorization Engine"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>✨ AI Categorizer ({products.filter(isProductMissingCategory).length} Uncategorized)</span>
                </button>

                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('add_edit');
                  }}
                  className="flex items-center gap-1.5 bg-[#FF5F1F] hover:bg-white text-black text-xs font-bold uppercase px-4 py-2 rounded-none transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="border border-[#262626] rounded-none overflow-hidden bg-[#141414] max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs text-[#AAA]">
                <thead className="bg-black text-[10px] uppercase tracking-wider text-[#777] border-b border-[#222] sticky top-0 font-mono">
                  <tr>
                    <th className="p-3">Tool</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price / Quote</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {filteredManageProducts.map((p) => {
                    const img = p.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80';
                    const isMissing = isProductMissingCategory(p);
                    return (
                      <tr key={p.id} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img src={img} alt="thumb" className="w-10 h-10 rounded-none object-cover bg-black shrink-0 border border-[#333]" />
                            <div>
                              <div className="font-bold text-white font-sans">{p.name}</div>
                              <div className="text-[10px] text-[#666] font-mono">
                                {p.brand && <span>{p.brand} • </span>}
                                {p.sku || p.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          {isMissing ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertCircle className="w-3 h-3" /> Missing Category
                              </span>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleQuickClassifyItem(p)}
                                  disabled={quickClassifyingId === p.id}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer hover:underline disabled:opacity-50"
                                >
                                  {quickClassifyingId === p.id ? (
                                    <>
                                      <RotateCcw className="w-3 h-3 animate-spin" />
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3" />
                                      <span>✨ AI Auto-Classify</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#888]">{p.category}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {p.hasPrice && p.price ? (
                            <span className="font-mono font-bold text-[#FF5F1F]">
                              {settings.currencySymbol} {p.price.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[#DDD] text-[10px] font-semibold bg-[#1C1C1C] px-2 py-0.5 border border-[#333]">
                              Price on Request
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 ${
                              p.inStock
                                ? 'bg-[#062414] text-emerald-300 border border-emerald-500/30'
                                : 'bg-[#2A0808] text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {p.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                onSaveProduct({ ...p, hasPrice: !p.hasPrice });
                              }}
                              className="p-1.5 text-[#888] hover:text-[#FF5F1F] bg-[#1E1E1E] border border-[#333] transition-colors"
                              title={p.hasPrice ? 'Switch to Price on Request' : 'Switch to Priced'}
                            >
                              {p.hasPrice ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => {
                                onSaveProduct({ ...p, inStock: !p.inStock });
                              }}
                              className="p-1.5 text-[#888] hover:text-emerald-400 bg-[#1E1E1E] border border-[#333] transition-colors"
                              title="Toggle Stock"
                            >
                              <Package className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setActiveTab('add_edit');
                                setName(p.name);
                                setCategory(p.category);
                                setBrand(p.brand || 'Rawal Pro');
                                setSku(p.sku || '');
                                setHasPrice(p.hasPrice);
                                setPrice(p.price ? p.price.toString() : '');
                                setDiscountPrice(p.discountPrice ? p.discountPrice.toString() : '');
                                setUnit(p.unit || 'piece');
                                setShortDescription(p.shortDescription);
                                setFullDescription(p.fullDescription || p.shortDescription);
                                setSpecifications(p.specifications || []);
                                setImages(p.images || []);
                                setInStock(p.inStock);
                                setIsFeatured(!!p.isFeatured);
                                setIsNew(!!p.isNew);
                              }}
                              className="p-1.5 text-[#888] hover:text-white bg-[#1E1E1E] border border-[#333] transition-colors"
                              title="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${p.name}"?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 text-[#888] hover:text-[#f43f5e] bg-[#1E1E1E] border border-[#333] transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Branding & Theme Studio (LOGO & 4 PRO THEMES) */}
        {activeTab === 'branding_theme' && (
          <div className="space-y-8 font-mono">
            
            {/* Section 1: Company Logo Upload */}
            <div className="bg-[#141414] border border-[#262626] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-sans">
                      Company Brand Logo (کمپنی کا لوگو)
                    </h4>
                    <p className="text-[11px] text-[#889]">
                      Upload your official company logo to display on the header, footer, and quotes.
                    </p>
                  </div>
                </div>

                {brandingSaved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Logo Saved!</span>
                  </span>
                )}
              </div>

              {/* Logo Upload / URL Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                      1. Upload Logo from Computer or Phone (PNG, JPG, SVG, WebP)
                    </label>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="w-full flex items-center justify-center gap-2.5 bg-[#1C2029] hover:bg-[#F59E0B] hover:text-black text-white border border-[#2F374A] p-4 text-xs uppercase tracking-wider transition-all font-bold cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{logoUploading ? 'Processing & Saving Logo...' : 'Browse & Upload Logo Image'}</span>
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                    {logoCompressionStatus && (
                      <div className="mt-2 flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{logoCompressionStatus}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-[#667] mt-1">
                      Tip: Transparent PNG or SVG logos with height around 60-120px look best. High-res images are automatically compressed.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#222]">
                    <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                      2. Or Provide Direct Online Image Link (URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 bg-[#0A0A0A] text-xs text-white placeholder-[#555] px-3.5 py-2.5 rounded-none border border-[#333] focus:border-[#F59E0B] outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSaveLogoUrl}
                        className="bg-[#282828] hover:bg-[#F59E0B] hover:text-black text-white text-xs px-4 py-2.5 font-bold uppercase transition-colors"
                      >
                        Apply URL
                      </button>
                    </div>
                  </div>

                  {settings.logoUrl && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-900/50 px-3 py-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Custom Logo (Revert to Stylized Typography)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Preview on Both Dark and Light Headers */}
                <div className="md:col-span-5 space-y-3">
                  <div className="text-[11px] uppercase tracking-wider text-[#888] font-bold">
                    Live Header Preview:
                  </div>

                  {/* Dark Preview */}
                  <div className="bg-[#0A0C10] border border-[#222733] p-4 flex flex-col items-center justify-center min-h-[90px] text-center">
                    <span className="text-[9px] uppercase tracking-widest text-[#556] mb-2">
                      Dark Background Appearance:
                    </span>
                    {logoUrlInput || settings.logoUrl ? (
                      <img
                        src={logoUrlInput || settings.logoUrl}
                        alt="Logo Dark Preview"
                        className="max-h-12 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex items-baseline gap-1 font-serif-editorial">
                        <span className="text-xl font-black italic text-[#F59E0B]">RAWAL</span>
                        <span className="text-lg uppercase text-white">TOOLS</span>
                      </div>
                    )}
                  </div>

                  {/* Light Preview */}
                  <div className="bg-white border border-slate-300 p-4 flex flex-col items-center justify-center min-h-[90px] text-center">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">
                      Light Background Appearance:
                    </span>
                    {logoUrlInput || settings.logoUrl ? (
                      <img
                        src={logoUrlInput || settings.logoUrl}
                        alt="Logo Light Preview"
                        className="max-h-12 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex items-baseline gap-1 font-serif-editorial">
                        <span className="text-xl font-black italic text-blue-600">RAWAL</span>
                        <span className="text-lg uppercase text-slate-900">TOOLS</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Store Theme Selection & Studio */}
            <div className="bg-[#141414] border border-[#262626] p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#F59E0B] text-black flex items-center justify-center font-bold">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
                      <span>Store Theme Design (سٹور کی تھیم منتخب کریں)</span>
                      <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 border border-[#F59E0B]/40 font-mono font-normal">
                        5 STYLES
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#889]">
                      Active Theme: <strong className="text-[#F59E0B]">{activeThemeConfig.name}</strong> ({activeThemeConfig.urduName})
                    </p>
                  </div>
                </div>

                {onOpenThemeModal && (
                  <button
                    type="button"
                    onClick={onOpenThemeModal}
                    className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Open Theme Preview Popup (تھیم پری ویو پاپ اپ)</span>
                  </button>
                )}
              </div>

              {/* 4 Theme Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themeList.map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => {
                        if (onSelectTheme) onSelectTheme(theme.id);
                      }}
                      className={`p-4 border-2 transition-all cursor-pointer relative flex flex-col justify-between group ${
                        isActive
                          ? 'bg-[#18202D] border-[#F59E0B] ring-2 ring-[#F59E0B]/60 shadow-xl'
                          : 'bg-[#10141C] border-[#222A3A] hover:border-[#4D5A75] hover:bg-[#141924]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-3 right-3 bg-[#F59E0B] text-black text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                          ACTIVE THEME
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getThemeIcon(theme.id)}
                          <span className="text-[10px] uppercase tracking-wider text-[#8E98A8]">
                            {theme.isDark ? 'Dark Mode' : 'Light Showroom'}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                          {theme.name}
                        </h5>
                        <div className="text-xs text-[#F59E0B] font-sans font-semibold mt-0.5">
                          {theme.urduName}
                        </div>
                        <p className="text-[11px] text-[#8E98A8] mt-1.5 leading-relaxed font-sans">
                          {theme.tagline}
                        </p>
                      </div>

                      {/* Swatches & Apply Button */}
                      <div className="mt-4 pt-3 border-t border-[#1F2636] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#667]">Colors:</span>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 border border-white/30"
                              style={{ backgroundColor: theme.previewBg }}
                              title="Background"
                            />
                            <div
                              className="w-4 h-4 border border-white/30"
                              style={{ backgroundColor: theme.previewAccent }}
                              title="Accent"
                            />
                            <div
                              className="w-4 h-4 border border-white/30 bg-[#22C55E]"
                              title="WhatsApp"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTheme) onSelectTheme(theme.id);
                          }}
                          className={`w-full py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            isActive
                              ? 'bg-[#F59E0B] text-black shadow-md'
                              : 'bg-[#1C2330] hover:bg-[#F59E0B] hover:text-black text-white border border-[#2D384D]'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Currently Selected</span>
                            </>
                          ) : (
                            <span>Apply {theme.name.split(' ')[0]}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Theme Note */}
              <div className="bg-[#0D1017] border border-[#222938] p-4 text-xs text-[#8E98A8] flex items-start gap-2.5 font-sans">
                <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-mono">Theme Auto-Saved:</strong> Aap jo bhi theme yahan select karein ge wo store ki primary theme ban jaye gi aur tamaam visitors ko yehi look nazar aaye ga.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 4: Store & WhatsApp Settings */}
        {activeTab === 'store_settings' && (
          <form onSubmit={handleSaveStoreSettings} className="space-y-6 font-mono">
            <div className="space-y-4">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] flex items-center gap-1.5 border-b border-[#222] pb-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Official WhatsApp Redirection Configuration</span>
              </h4>

              <div className="bg-[#141414] border border-[#262626] p-4 rounded-none space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-[#888] mb-1">
                      Official WhatsApp Number (With Country Code) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.whatsappNumber}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                      }
                      placeholder="e.g. 923001234567 or 03001234567"
                      className="w-full bg-[#0A0A0A] text-sm text-[#FF5F1F] font-mono font-bold px-3.5 py-2.5 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none"
                    />
                    <span className="text-[10px] text-[#666] mt-1 block font-mono">
                      Direct link preview: <code>https://wa.me/{cleanWhatsAppNumber(settingsForm.whatsappNumber)}</code>
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#888] mb-1">
                      Hotline Phone Display Format
                    </label>
                    <input
                      type="text"
                      value={settingsForm.phoneDisplay}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phoneDisplay: e.target.value })
                      }
                      placeholder="e.g. +92 300 1234567"
                      className="w-full bg-[#0A0A0A] text-sm text-[#F5F5F5] px-3.5 py-2.5 rounded-none border border-[#333] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#888] mb-1">
                    Default Greeting Message
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.customGreeting}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, customGreeting: e.target.value })
                    }
                    className="w-full bg-[#0A0A0A] text-xs text-[#DDD] p-3 rounded-none border border-[#333] outline-none font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] border-b border-[#222] pb-1">
                2. Business Profile & Address
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#888] mb-1">
                    Store / Brand Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] px-3.5 py-2.5 rounded-none border border-[#333] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#888] mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={settingsForm.currencySymbol}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })
                    }
                    placeholder="Rs. or PKR"
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] px-3.5 py-2.5 rounded-none border border-[#333] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#888] mb-1">
                    Shop / Warehouse Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] px-3.5 py-2.5 rounded-none border border-[#333] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#888] mb-1">
                    City & Country
                  </label>
                  <input
                    type="text"
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    className="w-full bg-[#141414] text-sm text-[#F5F5F5] px-3.5 py-2.5 rounded-none border border-[#333] outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[#262626] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-white mb-1 font-mono flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Frontpage Articles & Blog Section (صفحہ اول پر آرٹیکلز)</span>
                  </label>
                  <p className="text-xs text-[#888] font-sans">
                    {settingsForm.showArticlesOnFrontpage
                      ? 'Articles are currently shown on the storefront homepage.'
                      : 'Articles are currently hidden from the storefront homepage.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = !settingsForm.showArticlesOnFrontpage;
                    setSettingsForm({ ...settingsForm, showArticlesOnFrontpage: updated });
                    onSaveSettings({ ...settings, showArticlesOnFrontpage: updated });
                  }}
                  className={`px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors border cursor-pointer ${
                    settingsForm.showArticlesOnFrontpage
                      ? 'bg-rose-950/40 text-rose-300 border-rose-500/50 hover:bg-rose-900/60'
                      : 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 font-extrabold'
                  }`}
                >
                  {settingsForm.showArticlesOnFrontpage ? 'Hide Articles from Front Page' : 'Show Articles on Front Page'}
                </button>
              </div>

              <div className="bg-[#0A0A0A] border border-[#262626] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-white mb-1 font-mono flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Company Logo & Theme Studio</span>
                  </label>
                  <p className="text-xs text-[#888] font-sans">
                    Aap apna official logo upload kar saktay hain aur 4 mukhtalif pro themes mein se koi bhi choose kar saktay hain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('branding_theme')}
                  className="bg-[#1A1A1A] hover:bg-[#F59E0B] hover:text-black text-[#F5F5F5] border border-[#333] px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  Manage Logo & Themes →
                </button>
              </div>
            </div>

            {/* Backup, Restore & Reset */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#FF5F1F] border-b border-[#222] pb-1">
                3. Catalog Backup & Sync
              </h4>

              <div className="flex flex-wrap items-center gap-3 font-mono">
                <button
                  type="button"
                  onClick={onExportCatalog}
                  className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs px-4 py-2.5 rounded-none border border-[#333] transition-colors"
                >
                  <Download className="w-4 h-4 text-[#38bdf8]" />
                  <span>Export Catalog (JSON)</span>
                </button>

                <label className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs px-4 py-2.5 rounded-none border border-[#333] cursor-pointer transition-colors">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  <span>Import Catalog JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all local cache and reload fresh data from code defaults?')) {
                      onResetCatalog();
                    }
                  }}
                  className="flex items-center gap-2 bg-[#2A0808] hover:bg-[#3D0A0A] text-rose-300 text-xs px-4 py-2.5 rounded-none border border-rose-500/30 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Reset to Factory Samples</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Purge all browser cache, remove stale session keys and force reload?')) {
                      purgeCacheAndSyncLatest();
                    }
                  }}
                  className="flex items-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs px-4 py-2.5 rounded-none border border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>⚡ Instant Cache Purge & Hard Reload</span>
                </button>
              </div>
            </div>

            {/* Save Settings Button */}
            <div className="pt-4 border-t border-[#222] flex justify-end font-mono">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#FF5F1F] hover:bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-none shadow-xl transition-colors active:scale-[0.98]"
              >
                {settingsSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Settings Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Store & WhatsApp Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Security & Password Management */}
        {activeTab === 'security' && (
          <div className="space-y-6 font-mono">
            <div className="bg-[#141414] border border-[#262626] p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#222] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-none bg-[#0A0A0A] text-[#FF5F1F] border border-[#333] flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-serif-editorial italic text-white leading-none">
                        Change Admin Password / PIN (پاسورڈ تبدیل کریں)
                      </h4>
                      <p className="text-[10px] text-[#777] uppercase tracking-wider mt-1 font-mono">
                        CONFIGURE SECRET STORE MANAGEMENT CREDENTIALS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Protected</span>
                </div>
              </div>

              {/* Notice in Urdu & English */}
              <div className="bg-[#0A0A0A] border border-[#333] p-4 text-xs text-[#AAA] space-y-2 font-sans">
                <p className="font-semibold text-white">
                  🔐 Store Security Notice (حفاظتی ہدایات):
                </p>
                <p className="text-[11px] leading-relaxed text-[#888]">
                  Yahan aap apna naya secret password ya PIN set kar saktay hain. Password change karne ke baad sirf aap hi <code>/admin</code> pe login kar sakein ge aur koi doosra user access nahi kar sakay ga.
                </p>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                
                {/* Current Password */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1.5 font-mono">
                    Current Password / Old PIN *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="Enter current password..."
                      className="w-full bg-[#0A0A0A] text-sm text-[#F5F5F5] placeholder-[#444] px-3.5 pr-10 py-3 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white p-1"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1.5 font-mono">
                    New Password / New PIN (Minimum 4 Characters) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="Enter new strong password or PIN..."
                      className="w-full bg-[#0A0A0A] text-sm text-[#FF5F1F] font-bold placeholder-[#444] px-3.5 pr-10 py-3 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1.5 font-mono">
                    Confirm New Password / PIN *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="Re-type new password to confirm..."
                      className="w-full bg-[#0A0A0A] text-sm text-[#FF5F1F] font-bold placeholder-[#444] px-3.5 pr-10 py-3 rounded-none border border-[#333] focus:border-[#FF5F1F] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white p-1"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {passwordError && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 p-3">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Password successfully updated! Your new password is now active.</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-[#FF5F1F] hover:bg-white text-black font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-none transition-colors shadow-md active:scale-95 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Update Admin Password</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Tab: Super Admin & Sub-Admins Permission Rights Manager */}
        {activeTab === 'admin_roles' && (
          <div className="w-full">
            <AdminRoleRightsManagerView
              currentRole={activeRoleState}
              accountsConfig={adminAccountsState}
              onUpdateAccounts={handleUpdateAdminAccounts}
              onSwitchRole={handleSwitchRoleInternal}
              activeRole={activeRoleState}
              adminAccounts={adminAccountsState}
              onSaveAdminAccounts={handleUpdateAdminAccounts}
              onSwitchActiveRole={handleSwitchRoleInternal}
            />
          </div>
        )}

        {/* Tab: Google Drive Live Auto-Backup & Full File Downloads */}
        {activeTab === 'google_drive_backup' && (
          <div className="w-full">
            <AdminGoogleDriveBackupView
              products={products}
              settings={settings}
              onRestoreComplete={() => {
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Restricted Access Fallback View */}
        {!isCurrentTabAuthorized && (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 font-mono">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                Access Restricted / عدم رسائی
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Aap ke sub-admin account ({currentAccount.name}) ke pas is section (<span className="text-amber-400 font-mono">{activeItem.label}</span>) ko dekhne ya edit karne ke rights nahi hain. Super Admin se rabta karke access enable karwayen.
              </p>
            </div>
            <div className="p-3 bg-[#111622] border border-[#232D42] rounded-lg text-left w-full space-y-1">
              <div className="text-[11px] font-bold text-slate-300">Required Permission:</div>
              <div className="text-xs text-amber-400 font-mono">● {activeItem.permission}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(visibleNavItems[0]?.id || 'analytics')}
              className="px-4 py-2 bg-amber-400 text-black font-bold rounded-lg text-xs hover:bg-amber-300 transition-colors"
            >
              Go to Allowed Section
            </button>
          </div>
        )}

            </div>
          </main>
        </div>
      </div>

      {/* Gemini AI Batch Categorizer Modal */}
      <AdminAiCategorizerModal
        isOpen={isAiCategorizerOpen}
        onClose={() => setIsAiCategorizerOpen(false)}
        products={products}
        onBatchUpdateProducts={(updated) => {
          if (onBatchUpdateProducts) {
            onBatchUpdateProducts(updated);
          } else {
            updated.forEach(onSaveProduct);
          }
        }}
      />
    </div>
  );
};
