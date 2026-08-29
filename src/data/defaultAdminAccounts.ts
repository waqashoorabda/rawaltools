import { AdminAccountsConfig, AdminPermission } from '../types';

export interface PermissionDefinition {
  id: AdminPermission;
  label: string;
  labelUrdu: string;
  description: string;
  category: 'CATALOG & MEDIA' | 'STORE & MARKETING' | 'SITE DESIGN & CODE' | 'REPORTS & DATA' | 'SYSTEM';
  icon: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Catalog & Media
  {
    id: 'manage_products',
    label: 'Catalog & Inventory Management',
    labelUrdu: 'کیٹلاگ و پراڈکٹس لسٹ',
    description: 'View products list, update stock status, modify prices, and use Gemini AI auto-categorization.',
    category: 'CATALOG & MEDIA',
    icon: 'Package',
  },
  {
    id: 'add_edit_products',
    label: 'Add & Edit Products',
    labelUrdu: 'نیا پراڈکٹ شامل / ایڈٹ کریں',
    description: 'Create new tools, edit technical specs, upload product pictures, and configure sizes.',
    category: 'CATALOG & MEDIA',
    icon: 'PlusCircle',
  },
  {
    id: 'media_library',
    label: 'Media Library & Google Drive',
    labelUrdu: 'میڈیا لائبریری و کلاؤڈ فائلز',
    description: 'Upload product/banner images, create folders, and sync with Google Drive storage.',
    category: 'CATALOG & MEDIA',
    icon: 'Image',
  },
  {
    id: 'blog_cms',
    label: 'Articles & Blog CMS',
    labelUrdu: 'بلاگ و آرٹیکلز ایڈیٹر',
    description: 'Create, edit, publish buying guides, tool maintenance tutorials, and blog posts.',
    category: 'CATALOG & MEDIA',
    icon: 'BookOpen',
  },

  // Store & Marketing
  {
    id: 'store_settings',
    label: 'WhatsApp & Store Contact Info',
    labelUrdu: 'واٹس ایپ اور رابطہ سیٹنگز',
    description: 'Update WhatsApp order numbers, store address, phone numbers, and currency formatting.',
    category: 'STORE & MARKETING',
    icon: 'Settings',
  },
  {
    id: 'team_manager',
    label: 'Our Team & Representatives',
    labelUrdu: 'ہماری ٹیم و نمائندے',
    description: 'Add and edit team staff members, sales representatives, and direct WhatsApp contacts.',
    category: 'STORE & MARKETING',
    icon: 'Users',
  },
  {
    id: 'reviews_manager',
    label: 'Customer Reviews & Social Proof',
    labelUrdu: 'کسٹمر ریویوز و کمنٹس',
    description: 'Manually add customer testimonials, approve/reject user ratings, and manage star ratings on product pages.',
    category: 'STORE & MARKETING',
    icon: 'Star',
  },
  {
    id: 'ads_manager',
    label: 'Ads & Google AdSense',
    labelUrdu: 'اشتہارات و ایڈسینس',
    description: 'Configure banner ad slots, AdSense publisher IDs, and promotional banners.',
    category: 'STORE & MARKETING',
    icon: 'Megaphone',
  },

  // Site Design & Code
  {
    id: 'page_editor',
    label: 'Page Customizer & Layouts',
    labelUrdu: 'صفحہ کسٹمائزر و ہیرو سیکشن',
    description: 'Edit homepage hero banners, headlines, promo strips, and rearrange page section order.',
    category: 'SITE DESIGN & CODE',
    icon: 'Layout',
  },
  {
    id: 'branding_theme',
    label: 'Store Logo & Visual Themes',
    labelUrdu: 'لوگو اور تھیمز',
    description: 'Change store brand logo and switch between industrial color themes.',
    category: 'SITE DESIGN & CODE',
    icon: 'Palette',
  },
  {
    id: 'custom_js',
    label: 'Custom JavaScript Scripts',
    labelUrdu: 'جاوا اسکرپٹ کوڈ',
    description: 'Add header/footer tracking snippets, analytics tags, and custom JS scripts.',
    category: 'SITE DESIGN & CODE',
    icon: 'Code2',
  },

  // Reports & Data
  {
    id: 'analytics',
    label: 'Visitor Analytics Reports',
    labelUrdu: 'وزیٹر اینالیٹکس رپورٹس',
    description: 'View real-time traffic charts, popular tools, WhatsApp inquiry conversions, and city stats.',
    category: 'REPORTS & DATA',
    icon: 'BarChart3',
  },
  {
    id: 'export_import_reset',
    label: 'Catalog Backup & Reset',
    labelUrdu: 'بیک اپ، امپورٹ و ری سیٹ',
    description: 'Export JSON catalog backups, import product database, and reset catalog.',
    category: 'REPORTS & DATA',
    icon: 'Download',
  },
];

export const SUPER_ADMIN_PERMISSIONS: AdminPermission[] = ALL_PERMISSIONS.map((p) => p.id);

export const DEFAULT_SUB_ADMIN_1_PERMISSIONS: AdminPermission[] = [
  'manage_products',
  'add_edit_products',
  'reviews_manager',
  'blog_cms',
  'media_library',
  'analytics',
];

export const DEFAULT_SUB_ADMIN_2_PERMISSIONS: AdminPermission[] = [
  'analytics',
  'page_editor',
  'reviews_manager',
  'ads_manager',
  'team_manager',
  'store_settings',
  'branding_theme',
];

export const DEFAULT_ADMIN_ACCOUNTS: AdminAccountsConfig = {
  superAdmin: {
    id: 'super_admin',
    role: 'super_admin',
    name: 'Super Admin (Master)',
    nameUrdu: 'سپر ایڈمن (مکمل اختیارات)',
    pin: '1234',
    isActive: true,
    avatarIcon: 'Crown',
    permissions: [...SUPER_ADMIN_PERMISSIONS, 'manage_admins'],
    email: 'admin@rawaltools.com',
    phone: '+92 300 1234567',
    notes: 'Primary Store Owner & Master Controller with absolute administrative authority.',
  },
  subAdmin1: {
    id: 'sub_admin_1',
    role: 'sub_admin_1',
    name: 'Sub Admin 1 (Catalog & Content)',
    nameUrdu: 'سب ایڈمن 1 (کیٹلاگ و مواد)',
    pin: '2222',
    isActive: true,
    avatarIcon: 'Package',
    permissions: DEFAULT_SUB_ADMIN_1_PERMISSIONS,
    email: 'catalog@rawaltools.com',
    phone: '+92 321 9876543',
    notes: 'Handles tool listings, technical specs, media files, articles, and AI categorization.',
  },
  subAdmin2: {
    id: 'sub_admin_2',
    role: 'sub_admin_2',
    name: 'Sub Admin 2 (Store & Marketing)',
    nameUrdu: 'سب ایڈمن 2 (اسٹور و مارکیٹنگ)',
    pin: '3333',
    isActive: true,
    avatarIcon: 'Megaphone',
    permissions: DEFAULT_SUB_ADMIN_2_PERMISSIONS,
    email: 'marketing@rawaltools.com',
    phone: '+92 333 5554433',
    notes: 'Oversees marketing banners, ads, team representatives, customer contacts, and analytics.',
  },
};
