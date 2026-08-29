import { CustomJsSettings } from '../types';

export const DEFAULT_CUSTOM_JS_SETTINGS: CustomJsSettings = {
  enabled: true,
  globalHeaderJs: `// Global Header JavaScript (Executed in <head> context)
// Example: Custom event logging or analytics initialization
console.log('⚡ Rawal Tools Custom JavaScript Engine Loaded');`,
  globalFooterJs: `// Global Footer JavaScript (Executed before </body>)
// You can add custom UI tweaks, dynamic chat triggers, or event handlers here.`,
  customScripts: [
    {
      id: 'script-adsense-init',
      name: 'Google AdSense Script Tag',
      code: `// Google AdSense Global Script
(function() {
  var s = document.createElement('script');
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9876543210987654';
  s.async = true;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
})();`,
      placement: 'head',
      isEnabled: true,
      notes: 'Loads Google AdSense script library asynchronously.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'script-welcome-analytics',
      name: 'Console Store Welcome & Telemetry',
      code: `// Custom store telemetry snippet
try {
  window.__rawalToolsReady = true;
  console.info('%c RAWAL TOOLS INDUSTRIAL SHOWROOM %c v2.4 Active ', 'background:#F59E0B; color:#000; font-weight:bold; padding:2px 4px;', 'background:#1E293B; color:#FFF; padding:2px 4px;');
} catch(e) {
  console.error('Custom JS Error:', e);
}`,
      placement: 'body_end',
      isEnabled: true,
      notes: 'Initializes window status and store console branding.',
      createdAt: new Date().toISOString(),
    }
  ],
};

export const SCRIPT_TEMPLATES = [
  {
    name: 'Google AdSense Auto-Ads Tag',
    description: 'Injects official Google AdSense auto-ads code for site monetization',
    placement: 'head' as const,
    code: `// Replace ca-pub-XXXXXXXXXXXXXXXX with your actual AdSense ID
(function() {
  var adScript = document.createElement('script');
  adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9876543210987654';
  adScript.async = true;
  adScript.crossOrigin = 'anonymous';
  document.head.appendChild(adScript);
})();`,
  },
  {
    name: 'Google Analytics 4 (gtag.js)',
    description: 'Tracks visitor pageviews, sessions, and events in GA4',
    placement: 'head' as const,
    code: `// Replace G-XXXXXXXXXX with your Google Analytics Measurement ID
(function() {
  var gaId = 'G-XXXXXXXXXX';
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId);
})();`,
  },
  {
    name: 'Meta / Facebook Pixel',
    description: 'Tracks customer actions and catalog views for Facebook & Instagram Ads',
    placement: 'head' as const,
    code: `// Replace YOUR_PIXEL_ID with your Facebook Pixel ID
(function(f,b,e,v,n,t,s){
  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)
})(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
// fbq('init', 'YOUR_PIXEL_ID');
// fbq('track', 'PageView');`,
  },
  {
    name: 'Custom Promotional Alert Bar',
    description: 'Displays a custom JavaScript notification banner at the top of the browser',
    placement: 'body_end' as const,
    code: `// Custom Promo Announcement in JavaScript
(function() {
  console.log('Custom JS: Store promotion active');
})();`,
  },
];
