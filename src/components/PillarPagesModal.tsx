import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Cookie, 
  Send, 
  MessageCircle, 
  Check, 
  Building2, 
  Truck, 
  HelpCircle,
  Lock,
  Globe,
  Printer,
  Share2,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PillarPageType, StoreSettings, PageContent } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { buildDirectContactWhatsAppUrl, cleanWhatsAppNumber } from '../utils/whatsapp';

interface PillarPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: PillarPageType;
  activePage?: PillarPageType | null;
  settings?: StoreSettings;
  pageContent?: PageContent;
  theme?: ThemeId;
  onSelectPage?: (page: PillarPageType) => void;
}

export const PillarPagesModal: React.FC<PillarPagesModalProps> = ({
  isOpen,
  onClose,
  initialPage = 'contact',
  activePage,
  settings,
  pageContent,
  theme = 'industrial_yellow',
  onSelectPage,
}) => {
  const [activeTab, setActiveTab] = useState<PillarPageType>(activePage || initialPage || 'contact');

  useEffect(() => {
    if (activePage) {
      setActiveTab(activePage);
    } else if (initialPage) {
      setActiveTab(initialPage);
    }
  }, [activePage, initialPage]);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('Bulk Quotation');
  const [isSent, setIsSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  // Safe fallback store details from settings and pageContent
  const safeStoreName = settings?.storeName || 'Rawal Tools';
  const safeAddress = settings?.address || 'Machinery Market, City Saddar Road';
  const safeCity = settings?.city || 'Rawalpindi, Punjab, Pakistan';
  const safePhone = settings?.phoneDisplay || '+92 300 1234567';
  const safeWhatsApp = settings?.whatsappNumber || '923001234567';
  const safeEmail = settings?.email || 'sales@rawaltools.pk';
  const safeAbout = pageContent?.footerAboutText || 
    "Pakistan's premier industrial showcase for precision rotary tools, industrial angle grinders, heavy duty sockets, welding inverters, and high-tolerance workshop equipment. Direct quotation and express cargo dispatch.";

  const handleTabClick = (page: PillarPageType) => {
    setActiveTab(page);
    if (onSelectPage) onSelectPage(page);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) return;

    const formattedMessage = `*New Direct Inquiry from Website Contact Page*\n\n` +
      `👤 *Name:* ${contactName.trim()}\n` +
      `📞 *Phone:* ${contactPhone.trim() || 'Not specified'}\n` +
      `📍 *City:* ${contactCity.trim() || 'Not specified'}\n` +
      `🏷️ *Inquiry Type:* ${inquiryType}\n` +
      `💬 *Message / Required Tools:*\n${contactMessage.trim()}`;

    const url = buildDirectContactWhatsAppUrl(settings, formattedMessage);
    window.open(url, '_blank');
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setContactMessage('');
    }, 3000);
  };

  const handleSharePage = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/#${activeTab}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans">
      <div 
        className={`relative w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border flex flex-col my-auto transition-all animate-in zoom-in-95 rounded-xl ${
          isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-[#0E121B] text-white border-[#273248]'
        }`}
      >
        
        {/* Header Bar */}
        <div className={`sticky top-0 z-20 px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0E121B]/95 border-[#222A3A]'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black shadow-sm shrink-0"
              style={{ backgroundColor: themeConfig.previewAccent }}
            >
              {activeTab === 'contact' ? (
                <Phone className="w-5 h-5" />
              ) : activeTab === 'terms' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <Cookie className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif-editorial leading-tight">
                  {safeStoreName}
                </h3>
                <span 
                  className="text-[10px] px-2 py-0.5 border font-mono font-bold uppercase hidden sm:inline"
                  style={{ color: themeConfig.previewAccent, borderColor: `${themeConfig.previewAccent}60` }}
                >
                  Official Verified Portal
                </span>
              </div>
              <p className={`text-xs font-mono line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {activeTab === 'contact' && 'Showroom location, WhatsApp hotline, direct quotes & freight desk.'}
                {activeTab === 'terms' && '6-Month copper warranty, 7-day checking policy & nationwide cargo terms.'}
                {(activeTab === 'cookies' || activeTab === 'privacy') && 'Google AdSense compliance, cookie disclosures & privacy protection.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSharePage}
              className={`p-2 border rounded-lg transition-colors cursor-pointer text-xs font-mono flex items-center gap-1 ${
                isLight 
                  ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300' 
                  : 'text-slate-300 hover:text-white bg-[#161B26] hover:bg-[#202736] border-[#2A3448]'
              }`}
              title="Share / Copy Page Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 border rounded-lg transition-colors cursor-pointer ${
                isLight 
                  ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300' 
                  : 'text-slate-300 hover:text-white bg-[#161B26] hover:bg-[#202736] border-[#2A3448]'
              }`}
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-4 sm:px-6 pt-3 pb-0 border-b flex items-center gap-2 overflow-x-auto text-xs font-mono ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D14] border-[#1E2536]'
        }`}>
          {[
            { id: 'contact', label: '📞 Contact Us & Showroom (ہم سے رابطہ کریں)', icon: Phone },
            { id: 'terms', label: '📋 Warranty & Terms (وارنٹی شرائط)', icon: FileText },
            { id: 'cookies', label: '🍪 Cookies & Privacy (کوکیز و پرائیویسی)', icon: Cookie },
          ].map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'cookies' && activeTab === 'privacy');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id as PillarPageType)}
                className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                    : isLight 
                      ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Page Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-8">
          
          {/* =========================================================================
              TAB 1: CONTACT US (FOOTER DATA + SHOWROOM + DIRECT WHATSAPP INQUIRY)
              ========================================================================= */}
          {activeTab === 'contact' && (
            <div className="space-y-8 animate-in fade-in">
              
              {/* About Showcase Intro Banner from Footer */}
              <div className={`p-5 sm:p-6 border rounded-xl space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
              }`}>
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Building2 className="w-4 h-4" />
                  <span>About Our Company & Industrial Showroom</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif-editorial">
                  {safeStoreName} — Premium Industrial Tools & Machinery
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {safeAbout}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified NTN & Commercial Invoices</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <Truck className="w-4 h-4" />
                    <span>Same-Day Express Cargo Dispatch</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>100% Pre-Dispatch Quality Bench Tested</span>
                  </span>
                </div>
              </div>

              {/* 3 Core Contact Cards (Direct from Footer Data) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Address Card */}
                <div className={`p-5 border rounded-xl space-y-2.5 transition-all hover:border-amber-400/50 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
                }`}>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase tracking-wider">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Showroom & Warehouse</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base leading-snug">
                    {safeAddress}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {safeCity}
                  </p>
                  <div className="pt-1">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${safeStoreName} ${safeAddress} ${safeCity}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:underline font-bold"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 2. Direct WhatsApp & Phone Card */}
                <div className={`p-5 border rounded-xl space-y-2.5 transition-all hover:border-emerald-500/50 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
                }`}>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
                    <MessageCircle className="w-4 h-4 shrink-0 fill-emerald-400/20" />
                    <span>WhatsApp & Hotline</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base font-mono">
                    {safePhone}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Direct WhatsApp: +{cleanWhatsAppNumber(safeWhatsApp)}
                  </p>
                  <div className="pt-1">
                    <a
                      href={buildDirectContactWhatsAppUrl(settings, "Hello Rawal Tools, I want to inquire about tool prices & cargo dispatch.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* 3. Timings & Email Card */}
                <div className={`p-5 border rounded-xl space-y-2.5 transition-all hover:border-sky-400/50 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
                }`}>
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs font-mono uppercase tracking-wider">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Timings & Email</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Mon - Sat: 9:00 AM - 8:30 PM
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Sunday: Online WhatsApp Dispatch Open
                  </p>
                  <div className="pt-1">
                    <a
                      href={`mailto:${safeEmail}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:underline font-bold"
                    >
                      <Mail className="w-3 h-3" />
                      <span>{safeEmail}</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* Main Interactive Form & Logistics Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Form Section */}
                <div className={`lg:col-span-7 p-6 border rounded-xl space-y-4 shadow-sm ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
                }`}>
                  <div>
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <span>Send Instant Project / Wholesale Quote Inquiry</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-mono border border-emerald-500/40 rounded">
                        DIRECT WHATSAPP
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Fill in your workshop requirements below to instantly generate and dispatch a structured quote to our sales manager on WhatsApp.
                    </p>
                  </div>

                  <form onSubmit={handleSendInquiry} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">Your Name / Workshop / Business Name:</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Master Tariq (Al-Madina Engineering Workshop)"
                        className={`w-full p-2.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0D14] border-[#252F42] text-white'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">Contact Phone / WhatsApp:</label>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="e.g. 0300-1234567"
                          className={`w-full p-2.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0D14] border-[#252F42] text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">City / Region:</label>
                        <input
                          type="text"
                          value={contactCity}
                          onChange={(e) => setContactCity(e.target.value)}
                          placeholder="e.g. Lahore / Faisalabad / Peshawar"
                          className={`w-full p-2.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0D14] border-[#252F42] text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">Inquiry Purpose:</label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className={`w-full p-2.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0D14] border-[#252F42] text-white'
                        }`}
                      >
                        <option value="Bulk Wholesale Quotation">Bulk Wholesale / Workshop Quotation (تھوک ریٹ کوٹیشن)</option>
                        <option value="Single Machine Purchase">Single Machine Purchase Inquiry (مشین خریداری)</option>
                        <option value="Spare Parts & Armature">Armature / Carbon Brush / Spare Parts (اسپیئر پارٹس)</option>
                        <option value="Cargo & Delivery Status">Cargo Delivery / Bilty Status Tracking (کارگو بلٹی معلومات)</option>
                        <option value="Warranty & Technical Support">Warranty Claim & Technical Support (وارنٹی کلیم)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">Required Tools List / Detailed Message:</label>
                      <textarea
                        rows={3}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Please quote for: 4 units 250A Inverter Welder, 10 packs cutting discs 4-inch, and SDS Plus hammer drill..."
                        className={`w-full p-2.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0D14] border-[#252F42] text-white'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg transition-all shadow-md cursor-pointer"
                    >
                      {isSent ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Inquiry Dispatched via WhatsApp!</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>Send Inquiry Directly to WhatsApp Sales Desk</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Nationwide Logistics & Bank Details Section */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Nationwide Freight Network */}
                  <div className={`p-5 border rounded-xl space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                      <Truck className="w-4 h-4" />
                      <span>Nationwide Cargo & Logistics Network</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      We ship daily across all cities and industrial zones of Pakistan through verified courier and freight services:
                    </p>
                    <ul className={`text-xs font-mono space-y-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span><strong>Heavy Freight (20kg+):</strong> Daewoo Cargo, Faisal Movers, Niazi Cargo with Bilty tracking number.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span><strong>Courier & COD:</strong> TCS, Leopard Courier, M&P with Cash on Delivery across 350+ cities.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span><strong>Dispatch Cutoff:</strong> Same-day dispatch for all orders confirmed before 3:00 PM.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Payment Methods */}
                  <div className={`p-5 border rounded-xl space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121622] border-[#222B3D]'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm text-sky-400">
                      <CreditCard className="w-4 h-4" />
                      <span>Accepted Payment Methods</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className={`p-2 border rounded ${isLight ? 'bg-white border-slate-200' : 'bg-[#161B27] border-[#253046]'}`}>
                        <div className="font-bold text-emerald-400">Cash on Delivery</div>
                        <div className="text-[10px] text-slate-400">For retail tools & parcels</div>
                      </div>
                      <div className={`p-2 border rounded ${isLight ? 'bg-white border-slate-200' : 'bg-[#161B27] border-[#253046]'}`}>
                        <div className="font-bold text-sky-400">Bank Transfer</div>
                        <div className="text-[10px] text-slate-400">Meezan / Alfalah / HBL</div>
                      </div>
                      <div className={`p-2 border rounded ${isLight ? 'bg-white border-slate-200' : 'bg-[#161B27] border-[#253046]'}`}>
                        <div className="font-bold text-amber-400">JazzCash / EasyPaisa</div>
                        <div className="text-[10px] text-slate-400">Instant freight deposit</div>
                      </div>
                      <div className={`p-2 border rounded ${isLight ? 'bg-white border-slate-200' : 'bg-[#161B27] border-[#253046]'}`}>
                        <div className="font-bold text-purple-400">Corporate Invoice</div>
                        <div className="text-[10px] text-slate-400">NTN verified billing</div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              TAB 2: TERMS OF SERVICE, 6-MONTH WARRANTY & RETURN POLICIES
              ========================================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b pb-4 border-slate-700/40">
                <div className="flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-wider font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Industrial Customer Protection & Warranty Standards</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-editorial mt-1">
                  Terms of Service & 6-Month Warranty Policy (شرائط و ضوابط)
                </h3>
                <p className={`text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Last updated: August 2026 • Governed by Industrial Sales & Machinery Standards of Pakistan
                </p>
              </div>

              {/* Policy Sections Grid */}
              <div className="space-y-4">
                
                {/* 1. Armature & Coil Warranty */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                      <span>6-Month Copper Armature & Field Coil Warranty (وارنٹی شرائط)</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                      OFFICIAL WARRANTY
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    All heavy-duty electric power tools (such as Angle Grinders, SDS Rotary Hammers, Cut-off Saws, and Rotary Drills) equipped with 100% pure copper winding carry a 6-month limited warranty covering internal armature burnout and field coil manufacturing defects under standard operating voltages (220V–240V).
                  </p>
                  <div className={`p-3 rounded-lg text-xs font-mono space-y-1 ${
                    isLight ? 'bg-white border border-slate-200 text-slate-700' : 'bg-[#0E121B] border border-[#1E2536] text-slate-300'
                  }`}>
                    <div className="font-bold text-amber-400">Warranty Exclusions (وارنٹی مستثنیات):</div>
                    <p>• Physical external drops, cracked gear housings, or severe water/mud ingress.</p>
                    <p>• Operating tools with depleted carbon brushes resulting in commutator groove damage.</p>
                    <p>• Running tools on low-voltage generators (below 190V) without voltage stabilizers.</p>
                  </div>
                </div>

                {/* 2. 7-Day Replacement Policy */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                    <span>7-Day Checking & Unboxing Replacement Guarantee (7 دن کا چیکنگ وقت)</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    If any tool arrives damaged in courier transit, shows switch failure, or exhibits abnormal vibration upon initial unboxing, the buyer is entitled to an immediate replacement or free replacement parts dispatch within 7 calendar days of delivery.
                  </p>
                  <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    *To initiate a claim, simply record a short 15-second WhatsApp video showing the defect and send it with your order number to our helpline.
                  </p>
                </div>

                {/* 3. Pricing, Quotes & NTN Invoicing */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                    <span>Pricing, Commercial Quotations & Official Invoices (کوٹیشن و بلنگ)</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    All prices are displayed in Pakistani Rupees (PKR). Written quotations provided via WhatsApp or email remain valid for 7 business days. Commercial tax invoices (with NTN and STRN registration) are provided for registered workshops, contractors, and corporate institutions.
                  </p>
                </div>

                {/* 4. Delivery & Cargo Bilty Terms */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">4</span>
                    <span>Nationwide Delivery, Bilty Transport & COD Policies (ڈیلیوری قواعد)</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Parcels up to 15kg are delivered directly to your doorstep via courier with Cash on Delivery (COD). Heavy workshop crates and generators exceeding 20kg are shipped via Daewoo Cargo or Faisal Movers Bilty to your nearest city cargo terminal. Bilty receipts and tracking numbers are shared immediately upon dispatch.
                  </p>
                </div>

                {/* 5. Pre-Dispatch Machine Testing Promise */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">5</span>
                    <span>100% Pre-Dispatch Electrical & RPM Testing Protocol (ٹیسٹنگ گارنٹی)</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Before packing, every machine passes our workshop bench test: RPM verification, switch safety lock engagement, gear lubrication check, and electrical insulation continuity testing to ensure 100% zero DOA (Dead On Arrival) shipments.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: COOKIES, GOOGLE ADSENSE DISCLOSURE & PRIVACY POLICY
              ========================================================================= */}
          {(activeTab === 'cookies' || activeTab === 'privacy') && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b pb-4 border-slate-700/40">
                <div className="flex items-center gap-2 font-mono text-xs text-amber-400 uppercase tracking-wider font-bold">
                  <Lock className="w-4 h-4" />
                  <span>Privacy Protection & GDPR/AdSense Transparency</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-editorial mt-1">
                  Cookies & Privacy Policy (کوکیز اور پرائیویسی پالیسی)
                </h3>
                <p className={`text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Full compliance with Google AdSense, GDPR, and international web privacy standards.
                </p>
              </div>

              {/* Privacy Content Blocks */}
              <div className="space-y-4">
                
                {/* 1. What data we collect */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                    <span>Information We Collect & Storage Policy (ڈیٹا پالیسی)</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    We respect your workshop's privacy. We collect minimal technical metrics (such as device type, browser resolution, and tool category interactions) purely to improve browsing speed. We never sell or share visitor data with third-party telemarketing agencies. No credit card or debit card numbers are ever stored on this server.
                  </p>
                </div>

                {/* 2. Google AdSense & Third-Party Advertising Cookies */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                      <span>Google AdSense & Third-Party Advertising Cookies (گوگل اشتہارات)</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded">
                      ADSENSE COMPLIANT
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Google, as a third-party advertising vendor, uses cookies to serve ads on this website. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
                  </p>
                  <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Users may opt out of personalized advertising at any time by visiting{' '}
                    <a 
                      href="https://www.google.com/settings/ads" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-400 underline hover:text-amber-300 font-bold"
                    >
                      Google Ads Settings (google.com/settings/ads)
                    </a>.
                  </p>
                </div>

                {/* 3. Local Storage Usage */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                    <span>Local Storage (`localStorage`) Usage</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    This application utilizes your browser's local storage to remember your selected theme (e.g. Industrial Yellow, Titanium Silver, Matrix Green), your active WhatsApp multi-item quote basket, and your cookie consent status so you don't have to reconfigure them on repeat visits.
                  </p>
                </div>

                {/* 4. Direct WhatsApp Communication Security */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">4</span>
                    <span>Direct WhatsApp Communication Security</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    All quotations, billings, and custom machinery orders conducted via our WhatsApp hotline (+{cleanWhatsAppNumber(safeWhatsApp)}) are protected by WhatsApp's end-to-end encryption protocols.
                  </p>
                </div>

                {/* 5. Managing Your Cookies */}
                <div className={`p-5 border rounded-xl space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141924] border-[#252F42]'
                }`}>
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">5</span>
                    <span>Managing and Disabling Cookies</span>
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. If you disable cookies, you can still view all machine specifications, download tool catalogs, and contact our team on WhatsApp without restriction.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className={`px-4 sm:px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0A0D14] border-[#1E2536] text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-Bit SSL Encrypted • {safeStoreName} Official Network</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3 py-1.5 border rounded flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' 
                  : 'bg-[#161B26] hover:bg-[#202736] border-[#273248] text-slate-300'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Page</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
