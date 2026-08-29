import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  MessageCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award, 
  Truck, 
  UserCheck, 
  Briefcase, 
  Users, 
  Languages, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TeamMember, StoreSettings } from '../types';
import { ThemeId, THEMES } from '../utils/theme';
import { cleanWhatsAppNumber } from '../utils/whatsapp';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  settings: StoreSettings;
  theme?: ThemeId;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  teamMembers = [],
  settings,
  theme = 'industrial_yellow',
}) => {
  if (!isOpen) return null;

  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');

  // Extract all unique areas covered
  const allAreas = useMemo(() => {
    const set = new Set<string>();
    teamMembers.forEach((m) => {
      m.areasCovered?.forEach((area) => set.add(area));
    });
    return Array.from(set);
  }, [teamMembers]);

  // Departments list
  const departments = ['All', 'Management', 'Sales', 'Logistics & Dispatch', 'Technical Support'];

  // Filtered members
  const filteredMembers = useMemo(() => {
    return teamMembers
      .filter((m) => {
        // Department filter
        if (selectedDept !== 'All' && m.department !== selectedDept) return false;
        // Area filter
        if (selectedArea !== 'All' && !m.areasCovered?.some((a) => a.toLowerCase().includes(selectedArea.toLowerCase()))) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q) || (m.nameUrdu && m.nameUrdu.includes(q));
          const matchRole = m.role.toLowerCase().includes(q) || (m.roleUrdu && m.roleUrdu.includes(q));
          const matchBio = m.bio.toLowerCase().includes(q);
          const matchArea = m.areasCovered?.some((a) => a.toLowerCase().includes(q));
          const matchPhone = (m.phone && m.phone.includes(q)) || (m.whatsappNumber && m.whatsappNumber.includes(q));
          return matchName || matchRole || matchBio || matchArea || matchPhone;
        }
        return true;
      })
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [teamMembers, selectedDept, selectedArea, searchQuery]);

  // Generate personalized WhatsApp click url
  const getPersonalWhatsAppUrl = (member: TeamMember) => {
    const rawNumber = cleanWhatsAppNumber(member.whatsappNumber || settings.whatsappNumber);
    const message = encodeURIComponent(
      `Assalam-o-Alaikum ${member.name} (${member.role}),\n` +
      `I am reaching out via the ${settings.storeName} official website.\n` +
      `I would like to inquire about industrial tools and dispatch for my area/business.`
    );
    return `https://wa.me/${rawNumber}?text=${message}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans overflow-hidden animate-fadeIn">
      <div 
        id="team-directory-modal"
        className={`relative border rounded-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] shadow-2xl flex flex-col my-auto overflow-hidden transition-colors ${
          isLight 
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-900/20' 
            : 'bg-[#0E1118] text-[#F5F5F5] border-[#2B3448]'
        }`}
      >
        {/* Header Bar */}
        <div className={`shrink-0 px-4 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121620] border-[#222A3A]'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0"
              style={{
                backgroundColor: themeConfig.previewAccent,
                color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-lg sm:text-xl leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Meet Our Team & Field Representatives
                </h3>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 border font-bold rounded"
                  style={{
                    backgroundColor: `${themeConfig.previewAccent}20`,
                    borderColor: `${themeConfig.previewAccent}60`,
                    color: themeConfig.previewAccent,
                  }}
                >
                  {teamMembers.length} Staff Members
                </span>
              </div>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ہماری کمپنی کی انتظامیہ، سیلز کنسلٹنٹس، فلیٹ ڈرائیورز اور تکنیکی ماہرین
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 border rounded-lg transition-colors cursor-pointer ${
              isLight 
                ? 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300' 
                : 'text-slate-400 hover:text-white bg-[#1B2232] hover:bg-[#252F44] border-[#2E3A52]'
            }`}
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className={`shrink-0 px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0B0E14] border-[#1E2536]'
        }`}>
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, city (e.g. Lahore, Driver, CEO)..."
              className={`w-full text-xs pl-9 pr-8 py-2 rounded-lg border outline-none font-mono ${
                isLight 
                  ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500 placeholder:text-slate-400' 
                  : 'bg-[#131824] text-white border-[#232D42] focus:border-amber-400 placeholder:text-slate-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {departments.map((dept) => {
              const active = selectedDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shrink-0 border cursor-pointer ${
                    active
                      ? 'shadow-sm font-extrabold'
                      : isLight
                        ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200/60'
                        : 'bg-[#141924] text-slate-300 border-[#232B3E] hover:text-white hover:bg-[#1C2333]'
                  }`}
                  style={active ? {
                    backgroundColor: themeConfig.previewAccent,
                    borderColor: themeConfig.previewAccent,
                    color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                  } : {}}
                >
                  {dept === 'All' && 'All Staff (تمام عملہ)'}
                  {dept === 'Management' && 'CEO & Management'}
                  {dept === 'Sales' && 'Sales Consultants'}
                  {dept === 'Logistics & Dispatch' && 'Logistics & Drivers'}
                  {dept === 'Technical Support' && 'Technicians'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Team Directory Grid */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar ${
          isLight ? 'bg-slate-50' : 'bg-[#07090E]'
        }`}>
          {filteredMembers.length === 0 ? (
            <div className={`text-center py-16 border rounded-xl p-8 max-w-lg mx-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E121B] border-[#222A3A]'
            }`}>
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                No Team Members Found
              </h4>
              <p className="text-xs text-slate-500 mb-4 font-mono">
                No staff member matches your current search & filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('All');
                  setSelectedArea('All');
                }}
                className="px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: themeConfig.previewAccent,
                  color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`group relative border rounded-2xl overflow-hidden shadow-md transition-all duration-200 flex flex-col ${
                    isLight 
                      ? 'bg-white hover:border-amber-400 border-slate-200' 
                      : 'bg-[#0D1017] hover:bg-[#111520] border-[#222A3A] hover:border-amber-400/50'
                  }`}
                >
                  {/* Top Accent Strip */}
                  <div 
                    className="h-2 opacity-90 transition-opacity" 
                    style={{ backgroundColor: themeConfig.previewAccent }}
                  />

                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    {/* Profile Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar Photo */}
                      <div className="relative shrink-0">
                        <img
                          src={member.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                          alt={member.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 shadow-md transition-all"
                          style={{ borderColor: `${themeConfig.previewAccent}80` }}
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute(
                              'src',
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
                            );
                          }}
                        />
                        {member.isAvailable !== false && (
                          <span 
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 rounded-full"
                            style={{ borderColor: isLight ? '#FFFFFF' : '#0D1017' }}
                            title="Active & Ready on WhatsApp"
                          />
                        )}
                      </div>

                      {/* Name & Role */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className={`font-bold text-base sm:text-lg leading-tight truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {member.name}
                          </h4>
                        </div>

                        {member.nameUrdu && (
                          <div className="text-xs font-serif-editorial text-amber-500 font-bold mb-1">
                            {member.nameUrdu}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-300 font-semibold mb-1">
                          <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{member.role}</span>
                        </div>

                        {member.badge && (
                          <span 
                            className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase"
                            style={{
                              backgroundColor: `${themeConfig.previewAccent}15`,
                              borderColor: `${themeConfig.previewAccent}50`,
                              color: themeConfig.previewAccent,
                            }}
                          >
                            {member.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Department Tag & Experience */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] font-mono">
                      <span className={`px-2 py-0.5 rounded border ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#161B26] border-[#252E40] text-slate-300'
                      }`}>
                        {member.department}
                      </span>
                      {member.experienceYears && (
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{member.experienceYears}+ Years Exp</span>
                        </span>
                      )}
                    </div>

                    {/* Bio Snippet */}
                    {member.bio && (
                      <p className={`text-xs leading-relaxed mb-4 line-clamp-3 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {member.bio}
                      </p>
                    )}

                    {/* Covered Areas / Routes Badges */}
                    {member.areasCovered && member.areasCovered.length > 0 && (
                      <div className={`mt-auto pt-3 border-t space-y-1.5 ${
                        isLight ? 'border-slate-100' : 'border-[#1E2536]'
                      }`}>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>Assigned Territories / Areas (کور کیے جانے والے علاقے):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {member.areasCovered.map((area, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                isLight 
                                  ? 'bg-amber-50/80 border-amber-200 text-amber-900 font-medium' 
                                  : 'bg-[#151C2A] border-[#243048] text-amber-400/90'
                              }`}
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Action Bar (Direct WhatsApp Animated Button) */}
                    <div className="mt-4 pt-3 flex items-center gap-2">
                      <a
                        href={getPersonalWhatsAppUrl(member)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 group/btn"
                      >
                        <MessageCircle className="w-4 h-4 fill-white shrink-0 group-hover/btn:scale-110 transition-transform animate-pulse" />
                        <span>Chat WhatsApp (رابطہ کریں)</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </a>

                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className={`p-2.5 border rounded-lg transition-colors shrink-0 ${
                            isLight 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                              : 'bg-[#181F2C] hover:bg-[#222B3D] text-slate-300 border-[#2A3548]'
                          }`}
                          title={`Direct Phone Call: ${member.phone}`}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className={`shrink-0 px-4 sm:px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0B0E14] border-[#1E2536] text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified Official Staff of {settings.storeName}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
            style={{
              backgroundColor: themeConfig.previewAccent,
              color: themeConfig.styles.primaryAccentText.includes('text-black') ? '#000000' : '#FFFFFF',
            }}
          >
            Close Directory
          </button>
        </div>

      </div>
    </div>
  );
};
