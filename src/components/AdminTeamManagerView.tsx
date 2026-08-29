import React, { useState, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Mail, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Shield,
  Briefcase,
  Eye,
  Languages,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Save,
  Tag,
  Search,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TeamMember, StoreSettings } from '../types';
import { DEFAULT_TEAM_MEMBERS } from '../data/defaultTeam';
import { cleanWhatsAppNumber } from '../utils/whatsapp';
import { compressImage } from '../utils/imageUpload';

interface AdminTeamManagerViewProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  settings: StoreSettings;
  onPreviewTeamModal?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
];

const SUGGESTED_TERRITORIES = [
  'All Pakistan (تمام پاکستان)',
  'Lahore Industrial Estate (لاہور)',
  'Sundar Industrial Estate (سندر انڈسٹریل)',
  'Kot Lakhpat Industrial Zone',
  'Gujranwala & G.T Road (گوجرانوالہ)',
  'Sialkot Export Zone (سیالکوٹ)',
  'Faisalabad Textile Hub (فیصل آباد)',
  'Rawalpindi & Islamabad (راولپنڈی و اسلام آباد)',
  'Karachi Industrial Hub (کراچی)',
  'Hub Industrial Area (حب بلوچستان)',
  'Multan & South Punjab (ملتان)',
  'Peshawar & KPK (پشاور و کے پی کے)',
  'Quetta & Balochistan (کوئٹہ)',
  'Gujrat & Wazirabad (گجرات و وزیر آباد)',
];

interface ParsedExcelRow {
  id: string;
  name: string;
  nameUrdu?: string;
  role: string;
  roleUrdu?: string;
  department: TeamMember['department'];
  whatsappNumber: string;
  phone?: string;
  email?: string;
  areasCovered: string[];
  bio: string;
  languages?: string[];
  experienceYears?: number;
  badge?: string;
  photoUrl: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export const AdminTeamManagerView: React.FC<AdminTeamManagerViewProps> = ({
  teamMembers = [],
  onUpdateTeamMembers,
  settings,
  onPreviewTeamModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Inline designation editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineRoleValue, setInlineRoleValue] = useState<string>('');
  const [inlineRoleUrduValue, setInlineRoleUrduValue] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [nameUrdu, setNameUrdu] = useState('');
  const [role, setRole] = useState('');
  const [roleUrdu, setRoleUrdu] = useState('');
  const [department, setDepartment] = useState<TeamMember['department']>('Sales');
  const [photoUrl, setPhotoUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [territoryInput, setTerritoryInput] = useState('');
  const [bio, setBio] = useState('');
  const [languagesInput, setLanguagesInput] = useState('Urdu, Punjabi');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [badge, setBadge] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoCompressionStatus, setPhotoCompressionStatus] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Excel Bulk Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<ParsedExcelRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Image Upload handler with auto-compression
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    setPhotoCompressionStatus(null);
    try {
      const result = await compressImage(files[0], {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
      });
      setPhotoUrl(result.dataUrl);
      setPhotoCompressionStatus(`⚡ Photo optimized: ${result.reductionLabel}`);
      setTimeout(() => setPhotoCompressionStatus(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error processing photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoFileInputRef.current) {
        photoFileInputRef.current.value = '';
      }
    }
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setName('');
    setNameUrdu('');
    setRole('');
    setRoleUrdu('');
    setDepartment('Sales');
    setPhotoUrl(PRESET_AVATARS[0]);
    setWhatsappNumber(settings.whatsappNumber || '923001234567');
    setPhone(settings.phoneDisplay || '+92 300 1234567');
    setEmail('');
    setAreas(['Lahore Industrial Estate', 'Gujranwala']);
    setTerritoryInput('');
    setBio('Professional equipment consultant with extensive field knowledge of workshop tools and prompt customer dispatch.');
    setLanguagesInput('Urdu, Punjabi');
    setExperienceYears(5);
    setBadge('Field Representative');
    setIsAvailable(true);
    setIsAddingNew(true);
  };

  const handleStartEdit = (member: TeamMember) => {
    setIsAddingNew(false);
    setEditingId(member.id);
    setName(member.name);
    setNameUrdu(member.nameUrdu || '');
    setRole(member.role);
    setRoleUrdu(member.roleUrdu || '');
    setDepartment(member.department);
    setPhotoUrl(member.photoUrl);
    setWhatsappNumber(member.whatsappNumber);
    setPhone(member.phone || '');
    setEmail(member.email || '');
    setAreas(Array.isArray(member.areasCovered) ? [...member.areasCovered] : []);
    setTerritoryInput('');
    setBio(member.bio || '');
    setLanguagesInput(member.languages?.join(', ') || '');
    setExperienceYears(member.experienceYears || 5);
    setBadge(member.badge || '');
    setIsAvailable(member.isAvailable !== false);
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingId(null);
  };

  // Territory chip handlers
  const handleAddTerritory = () => {
    const trimmed = territoryInput.trim();
    if (!trimmed) return;
    if (!areas.includes(trimmed)) {
      setAreas([...areas, trimmed]);
    }
    setTerritoryInput('');
  };

  const handleRemoveTerritory = (indexToRemove: number) => {
    setAreas(areas.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSelectSuggestedTerritory = (territory: string) => {
    const cleanName = territory.split(' (')[0];
    if (!areas.includes(cleanName)) {
      setAreas([...areas, cleanName]);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter employee name.');
      return;
    }
    if (!role.trim()) {
      alert('Please enter employee role/designation.');
      return;
    }

    const languagesArray = languagesInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const finalAreas = areas.length > 0 ? areas : ['All Pakistan'];

    if (isAddingNew) {
      const newMember: TeamMember = {
        id: `team-${Date.now()}`,
        name: name.trim(),
        nameUrdu: nameUrdu.trim(),
        role: role.trim(),
        roleUrdu: roleUrdu.trim(),
        department,
        photoUrl: photoUrl.trim() || PRESET_AVATARS[0],
        whatsappNumber: cleanWhatsAppNumber(whatsappNumber || settings.whatsappNumber),
        phone: phone.trim() || settings.phoneDisplay || '+92 300 1234567',
        email: email.trim(),
        areasCovered: finalAreas,
        bio: bio.trim(),
        languages: languagesArray.length > 0 ? languagesArray : ['Urdu'],
        experienceYears: Number(experienceYears) || 0,
        badge: badge.trim(),
        isAvailable,
        order: teamMembers.length + 1,
      };

      const updated = [...teamMembers, newMember];
      onUpdateTeamMembers(updated);
      showNotification(`Added new member "${newMember.name}" (${newMember.role}) successfully.`);
    } else if (editingId) {
      const updated = teamMembers.map((m) => {
        if (m.id === editingId) {
          return {
            ...m,
            name: name.trim(),
            nameUrdu: nameUrdu.trim(),
            role: role.trim(),
            roleUrdu: roleUrdu.trim(),
            department,
            photoUrl: photoUrl.trim() || m.photoUrl,
            whatsappNumber: cleanWhatsAppNumber(whatsappNumber || settings.whatsappNumber),
            phone: phone.trim(),
            email: email.trim(),
            areasCovered: finalAreas,
            bio: bio.trim(),
            languages: languagesArray.length > 0 ? languagesArray : m.languages,
            experienceYears: Number(experienceYears) || 0,
            badge: badge.trim(),
            isAvailable,
          };
        }
        return m;
      });
      onUpdateTeamMembers(updated);
      showNotification(`Updated "${name}" profile successfully.`);
    }

    setIsAddingNew(false);
    setEditingId(null);
  };

  // Quick inline role save
  const handleSaveInlineRole = (memberId: string) => {
    if (!inlineRoleValue.trim()) {
      alert('Designation cannot be empty.');
      return;
    }
    const updated = teamMembers.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          role: inlineRoleValue.trim(),
          roleUrdu: inlineRoleUrduValue.trim() || m.roleUrdu,
        };
      }
      return m;
    });
    onUpdateTeamMembers(updated);
    setInlineEditingId(null);
    showNotification('Designation updated successfully.');
  };

  const handleDeleteMember = (id: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove "${memberName}" from the team directory?`)) {
      const updated = teamMembers.filter((m) => m.id !== id);
      onUpdateTeamMembers(updated);
      showNotification(`Removed "${memberName}" from team.`);
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newItems = [...teamMembers];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    const reordered = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateTeamMembers(reordered);
  };

  const handleResetToDefault = () => {
    if (confirm('Reset team directory to default sample staff?')) {
      onUpdateTeamMembers(DEFAULT_TEAM_MEMBERS);
      showNotification('Reset team members to initial defaults.');
    }
  };

  // ==========================================
  // EXCEL & CSV TEMPLATE & IMPORT ENGINE
  // ==========================================

  // Download Sample Excel Template (.xlsx)
  const handleDownloadSampleExcel = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const sampleData = [
      {
        'Full Name (نام)': 'Haji Waqas Ahmed',
        'Urdu Name (اردو نام)': 'حاجی وقاص احمد',
        'Designation / Role (عہدہ)': 'Chief Executive Officer (CEO)',
        'Urdu Role (عہدہ اردو)': 'چیف ایگزیکٹو آفیسر',
        'Department (شعبہ)': 'Management',
        'WhatsApp Number': '923001234567',
        'Phone Number': '+92 300 1234567',
        'Email Address': 'ceo@rawaltools.com',
        'Assigned Territories (علاقے)': 'All Pakistan, Head Office Lahore',
        'Bio / Description': 'Over 20+ years of industrial tool imports, procurement, and technical supply across Pakistan.',
        'Badge / Tag': 'Founder & CEO',
        'Experience Years': 20,
        'Languages': 'Urdu, Punjabi, English',
        'Photo URL': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
      },
      {
        'Full Name (نام)': 'Engr. Tariq Mehmood',
        'Urdu Name (اردو نام)': 'انجینئر طارق محمود',
        'Designation / Role (عہدہ)': 'Senior Technical Support Lead',
        'Urdu Role (عہدہ اردو)': 'سینئر ٹیکنیکل سپورٹ انچارج',
        'Department (شعبہ)': 'Technical Support',
        'WhatsApp Number': '923019876543',
        'Phone Number': '+92 301 9876543',
        'Email Address': 'support@rawaltools.com',
        'Assigned Territories (علاقے)': 'Lahore, Gujranwala, Sialkot, Faisalabad',
        'Bio / Description': 'Specialist in rotary hammer troubleshooting, armature testing, and warranty servicing.',
        'Badge / Tag': 'Master Technician',
        'Experience Years': 12,
        'Languages': 'Urdu, Punjabi',
        'Photo URL': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
      },
      {
        'Full Name (نام)': 'Muhammad Usman',
        'Urdu Name (اردو نام)': 'محمد عثمان',
        'Designation / Role (عہدہ)': 'Field Sales & Territory Consultant',
        'Urdu Role (عہدہ اردو)': 'سیلز و مارکیٹ کنسلٹنٹ',
        'Department (شعبہ)': 'Sales',
        'WhatsApp Number': '923214567890',
        'Phone Number': '+92 321 4567890',
        'Email Address': 'sales@rawaltools.com',
        'Assigned Territories (علاقے)': 'Kot Lakhpat, Sundar Industrial Estate, Multan Road',
        'Bio / Description': 'On-site workshop demonstrations, quotation requests, and commercial order dispatch.',
        'Badge / Tag': 'Field Consultant',
        'Experience Years': 7,
        'Languages': 'Urdu, Punjabi',
        'Photo URL': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80'
      },
      {
        'Full Name (نام)': 'Rashid Ali',
        'Urdu Name (اردو نام)': 'راشد علی',
        'Designation / Role (عہدہ)': 'Logistics & Fast Dispatch Driver',
        'Urdu Role (عہدہ اردو)': 'ڈسپیچ و ڈیلیوری ڈرائیور',
        'Department (شعبہ)': 'Logistics & Dispatch',
        'WhatsApp Number': '923331122334',
        'Phone Number': '+92 333 1122334',
        'Email Address': 'dispatch@rawaltools.com',
        'Assigned Territories (علاقے)': 'Lahore City, Gujranwala G.T Road, Sheikhupura',
        'Bio / Description': 'Rapid city delivery fleet, verified consignment handling, and cargo terminal handover.',
        'Badge / Tag': 'Fast Dispatch',
        'Experience Years': 6,
        'Languages': 'Urdu, Punjabi',
        'Photo URL': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Members');

    // Auto column widths
    const columnWidths = [
      { wch: 22 }, // Name
      { wch: 18 }, // Name Urdu
      { wch: 30 }, // Designation
      { wch: 24 }, // Role Urdu
      { wch: 20 }, // Department
      { wch: 16 }, // WhatsApp
      { wch: 16 }, // Phone
      { wch: 24 }, // Email
      { wch: 35 }, // Territories
      { wch: 40 }, // Bio
      { wch: 18 }, // Badge
      { wch: 16 }, // Exp
      { wch: 20 }, // Langs
      { wch: 40 }, // Photo
    ];
    worksheet['!cols'] = columnWidths;

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'Rawal_Tools_Team_Upload_Template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'Rawal_Tools_Team_Upload_Template.csv');
    }
  };

  // Export current team to Excel
  const handleExportCurrentTeam = () => {
    if (teamMembers.length === 0) {
      alert('No team members to export.');
      return;
    }

    const exportData = teamMembers.map((m) => ({
      'Full Name (نام)': m.name,
      'Urdu Name (اردو نام)': m.nameUrdu || '',
      'Designation / Role (عہدہ)': m.role,
      'Urdu Role (عہدہ اردو)': m.roleUrdu || '',
      'Department (شعبہ)': m.department,
      'WhatsApp Number': m.whatsappNumber,
      'Phone Number': m.phone || '',
      'Email Address': m.email || '',
      'Assigned Territories (علاقے)': m.areasCovered?.join(', ') || 'All Pakistan',
      'Bio / Description': m.bio || '',
      'Badge / Tag': m.badge || '',
      'Experience Years': m.experienceYears || 5,
      'Languages': m.languages?.join(', ') || 'Urdu',
      'Photo URL': m.photoUrl || '',
      'Is Active': m.isAvailable !== false ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Team Directory');
    XLSX.writeFile(wb, `Rawal_Tools_Team_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Exported team members to Excel file successfully.');
  };

  // Parse Excel / CSV File
  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImportFileName(file.name);
    setIsParsingExcel(true);
    setImportFileError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Excel file appears to be empty with no sheets.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('No data rows found in the uploaded sheet.');
      }

      // Helper to find value from possible key synonyms
      const getValueByKeys = (row: any, keyPatterns: string[]): string => {
        for (const rowKey of Object.keys(row)) {
          const cleanKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const pattern of keyPatterns) {
            const cleanPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanKey.includes(cleanPattern) || cleanPattern.includes(cleanKey)) {
              return String(row[rowKey] || '').trim();
            }
          }
        }
        return '';
      };

      // Department inference helper
      const mapDepartment = (val: string, roleVal: string): TeamMember['department'] => {
        const check = `${val} ${roleVal}`.toLowerCase();
        if (check.includes('ceo') || check.includes('director') || check.includes('manage') || check.includes('founder') || check.includes('owner')) {
          return 'Management';
        }
        if (check.includes('dispatch') || check.includes('driver') || check.includes('logistics') || check.includes('delivery') || check.includes('cargo')) {
          return 'Logistics & Dispatch';
        }
        if (check.includes('tech') || check.includes('repair') || check.includes('engineer') || check.includes('mechanic') || check.includes('workshop')) {
          return 'Technical Support';
        }
        if (check.includes('care') || check.includes('support') || check.includes('service') || check.includes('help')) {
          return 'Customer Service';
        }
        return 'Sales';
      };

      const parsed: ParsedExcelRow[] = rawRows.map((row, idx) => {
        const rowName = getValueByKeys(row, ['fullname', 'name', 'employeename', 'staffname', 'naam', 'نام']);
        const rowNameUrdu = getValueByKeys(row, ['urduname', 'nameurdu', 'urdu', 'اردو نام']);
        const rowRole = getValueByKeys(row, ['designation', 'role', 'jobtitle', 'title', 'post', 'position', 'ohda', 'عہدہ']);
        const rowRoleUrdu = getValueByKeys(row, ['roleurdu', 'urdorole', 'designationurdu', 'عہدہ اردو']);
        const rawDept = getValueByKeys(row, ['department', 'dept', 'division', 'shoba', 'شعبہ']);
        const rawWhatsapp = getValueByKeys(row, ['whatsapp', 'wa', 'whatsappnumber', 'wanumber', 'واٹس ایپ']);
        const rawPhone = getValueByKeys(row, ['phone', 'mobile', 'call', 'contact', 'phonenumber', 'فون']);
        const rawEmail = getValueByKeys(row, ['email', 'mail', 'emailaddress', 'ای میل']);
        const rawAreas = getValueByKeys(row, ['assignedterritories', 'territories', 'territory', 'areas', 'cities', 'covered', 'routes', 'zones', 'علاقے', 'شہر']);
        const rawBio = getValueByKeys(row, ['bio', 'description', 'about', 'details', 'expertise', 'تفصیل']);
        const rawBadge = getValueByKeys(row, ['badge', 'tag', 'label', 'ٹیگ']);
        const rawExp = getValueByKeys(row, ['experience', 'exp', 'experienceyears', 'years', 'تجربہ']);
        const rawLangs = getValueByKeys(row, ['languages', 'lang', 'spoken', 'زبانیں']);
        const rawPhoto = getValueByKeys(row, ['photourl', 'photo', 'image', 'picture', 'avatar', 'img', 'تصویر']);

        const errors: string[] = [];
        const warnings: string[] = [];

        // Validation Checks
        if (!rowName) {
          errors.push('Name is required (نام ضروری ہے)');
        }
        if (!rowRole) {
          errors.push('Designation / Role is required (عہدہ ضروری ہے)');
        }

        const cleanedWa = cleanWhatsAppNumber(rawWhatsapp || rawPhone || settings.whatsappNumber);
        if (!cleanedWa || cleanedWa.length < 8) {
          warnings.push('WhatsApp number appears incomplete, will fallback to store default.');
        }

        // Territories parsing
        let territoryList: string[] = [];
        if (rawAreas) {
          territoryList = rawAreas
            .split(/[,;|/\n]/)
            .map((t) => t.trim())
            .filter(Boolean);
        }
        if (territoryList.length === 0) {
          territoryList = ['All Pakistan'];
        }

        const langsList = rawLangs
          ? rawLangs.split(/[,;|/]/).map((l) => l.trim()).filter(Boolean)
          : ['Urdu', 'Punjabi'];

        const assignedAvatar = rawPhoto || PRESET_AVATARS[idx % PRESET_AVATARS.length];

        return {
          id: `excel-row-${Date.now()}-${idx}`,
          name: rowName,
          nameUrdu: rowNameUrdu,
          role: rowRole,
          roleUrdu: rowRoleUrdu,
          department: mapDepartment(rawDept, rowRole),
          whatsappNumber: cleanedWa || settings.whatsappNumber,
          phone: rawPhone || settings.phoneDisplay || '+92 300 1234567',
          email: rawEmail,
          areasCovered: territoryList,
          bio: rawBio || `Field representative for ${territoryList.join(', ')} with technical tool consultation.`,
          languages: langsList,
          experienceYears: parseInt(rawExp, 10) || 5,
          badge: rawBadge || (rowRole.includes('CEO') ? 'Management' : 'Field Rep'),
          photoUrl: assignedAvatar,
          errors,
          warnings,
          isValid: errors.length === 0,
        };
      });

      setImportRows(parsed);
      setIsImportModalOpen(true);
    } catch (err: any) {
      setImportFileError(err.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
    } finally {
      setIsParsingExcel(false);
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = '';
      }
    }
  };

  // Modify cell in preview table
  const handleUpdateImportRowField = (rowId: string, field: keyof ParsedExcelRow, value: any) => {
    setImportRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          // Re-evaluate errors
          const errors: string[] = [];
          if (!updated.name?.trim()) errors.push('Name is required');
          if (!updated.role?.trim()) errors.push('Designation is required');
          return {
            ...updated,
            errors,
            isValid: errors.length === 0,
          };
        }
        return row;
      })
    );
  };

  // Delete row from import preview
  const handleDeleteImportRow = (rowId: string) => {
    setImportRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Commit valid Excel rows to state
  const handleConfirmImport = () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('There are no valid rows to import. Please resolve the errors highlighted in red first.');
      return;
    }

    const convertedMembers: TeamMember[] = validRows.map((r, idx) => ({
      id: `team-imported-${Date.now()}-${idx}`,
      name: r.name.trim(),
      nameUrdu: r.nameUrdu?.trim(),
      role: r.role.trim(),
      roleUrdu: r.roleUrdu?.trim(),
      department: r.department,
      photoUrl: r.photoUrl.trim() || PRESET_AVATARS[idx % PRESET_AVATARS.length],
      whatsappNumber: cleanWhatsAppNumber(r.whatsappNumber || settings.whatsappNumber),
      phone: r.phone?.trim() || settings.phoneDisplay || '+92 300 1234567',
      email: r.email?.trim() || '',
      areasCovered: r.areasCovered && r.areasCovered.length > 0 ? r.areasCovered : ['All Pakistan'],
      bio: r.bio.trim(),
      languages: r.languages || ['Urdu'],
      experienceYears: Number(r.experienceYears) || 5,
      badge: r.badge?.trim() || '',
      isAvailable: true,
      order: importMode === 'append' ? teamMembers.length + idx + 1 : idx + 1,
    }));

    if (importMode === 'replace') {
      onUpdateTeamMembers(convertedMembers);
      showNotification(`Successfully replaced team directory with ${convertedMembers.length} members from Excel.`);
    } else {
      onUpdateTeamMembers([...teamMembers, ...convertedMembers]);
      showNotification(`Successfully added ${convertedMembers.length} new members from Excel.`);
    }

    setIsImportModalOpen(false);
    setImportRows([]);
  };

  // Filtered members for roster search
  const filteredMembers = teamMembers.filter((m) => {
    if (deptFilter !== 'All' && m.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q) || (m.nameUrdu && m.nameUrdu.includes(q));
      const matchRole = m.role.toLowerCase().includes(q) || (m.roleUrdu && m.roleUrdu.includes(q));
      const matchArea = m.areasCovered?.some((a) => a.toLowerCase().includes(q));
      const matchWa = m.whatsappNumber && m.whatsappNumber.includes(q);
      return matchName || matchRole || matchArea || matchWa;
    }
    return true;
  });

  const validRowCount = importRows.filter((r) => r.isValid).length;
  const invalidRowCount = importRows.length - validRowCount;

  return (
    <div className="space-y-6 text-slate-200 font-sans">
      {/* Top Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-300 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Import Error Alert */}
      {importFileError && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{importFileError}</span>
          </div>
          <button onClick={() => setImportFileError(null)} className="text-rose-300 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar with Action Controls */}
      <div className="bg-[#0D111A] p-5 sm:p-6 rounded-xl border border-[#232C3F] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-white font-sans">
              Meet Our Team & Field Representatives
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-full font-bold">
              {teamMembers.length} Active Staff
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 max-w-2xl">
            Manage company executives, sales consultants, dispatch drivers, and technicians. Customers can view their assigned territories, designations, and initiate direct WhatsApp inquiries with verified staff.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {onPreviewTeamModal && (
            <button
              type="button"
              onClick={onPreviewTeamModal}
              className="px-3.5 py-2 bg-[#1A2234] hover:bg-[#25314C] text-slate-200 border border-[#2E3C5B] rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Customer View</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCurrentTeam}
            className="px-3.5 py-2 bg-[#131B2A] hover:bg-[#1C273D] text-slate-300 hover:text-white border border-[#263550] rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Export team directory to Excel file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export (.xlsx)</span>
          </button>

          {!isAddingNew && !editingId && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🚀 EXCEL / CSV BULK UPLOAD & TEMPLATE CENTER BANNER */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-[#101827] via-[#0E1524] to-[#121A2E] border-2 border-[#24334F] hover:border-amber-400/50 rounded-xl p-5 sm:p-6 shadow-xl transition-all">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left info */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Bulk Upload Team via Excel & CSV (ایکسل فائل سے ٹیم اپلوڈ کریں)</span>
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Auto Data Mapping & Error Check
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1.5 max-w-2xl leading-relaxed">
                Upload your company staff roster in Excel (<span className="text-amber-400">.xlsx</span>, <span className="text-amber-400">.xls</span>) or <span className="text-amber-400">.csv</span> format. The system automatically reads <strong className="text-white">Names, Designations, WhatsApp Numbers, and Assigned Territories</strong>. Any missing data or errors are highlighted for verification before saving.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                <span>✓ Pre-Upload Validation</span>
                <span>✓ In-Table Cell Correction</span>
                <span>✓ Auto-Assign Territory Badges</span>
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            {/* Download Template Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSampleExcel('xlsx')}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#172133] hover:bg-[#202E47] text-amber-300 border border-amber-400/30 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Download pre-formatted Excel template with sample staff columns"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSampleExcel('csv')}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#172133] hover:bg-[#202E47] text-slate-300 border border-[#2C3B58] rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Download CSV format template"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Template (.csv)</span>
              </button>
            </div>

            {/* Upload Trigger Button */}
            <input
              ref={excelFileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
              onChange={handleExcelFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => excelFileInputRef.current?.click()}
              disabled={isParsingExcel}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs font-mono uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isParsingExcel ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Reading File...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-black" />
                  <span>Upload Excel / CSV File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📋 PRE-UPLOAD VALIDATION & ERROR RESOLUTION MODAL */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-[#0E131F] border-2 border-[#2F3E5C] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#121827] border-b border-[#222E46] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    <span>Excel Data Preview & Error Check</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1C2538] text-amber-400 border border-[#2B3854]">
                      {importFileName}
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Review and edit member records before adding to the directory. Rows with errors are highlighted in red.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRows([]);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-[#182133] hover:bg-[#222E46] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Stat Summary Strip */}
            <div className="px-5 py-3 bg-[#0A0D16] border-b border-[#1E273A] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-slate-300">
                  Total Rows: <strong className="text-white">{importRows.length}</strong>
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to Import: {validRowCount}
                </span>
                {invalidRowCount > 0 && (
                  <span className="text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                    <XCircle className="w-3.5 h-3.5" />
                    Errors to Fix: {invalidRowCount}
                  </span>
                )}
              </div>

              {/* Import Mode Selector */}
              <div className="flex items-center gap-2 bg-[#121826] p-1 rounded-lg border border-[#243048]">
                <label className="text-[11px] text-slate-400 px-2 font-bold">Import Mode:</label>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    importMode === 'append'
                      ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Append (+ Add to Existing)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Replace Entire Roster
                </button>
              </div>
            </div>

            {/* Scrollable Editable Preview Table */}
            <div className="flex-1 overflow-auto p-4 sm:p-5 custom-scrollbar">
              <table className="w-full text-left text-xs font-mono border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#243048] text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 w-12 text-center">Status</th>
                    <th className="p-2.5 w-44">Name (نام) *</th>
                    <th className="p-2.5 w-44">Designation (عہدہ) *</th>
                    <th className="p-2.5 w-32">Department</th>
                    <th className="p-2.5 w-36">WhatsApp</th>
                    <th className="p-2.5">Assigned Territories (علاقے)</th>
                    <th className="p-2.5 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2234]">
                  {importRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        row.isValid
                          ? 'hover:bg-[#121827] bg-[#0C101A]'
                          : 'bg-rose-950/20 border-l-4 border-rose-500 hover:bg-rose-950/30'
                      }`}
                    >
                      {/* Status Icon */}
                      <td className="p-2.5 text-center">
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" title="Valid & Ready" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 mx-auto" title={row.errors.join(', ')} />
                        )}
                      </td>

                      {/* Name Input */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleUpdateImportRowField(row.id, 'name', e.target.value)}
                          placeholder="Required"
                          className={`w-full bg-[#151C2C] p-1.5 rounded border text-xs outline-none text-white ${
                            !row.name.trim() ? 'border-rose-500 bg-rose-950/40 text-rose-200' : 'border-[#283650] focus:border-amber-400'
                          }`}
                        />
                        {!row.name.trim() && (
                          <span className="text-[10px] text-rose-400 block mt-0.5 font-sans">Name is required</span>
                        )}
                      </td>

                      {/* Role Input */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.role}
                          onChange={(e) => handleUpdateImportRowField(row.id, 'role', e.target.value)}
                          placeholder="Required (e.g. Sales Lead)"
                          className={`w-full bg-[#151C2C] p-1.5 rounded border text-xs outline-none text-white ${
                            !row.role.trim() ? 'border-rose-500 bg-rose-950/40 text-rose-200' : 'border-[#283650] focus:border-amber-400'
                          }`}
                        />
                        {!row.role.trim() && (
                          <span className="text-[10px] text-rose-400 block mt-0.5 font-sans">Designation required</span>
                        )}
                      </td>

                      {/* Department Select */}
                      <td className="p-2.5">
                        <select
                          value={row.department}
                          onChange={(e) => handleUpdateImportRowField(row.id, 'department', e.target.value)}
                          className="w-full bg-[#151C2C] text-white p-1.5 rounded border border-[#283650] focus:border-amber-400 outline-none text-xs"
                        >
                          <option value="Management">Management</option>
                          <option value="Sales">Sales</option>
                          <option value="Logistics & Dispatch">Logistics & Dispatch</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Customer Service">Customer Service</option>
                        </select>
                      </td>

                      {/* WhatsApp Input */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.whatsappNumber}
                          onChange={(e) => handleUpdateImportRowField(row.id, 'whatsappNumber', e.target.value)}
                          placeholder="923001234567"
                          className="w-full bg-[#151C2C] text-emerald-300 p-1.5 rounded border border-[#283650] focus:border-emerald-400 outline-none text-xs"
                        />
                      </td>

                      {/* Territories Input */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.areasCovered.join(', ')}
                          onChange={(e) =>
                            handleUpdateImportRowField(
                              row.id,
                              'areasCovered',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="e.g. Lahore, Gujranwala, Sialkot"
                          className="w-full bg-[#151C2C] text-amber-300 p-1.5 rounded border border-[#283650] focus:border-amber-400 outline-none text-xs"
                        />
                      </td>

                      {/* Delete Row Button */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteImportRow(row.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Exclude this row from upload"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#121827] border-t border-[#222E46] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono text-slate-400">
                {invalidRowCount > 0 ? (
                  <span className="text-amber-400 font-bold">
                    ⚠️ Fix the {invalidRowCount} row(s) highlighted above or click trash to exclude them.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    ✓ All {validRowCount} member rows are valid and ready to import.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportRows([]);
                  }}
                  className="px-4 py-2 bg-[#1C2538] hover:bg-[#28354E] text-slate-300 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validRowCount === 0}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Import {validRowCount} Members to Team</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ✏️ ADD / EDIT MEMBER FORM DRAWER */}
      {/* ========================================================= */}
      {(isAddingNew || editingId) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-[#101522] border-2 border-amber-400/60 rounded-xl p-5 sm:p-7 shadow-2xl space-y-6 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-[#243048] pb-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-base sm:text-lg text-white">
                {isAddingNew ? 'Add New Team Member / Employee (نیا ملازم شامل کریں)' : `Edit Profile: ${name}`}
              </h4>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-[#1B2232] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {/* Full Name */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Full Name (انگریزی نام) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Haji Waqas Ahmed"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
            </div>

            {/* Urdu Name */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Urdu Name (اردو نام)
              </label>
              <input
                type="text"
                value={nameUrdu}
                onChange={(e) => setNameUrdu(e.target.value)}
                placeholder="مثال: حاجی وقاص احمد"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none font-sans"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Department (شعبہ) *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as TeamMember['department'])}
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              >
                <option value="Management">Management (انتظامیہ / CEO)</option>
                <option value="Sales">Sales & Consultant (سیلز ٹیم)</option>
                <option value="Logistics & Dispatch">Logistics & Dispatch Drivers (ڈسپیچ و ڈرائیورز)</option>
                <option value="Technical Support">Technical Support (ورکشاپ و انجینئرنگ)</option>
                <option value="Customer Service">Customer Service (کسٹمر کیئر)</option>
              </select>
            </div>

            {/* Role / Designation */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold text-amber-300 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Designation / Role (عہدہ) *</span>
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Chief Executive Officer (CEO) or Field Consultant"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-amber-400/50 focus:border-amber-400 outline-none"
              />
            </div>

            {/* Role Urdu */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Role in Urdu (عہدہ اردو میں)
              </label>
              <input
                type="text"
                value={roleUrdu}
                onChange={(e) => setRoleUrdu(e.target.value)}
                placeholder="مثال: چیف ایگزیکٹو آفیسر یا فلیٹ ڈرائیور"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none font-sans"
              />
            </div>

            {/* Badge / Tag */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Badge / Tag (ٹیگ)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Founder & CEO, Senior Sales, Express Driver"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold text-emerald-400 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-400" />
                <span>WhatsApp Number (بغیر 0 یا + کے) *</span>
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="923001234567"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-emerald-400 outline-none"
              />
            </div>

            {/* Phone Display */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Phone Display (کال نمبر)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Email Address (ای میل)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@rawaltools.com"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* ======================================================= */}
          {/* 📍 ASSIGNED TERRITORIES (دائرہ کار و علاقے) CHIP MANAGER */}
          {/* ======================================================= */}
          <div className="p-4 rounded-xl bg-[#0D121D] border border-[#222E44] space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-slate-200 font-bold flex items-center gap-1.5 text-amber-400">
                <MapPin className="w-4 h-4" />
                <span>Assigned Territories / Covered Routes (کور کیے جانے والے دائرہ کار و علاقے)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {areas.length} Territories Assigned
              </span>
            </div>

            {/* Active Territory Chips */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg bg-[#141A29] border border-[#243048]">
              {areas.length === 0 ? (
                <span className="text-slate-500 italic text-[11px] py-1">
                  No specific territories assigned yet (Will default to "All Pakistan").
                </span>
              ) : (
                areas.map((terr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/40 text-xs font-bold font-mono group"
                  >
                    <span>{terr}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerritory(idx)}
                      className="text-amber-400 hover:text-white group-hover:bg-amber-400/20 p-0.5 rounded transition-colors"
                      title="Remove territory"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Custom Territory Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={territoryInput}
                onChange={(e) => setTerritoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTerritory();
                  }
                }}
                placeholder="Type a city or industrial zone and press Enter (e.g. Lahore Industrial Estate, Gujranwala, Sialkot)..."
                className="flex-1 bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTerritory}
                className="px-4 py-2.5 bg-[#1F293D] hover:bg-[#2B3954] text-amber-300 font-bold border border-[#344666] rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Territory</span>
              </button>
            </div>

            {/* Quick Suggested Territory Chips */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Quick Select Popular Pakistan Industrial Hubs (فوری انتخاب کریں):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TERRITORIES.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestedTerritory(sug)}
                    className="text-[11px] font-mono px-2 py-1 bg-[#141A28] hover:bg-[#1E273A] text-slate-300 hover:text-amber-300 border border-[#253147] hover:border-amber-400/50 rounded transition-colors cursor-pointer"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Languages & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1 font-bold flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-sky-400" />
                <span>Languages Spoken (زبانیں)</span>
              </label>
              <input
                type="text"
                value={languagesInput}
                onChange={(e) => setLanguagesInput(e.target.value)}
                placeholder="Urdu, Punjabi, English"
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">
                Experience in Years (تجربہ سال)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* ======================================================= */}
          {/* 📷 PHOTO UPLOAD & PRESET AVATARS */}
          {/* ======================================================= */}
          <div className="text-xs font-mono space-y-2.5 p-4 rounded-xl bg-[#0D121D] border border-[#222E44]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-slate-200 font-bold flex items-center gap-1.5 text-amber-400">
                <Upload className="w-4 h-4" />
                <span>Team Member Photo / Avatar (تصویر اپلوڈ یا لنک)</span>
              </label>
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-lg text-xs transition-all cursor-pointer shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingPhoto ? 'Compressing...' : 'Upload Photo (Auto-Compress)'}</span>
              </button>
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="hidden"
              />
            </div>

            {photoCompressionStatus && (
              <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{photoCompressionStatus}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={photoUrl || PRESET_AVATARS[0]}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', PRESET_AVATARS[0]);
                  }}
                />
              </div>

              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or uploaded photo data"
                className="flex-1 bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none text-xs"
              />
            </div>

            {/* Preset Avatar Selector */}
            <div className="pt-2 border-t border-[#1C2538]">
              <span className="text-[11px] text-slate-400 block mb-1.5">Or Choose from Professional Preset Avatars:</span>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(avatar)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      photoUrl === avatar ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-400/50' : 'border-[#26334D] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Short Bio */}
          <div className="text-xs font-mono">
            <label className="block text-slate-300 mb-1 font-bold">
              Bio / Expertise Description (مختصر تفصیل و مہارت)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Specialist in heavy industrial machinery, rotary tools, warranty repair, and customer quotations..."
              className="w-full bg-[#161C2B] text-white p-2.5 rounded-lg border border-[#2B374E] focus:border-amber-400 outline-none font-sans"
            />
          </div>

          {/* Active / Available Switch */}
          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            <input
              type="checkbox"
              id="isAvailableCheck"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-amber-400 cursor-pointer"
            />
            <label htmlFor="isAvailableCheck" className="text-slate-300 cursor-pointer">
              Active & Available for direct client contact (فعال اور آن لائن)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#243048]">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-5 py-2.5 bg-[#1C2436] hover:bg-[#253048] text-slate-300 text-xs font-mono rounded-lg transition-colors cursor-pointer"
            >
              Cancel (منسوخ کریں)
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isAddingNew ? 'Save New Member' : 'Update Member Details'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* 👥 STAFF ROSTER & MANAGEMENT TABLE */}
      {/* ========================================================= */}
      <div className="bg-[#0C1018] border border-[#21293B] rounded-xl overflow-hidden shadow-lg space-y-0">
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 bg-[#101520] border-b border-[#1E2638] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span>Team Members Roster ({teamMembers.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              (Click designation to quick edit)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, territory..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-[#141A28] text-white rounded-lg border border-[#253147] focus:border-amber-400 outline-none font-mono"
              />
            </div>

            {/* Department filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-[#141A28] text-slate-300 rounded-lg border border-[#253147] focus:border-amber-400 outline-none font-mono"
            >
              <option value="All">All Departments</option>
              <option value="Management">Management</option>
              <option value="Sales">Sales</option>
              <option value="Logistics & Dispatch">Logistics & Dispatch</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Customer Service">Customer Service</option>
            </select>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-[11px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer p-1.5 bg-[#141A28] rounded-lg border border-[#253147]"
              title="Reset to initial default staff list"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Member list */}
        <div className="divide-y divide-[#1B2334]">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 p-4 text-slate-400 font-mono text-xs">
              No team members match the search query "{searchQuery}".
            </div>
          ) : (
            filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className="p-4 hover:bg-[#111624] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
              >
                {/* Member Profile info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 text-slate-500 shrink-0">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1 hover:text-amber-400 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === teamMembers.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1 hover:text-amber-400 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Avatar */}
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#2B374E] shrink-0 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', PRESET_AVATARS[0]);
                    }}
                  />

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{member.name}</span>
                      {member.nameUrdu && (
                        <span className="text-amber-400 text-xs font-sans">({member.nameUrdu})</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded">
                        {member.badge || member.department}
                      </span>
                      {member.isAvailable !== false ? (
                        <span className="text-[10px] text-emerald-400 font-bold">● Active</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">○ Offline</span>
                      )}
                    </div>

                    {/* Inline Designation & Role Display / Edit */}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {inlineEditingId === member.id ? (
                        <div className="flex items-center gap-1.5 bg-[#172033] p-1 rounded-lg border border-amber-400/60 shadow-md">
                          <input
                            type="text"
                            value={inlineRoleValue}
                            onChange={(e) => setInlineRoleValue(e.target.value)}
                            placeholder="Designation (English)"
                            className="bg-[#0E1422] text-white px-2 py-1 rounded text-xs outline-none border border-[#2C3B58] focus:border-amber-400"
                          />
                          <input
                            type="text"
                            value={inlineRoleUrduValue}
                            onChange={(e) => setInlineRoleUrduValue(e.target.value)}
                            placeholder="عہدہ (اردو)"
                            className="bg-[#0E1422] text-amber-300 px-2 py-1 rounded text-xs outline-none border border-[#2C3B58] focus:border-amber-400 font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineRole(member.id)}
                            className="p-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded font-bold cursor-pointer"
                            title="Save Designation"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditingId(null)}
                            className="p-1 bg-[#26334D] hover:bg-[#344666] text-slate-300 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-sans text-xs">
                            <strong className="text-amber-300/90 font-mono">Role:</strong> {member.role}{' '}
                            {member.roleUrdu ? `• ${member.roleUrdu}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineEditingId(member.id);
                              setInlineRoleValue(member.role);
                              setInlineRoleUrduValue(member.roleUrdu || '');
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-0.5 cursor-pointer"
                            title="Click to edit role/designation"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit Role</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp & Territories */}
                    <div className="text-slate-400 text-[11px] mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <MessageCircle className="w-3 h-3 fill-emerald-400" />
                        +{cleanWhatsAppNumber(member.whatsappNumber)}
                      </span>

                      {member.areasCovered && member.areasCovered.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-slate-400">Territories:</span>
                          {member.areasCovered.map((a, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 bg-[#1A2234] border border-[#2B3854] text-amber-300 rounded text-[10px]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(member.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Test WhatsApp Direct Link"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(member)}
                    className="p-2 bg-[#1A2234] hover:bg-[#26334D] text-slate-200 border border-[#2D3B58] rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Edit full profile"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

