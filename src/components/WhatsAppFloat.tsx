import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { StoreSettings } from '../types';
import { buildDirectContactWhatsAppUrl, cleanWhatsAppNumber } from '../utils/whatsapp';

interface WhatsAppFloatProps {
  settings: StoreSettings;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inquiryText, setInquiryText] = useState('');

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildDirectContactWhatsAppUrl(settings, inquiryText);
    window.open(url, '_blank');
    setInquiryText('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end font-sans">
      {/* Expanded Quick Message Bubble */}
      {isOpen && (
        <div className="mb-3 w-80 bg-[#0F0F0F] border border-[#333333] rounded-none shadow-2xl overflow-hidden animate-slideUp text-[#F5F5F5]">
          {/* Header */}
          <div className="bg-[#141414] border-b border-[#222] p-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-none bg-black border border-[#333] text-[#FF5F1F] flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-serif-editorial italic leading-none">{settings.storeName} Dispatch</h4>
                <span className="text-[9px] font-mono text-[#888] flex items-center gap-1 mt-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F] animate-pulse"></span>
                  DIRECT WHATSAPP DESK
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#777] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3.5 bg-[#0A0A0A] space-y-3 font-mono">
            <div className="bg-[#141414] border border-[#262626] p-2.5 text-xs text-[#AAA]">
              <p className="font-serif-editorial italic text-white text-sm">Assalam-o-Alaikum,</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#777] font-sans">
                Aapko Rawal Tools ki kisi product ke baray mein janna hai ya wholesale quotation chahiye? WhatsApp pe message send karein.
              </p>
            </div>

            <form onSubmit={handleSendCustom} className="space-y-2">
              <textarea
                rows={2}
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="Product name, price inquiry, or delivery question..."
                className="w-full bg-[#141414] text-xs text-[#F5F5F5] placeholder-[#555] p-2.5 rounded-none border border-[#2A2A2A] focus:border-[#FF5F1F] outline-none font-sans"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#FF5F1F] hover:bg-white text-black font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-none transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Message (+{cleanWhatsAppNumber(settings.whatsappNumber)})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Main Button */}
      <button
        id="floating-whatsapp-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-[#FF5F1F] hover:bg-white text-black p-3.5 sm:px-5 sm:py-3.5 rounded-none shadow-2xl transition-colors border border-[#FF5F1F]"
        title="Direct WhatsApp Support"
      >
        <span className="w-2 h-2 rounded-full bg-black animate-ping absolute -top-1 -right-1"></span>
        <span className="w-2 h-2 rounded-full bg-black absolute -top-1 -right-1"></span>
        <MessageCircle className="w-5 h-5 fill-black" />
        <span className="hidden sm:inline font-mono font-bold text-xs uppercase tracking-wider">
          WhatsApp Desk
        </span>
      </button>
    </div>
  );
};

