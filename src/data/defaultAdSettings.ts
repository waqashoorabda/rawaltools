import { AdSettings } from '../types';

export const DEFAULT_AD_SETTINGS: AdSettings = {
  globalAdsEnabled: true,
  adsensePublisherId: 'ca-pub-9876543210987654',
  enableAutoAds: false,
  slots: {
    top_leaderboard: {
      id: 'top_leaderboard',
      name: 'Top Header Leaderboard',
      locationLabel: 'Above Hero / Below Navbar',
      dimensions: '728x90 / Responsive Billboard',
      isEnabled: true,
      adType: 'custom_image_banner',
      adsenseClient: 'ca-pub-9876543210987654',
      adsenseSlot: '1122334455',
      adsenseCustomCode: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-9876543210987654"
     data-ad-slot="1122334455"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>`,
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/923001234567?text=Hi%20Rawal%20Tools,%20I%20saw%20your%20Top%20Banner%20Special%20Offer',
      altText: 'Mega Power Tools Sale - Flat 25% Off',
      badge: 'SPONSORED PROMO',
      title: 'SPECIAL CONTRACTOR MEGA SALE — FLAT 25% OFF COPPER ARMATURE POWER TOOLS',
      subtitle: 'Official Rawal Tools Direct Factory Clearance • Nationwide COD Delivery Across Pakistan',
      openInNewTab: true,
    },
    mid_content: {
      id: 'mid_content',
      name: 'Mid-Page Content Billboard',
      locationLabel: 'Between Categories & Clearance Banners',
      dimensions: '970x250 / 728x90',
      isEnabled: true,
      adType: 'custom_image_banner',
      adsenseClient: 'ca-pub-9876543210987654',
      adsenseSlot: '5566778899',
      adsenseCustomCode: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-9876543210987654"
     data-ad-slot="5566778899"
     data-ad-format="horizontal"
     data-full-width-responsive="true"></ins>`,
      imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/923001234567?text=Hi%20Rawal%20Tools,%20inquiry%20about%20Inverter%20Welding%20Machines',
      altText: 'IGBT Digital Inverter Welding Specials',
      badge: 'ADVERTISEMENT',
      title: 'INDUSTRIAL IGBT INVERTER WELDING PLANTS & AUTO-DARKENING TRUE-COLOR MASKS',
      subtitle: '200A - 300A High Duty Cycle Inverters with 1 Year Parts Support. Book Orders on WhatsApp.',
      openInNewTab: true,
    },
    in_feed_grid: {
      id: 'in_feed_grid',
      name: 'Catalog In-Feed Showcase Banner',
      locationLabel: 'Above Product Catalog Grid',
      dimensions: 'Responsive In-Feed / 336x280',
      isEnabled: true,
      adType: 'custom_image_banner',
      adsenseClient: 'ca-pub-9876543210987654',
      adsenseSlot: '9988776655',
      adsenseCustomCode: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-format="fluid"
     data-ad-layout-key="-fb+5w+4e-db+86"
     data-ad-client="ca-pub-9876543210987654"
     data-ad-slot="9988776655"></ins>`,
      imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80',
      targetUrl: 'https://wa.me/923001234567?text=Hi%20Rawal%20Tools,%20I%20need%20Bulk%20Fasteners%20and%20Drill%20Bits',
      altText: 'M35 Cobalt Drill Bit Sets & Hardened Sockets',
      badge: 'FEATURED SPONSOR',
      title: 'GENUINE M35 5% COBALT HIGH-SPEED DRILL BITS & HARDENED CHROME VANADIUM SETS',
      subtitle: 'Guaranteed drilling through Stainless Steel & Cast Iron without burning tips.',
      openInNewTab: true,
    },
    bottom_footer: {
      id: 'bottom_footer',
      name: 'Footer Leaderboard Banner',
      locationLabel: 'Directly Above Footer',
      dimensions: '728x90 / Responsive Wide',
      isEnabled: true,
      adType: 'custom_image_banner',
      adsenseClient: 'ca-pub-9876543210987654',
      adsenseSlot: '3344556677',
      adsenseCustomCode: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-9876543210987654"
     data-ad-slot="3344556677"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>`,
      imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/923001234567?text=Hi%20Rawal%20Tools,%20I%20want%20to%20become%20a%20wholesale%20reseller',
      altText: 'Become a Rawal Tools Authorized Reseller',
      badge: 'WHOLESALE B2B AD',
      title: 'JOIN PAKISTAN’S LARGEST INDUSTRIAL TOOLS WHOLESALE & DISTRIBUTION NETWORK',
      subtitle: 'Competitive dealer margins, bulk cartons & direct depot delivery in Lahore, Karachi & Rawalpindi.',
      openInNewTab: true,
    },
  },
};
