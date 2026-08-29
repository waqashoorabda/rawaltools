export interface Specification {
  key: string;
  value: string;
}

export type AdminRole = 'super_admin' | 'sub_admin_1' | 'sub_admin_2';

export type AdminPermission =
  | 'analytics'
  | 'product_performance'
  | 'page_editor'
  | 'blog_cms'
  | 'manage_products'
  | 'add_edit_products'
  | 'media_library'
  | 'reviews_manager'
  | 'ads_manager'
  | 'custom_js'
  | 'branding_theme'
  | 'team_manager'
  | 'store_settings'
  | 'export_import_reset'
  | 'manage_admins';

export interface AdminAccount {
  id: string; // 'super_admin', 'sub_admin_1', 'sub_admin_2'
  role: AdminRole;
  name: string;
  nameUrdu?: string;
  pin: string;
  isActive: boolean;
  avatarIcon?: string;
  permissions: AdminPermission[];
  lastLogin?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface AdminAccountsConfig {
  superAdmin: AdminAccount;
  subAdmin1: AdminAccount;
  subAdmin2: AdminAccount;
}

export interface CategorySuggestion {
  productId?: string;
  suggestedCategory: string;
  confidence: number;
  reason: string;
}

export interface BatchCategorizationResult {
  id: string;
  suggestedCategory: string;
  confidence: number;
  reason: string;
  applied?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  customerCity?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  adminReply?: string;
  adminRepliedAt?: string;
  helpfulCount?: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>; // 1: n, 2: n, 3: n, 4: n, 5: n
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  sku?: string;
  hasPrice: boolean;
  price?: number | null;
  discountPrice?: number | null;
  unit?: string;
  shortDescription: string;
  fullDescription?: string;
  specifications: Specification[];
  images: string[];
  inStock: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  availableSizes?: string[]; // e.g. ['4 Inch (100mm)', '5 Inch (125mm)', '7 Inch (180mm)']
  defaultSize?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  phoneDisplay: string;
  email: string;
  address: string;
  city: string;
  currency: string;
  currencySymbol: string;
  customGreeting: string;
  adminPin: string;
  showDemoNotice: boolean;
  selectedTheme?: string;
  logoUrl?: string;
  showArticlesOnFrontpage?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  customNote?: string;
  specialOfferDiscount?: number;
  offerBadge?: string;
}

export type CategoryFilter = string;

export interface ProductFilters {
  searchQuery: string;
  category: CategoryFilter;
  priceFilter: 'all' | 'priced' | 'on_request';
  stockFilter: 'all' | 'in_stock';
  brandFilter: string;
  sortBy: 'featured' | 'newest' | 'price_low' | 'price_high' | 'name_asc';
}

export interface PageContent {
  announcementText: string;
  heroBadge: string;
  heroHeadline1: string;
  heroHeadline2: string;
  heroSubheadline: string;
  categoryHeading?: string;
  categorySubheading?: string;
  banner1Tag: string;
  banner1Title: string;
  banner1Subtext: string;
  banner2Tag: string;
  banner2Title: string;
  banner2Subtext: string;
  banner3Tag: string;
  banner3Title: string;
  banner3Subtext: string;
  vipTag: string;
  vipTitle: string;
  vipSubtext: string;
  cargoTag: string;
  cargoTitle: string;
  cargoSubtext: string;
  catalogHeading: string;
  catalogSubheading: string;
  footerAboutText: string;
  sectionOrder: string[]; // ['hero', 'categories', 'promo_banners', 'vip_strip', 'catalog']
  hiddenSections: string[]; // array of hidden section ids
}

export interface AnalyticsEvent {
  id: string;
  type: 'page_view' | 'product_view' | 'add_to_cart' | 'whatsapp_inquiry' | 'category_click' | 'search';
  targetId?: string;
  targetName?: string;
  timestamp: string;
  city?: string;
  device?: 'Desktop' | 'Mobile' | 'Tablet';
  meta?: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  totalWhatsAppClicks: number;
  totalCartAdds: number;
  conversionRate: number;
  topViewedProducts: { id: string; name: string; views: number; price?: number | null }[];
  topCartProducts: { id: string; name: string; count: number }[];
  categoryViews: Record<string, number>;
  dailyViews: { date: string; views: number; inquiries: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  recentEvents: AnalyticsEvent[];
}

export type ProductPerformanceStatus = 
  | 'hot_seller' 
  | 'high_intent' 
  | 'high_interest' 
  | 'moderate' 
  | 'low_activity';

export interface ProductPerformanceItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  sku?: string;
  price?: number | null;
  image?: string;
  views: number;
  cartAdds: number;
  conversionRate: number; // percentage, e.g. 18.5%
  potentialRevenue: number; // cartAdds * price
  inStock: boolean;
  isFeatured?: boolean;
  status: ProductPerformanceStatus;
  lastInteractedAt?: string;
}

export interface CustomScript {
  id: string;
  name: string;
  code: string;
  placement: 'head' | 'body_end';
  isEnabled: boolean;
  notes?: string;
  createdAt: string;
}

export interface CustomJsSettings {
  enabled: boolean;
  globalHeaderJs: string;
  globalFooterJs: string;
  customScripts: CustomScript[];
}

export type AdType = 'adsense_code' | 'custom_image_banner' | 'html_code';

export interface AdBannerSlot {
  id: string; // 'top_leaderboard' | 'mid_content' | 'in_feed_grid' | 'bottom_footer'
  name: string;
  locationLabel: string;
  dimensions: string; // e.g. '728x90', '970x250', '300x250', 'Responsive'
  isEnabled: boolean;
  adType: AdType;
  // For AdSense:
  adsenseClient?: string; // 'ca-pub-XXXXXXXXXXXX'
  adsenseSlot?: string; // '1234567890'
  adsenseCustomCode?: string; // Full snippet e.g. <ins class="adsbygoogle" ...></ins>
  // For Custom Image Banner:
  imageUrl: string;
  targetUrl: string;
  altText: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  openInNewTab: boolean;
}

export interface AdSettings {
  globalAdsEnabled: boolean;
  adsensePublisherId: string;
  enableAutoAds: boolean;
  slots: Record<string, AdBannerSlot>;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown / formatted text
  author: string;
  category: string;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  isPublished: boolean;
  readTimeMinutes: number;
  featuredProductId?: string; // Links directly to a store tool/product
  viewsCount?: number;
}

export type PillarPageType = 'contact' | 'terms' | 'cookies' | 'privacy';

export interface TeamMember {
  id: string;
  name: string;
  nameUrdu?: string;
  role: string;
  roleUrdu?: string;
  department: 'Management' | 'Sales' | 'Technical Support' | 'Logistics & Dispatch' | 'Customer Service';
  photoUrl: string;
  whatsappNumber: string;
  phone?: string;
  email?: string;
  areasCovered: string[];
  bio: string;
  languages?: string[];
  experienceYears?: number;
  isAvailable?: boolean;
  order: number;
  badge?: string;
}

export interface CookieConsentSettings {
  hasAnswered: boolean;
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  answeredAt?: string;
}

export type MediaCategory = 'products' | 'banners' | 'team' | 'blog' | 'branding' | 'custom';

export interface MediaItem {
  id: string;
  title: string;
  titleUrdu?: string;
  description?: string; // Alt text or caption
  url: string; // Base64 data URL, external asset URL, or Google Drive URL
  folder: string; // e.g. 'uploads/products', 'uploads/banners', 'uploads/team'
  category: MediaCategory;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt: string;
  tags?: string[];
  associatedId?: string; // Associated productId, teamMemberId, or blogPostId
  isSystemDefault?: boolean;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveWebContentLink?: string;
  driveThumbnailUrl?: string;
  isSyncedToDrive?: boolean;
  driveSyncedAt?: string;
}

export interface GoogleDriveUser {
  email: string;
  displayName: string;
  photoUrl?: string;
  uid: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
}


export interface MediaFolder {
  id: string;
  name: string;
  nameUrdu?: string;
  path: string; // e.g. 'uploads/products'
  category: MediaCategory;
  icon?: string;
  description?: string;
  createdAt?: string;
}


