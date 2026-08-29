export type ThemeId = 'ecom_light' | 'industrial_yellow' | 'modern_light' | 'power_red' | 'titanium_bronze';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  urduName: string;
  tagline: string;
  previewBg: string;
  previewAccent: string;
  isDark: boolean;
  styles: {
    pageBg: string;
    pageText: string;
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    navBg: string;
    navBorder: string;
    primaryAccent: string;
    primaryAccentHover: string;
    primaryAccentText: string;
    secondaryBadgeBg: string;
    secondaryBadgeText: string;
    whatsappBtnBg: string;
    whatsappBtnHover: string;
    whatsappBtnText: string;
    tagBorder: string;
    filterBarBg: string;
    filterBarBorder: string;
    subtext: string;
    modalBg: string;
    modalBorder: string;
    heroGradient: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  ecom_light: {
    id: 'ecom_light',
    name: 'Retail E-Commerce Light (Bewakoof / Retail Modern)',
    urduName: 'ماڈرن ای کامرس لائٹ (ریٹیل سٹائل)',
    tagline: 'Crisp white retail canvas with vibrant yellow highlights, rounded pills, story category tiles & retail fonts',
    previewBg: '#FFFFFF',
    previewAccent: '#FACC15',
    isDark: false,
    styles: {
      pageBg: 'bg-[#F8F9FA]',
      pageText: 'text-[#111827]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E5E7EB]',
      cardHoverBorder: 'hover:border-[#FACC15]',
      navBg: 'bg-[#FFFFFF]',
      navBorder: 'border-[#E5E7EB]',
      primaryAccent: 'bg-[#FACC15]',
      primaryAccentHover: 'hover:bg-[#EAB308]',
      primaryAccentText: 'text-black font-bold',
      secondaryBadgeBg: 'bg-[#FEF9C3]',
      secondaryBadgeText: 'text-[#854D0E]',
      whatsappBtnBg: 'bg-[#22C55E]',
      whatsappBtnHover: 'hover:bg-[#16A34A]',
      whatsappBtnText: 'text-white font-bold',
      tagBorder: 'border-[#FDE047]',
      filterBarBg: 'bg-[#FFFFFF]',
      filterBarBorder: 'border-[#E5E7EB]',
      subtext: 'text-[#6B7280]',
      modalBg: 'bg-[#FFFFFF]',
      modalBorder: 'border-[#E5E7EB]',
      heroGradient: 'from-[#FFFBEB] via-[#F8F9FA] to-[#FFFFFF]',
    },
  },
  industrial_yellow: {
    id: 'industrial_yellow',
    name: 'Heavy Industrial Gold (DeWalt / CAT)',
    urduName: 'ہیوی انڈسٹریل یلو',
    tagline: 'Rugged high-torque look with industrial gold & charcoal',
    previewBg: '#121418',
    previewAccent: '#F59E0B',
    isDark: true,
    styles: {
      pageBg: 'bg-[#0E1015]',
      pageText: 'text-[#F1F3F7]',
      cardBg: 'bg-[#15181F]',
      cardBorder: 'border-[#262B35]',
      cardHoverBorder: 'hover:border-[#F59E0B]',
      navBg: 'bg-[#0A0C10]',
      navBorder: 'border-[#222733]',
      primaryAccent: 'bg-[#F59E0B]',
      primaryAccentHover: 'hover:bg-[#D97706]',
      primaryAccentText: 'text-black font-bold',
      secondaryBadgeBg: 'bg-[#1C212B]',
      secondaryBadgeText: 'text-[#F59E0B]',
      whatsappBtnBg: 'bg-[#22C55E]',
      whatsappBtnHover: 'hover:bg-[#16A34A]',
      whatsappBtnText: 'text-white',
      tagBorder: 'border-[#2A3140]',
      filterBarBg: 'bg-[#12151C]',
      filterBarBorder: 'border-[#222733]',
      subtext: 'text-[#8E98A8]',
      modalBg: 'bg-[#13161D]',
      modalBorder: 'border-[#2B313F]',
      heroGradient: 'from-[#191D27] via-[#101319] to-[#0A0C10]',
    },
  },
  modern_light: {
    id: 'modern_light',
    name: 'Clean Modern Showroom (Bosch / Makita Light)',
    urduName: 'ماڈرن کلین وائٹ',
    tagline: 'Bright crisp white catalog with royal blue & emerald badges',
    previewBg: '#F8FAFC',
    previewAccent: '#2563EB',
    isDark: false,
    styles: {
      pageBg: 'bg-[#F8FAFC]',
      pageText: 'text-[#0F172A]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E2E8F0]',
      cardHoverBorder: 'hover:border-[#2563EB]',
      navBg: 'bg-[#FFFFFF]',
      navBorder: 'border-[#E2E8F0]',
      primaryAccent: 'bg-[#2563EB]',
      primaryAccentHover: 'hover:bg-[#1D4ED8]',
      primaryAccentText: 'text-white font-bold',
      secondaryBadgeBg: 'bg-[#EFF6FF]',
      secondaryBadgeText: 'text-[#1D4ED8]',
      whatsappBtnBg: 'bg-[#16A34A]',
      whatsappBtnHover: 'hover:bg-[#15803D]',
      whatsappBtnText: 'text-white',
      tagBorder: 'border-[#CBD5E1]',
      filterBarBg: 'bg-[#FFFFFF]',
      filterBarBorder: 'border-[#E2E8F0]',
      subtext: 'text-[#64748B]',
      modalBg: 'bg-[#FFFFFF]',
      modalBorder: 'border-[#CBD5E1]',
      heroGradient: 'from-[#EEF2F6] via-[#F8FAFC] to-[#FFFFFF]',
    },
  },
  power_red: {
    id: 'power_red',
    name: 'Apex Power Red (Milwaukee / Hilti)',
    urduName: 'ایپکس پاور ریڈ',
    tagline: 'High velocity midnight carbon with precision torque red',
    previewBg: '#090A0D',
    previewAccent: '#EF4444',
    isDark: true,
    styles: {
      pageBg: 'bg-[#08090C]',
      pageText: 'text-[#F3F4F6]',
      cardBg: 'bg-[#111318]',
      cardBorder: 'border-[#222631]',
      cardHoverBorder: 'hover:border-[#EF4444]',
      navBg: 'bg-[#060709]',
      navBorder: 'border-[#1E222C]',
      primaryAccent: 'bg-[#EF4444]',
      primaryAccentHover: 'hover:bg-[#DC2626]',
      primaryAccentText: 'text-white font-bold',
      secondaryBadgeBg: 'bg-[#1C1215]',
      secondaryBadgeText: 'text-[#F87171]',
      whatsappBtnBg: 'bg-[#22C55E]',
      whatsappBtnHover: 'hover:bg-[#16A34A]',
      whatsappBtnText: 'text-white',
      tagBorder: 'border-[#281A1D]',
      filterBarBg: 'bg-[#0D0F14]',
      filterBarBorder: 'border-[#1E222C]',
      subtext: 'text-[#94A3B8]',
      modalBg: 'bg-[#0F1116]',
      modalBorder: 'border-[#2B1D21]',
      heroGradient: 'from-[#170E11] via-[#0D0F14] to-[#060709]',
    },
  },
  titanium_bronze: {
    id: 'titanium_bronze',
    name: 'Titanium & Precision Bronze (Luxury Hardware)',
    urduName: 'ٹائٹینیم اور برونز گولڈ',
    tagline: 'Boutique architectural hardware with brushed bronze & gunmetal',
    previewBg: '#141416',
    previewAccent: '#D97706',
    isDark: true,
    styles: {
      pageBg: 'bg-[#0D0D0E]',
      pageText: 'text-[#F4F4F5]',
      cardBg: 'bg-[#171719]',
      cardBorder: 'border-[#27272A]',
      cardHoverBorder: 'hover:border-[#D97706]',
      navBg: 'bg-[#09090B]',
      navBorder: 'border-[#27272A]',
      primaryAccent: 'bg-[#D97706]',
      primaryAccentHover: 'hover:bg-[#B45309]',
      primaryAccentText: 'text-black font-bold',
      secondaryBadgeBg: 'bg-[#241B10]',
      secondaryBadgeText: 'text-[#FBBF24]',
      whatsappBtnBg: 'bg-[#10B981]',
      whatsappBtnHover: 'hover:bg-[#059669]',
      whatsappBtnText: 'text-white',
      tagBorder: 'border-[#332514]',
      filterBarBg: 'bg-[#131316]',
      filterBarBorder: 'border-[#27272A]',
      subtext: 'text-[#A1A1AA]',
      modalBg: 'bg-[#141417]',
      modalBorder: 'border-[#3F3F46]',
      heroGradient: 'from-[#1F1912] via-[#121215] to-[#09090B]',
    },
  },
};
