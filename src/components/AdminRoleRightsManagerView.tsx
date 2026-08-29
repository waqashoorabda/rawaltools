import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Key, 
  Users, 
  UserCheck, 
  UserX, 
  Crown, 
  CheckSquare, 
  Square, 
  Sparkles, 
  RotateCcw, 
  Save, 
  Info, 
  Layers, 
  Sliders, 
  ArrowRight,
  Package,
  BookOpen,
  Image as ImageIcon,
  Settings,
  Megaphone,
  Layout,
  Palette,
  Code2,
  BarChart3,
  Download,
  PlusCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AdminAccount, AdminAccountsConfig, AdminPermission, AdminRole } from '../types';
import { 
  ALL_PERMISSIONS, 
  DEFAULT_SUB_ADMIN_1_PERMISSIONS, 
  DEFAULT_SUB_ADMIN_2_PERMISSIONS,
  SUPER_ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_ACCOUNTS,
  PermissionDefinition 
} from '../data/defaultAdminAccounts';
import { 
  loadStoredAdminAccounts, 
  saveStoredAdminAccounts, 
  getStoredActiveAdminRole 
} from '../utils/storage';

interface AdminRoleRightsManagerViewProps {
  // Primary prop names
  adminAccounts?: AdminAccountsConfig;
  onSaveAdminAccounts?: (updated: AdminAccountsConfig) => void;
  activeRole?: AdminRole;
  onSwitchActiveRole?: (role: AdminRole) => void;
  // Aliases for compatibility
  accountsConfig?: AdminAccountsConfig;
  onUpdateAccounts?: (updated: AdminAccountsConfig) => void;
  currentRole?: AdminRole;
  onSwitchRole?: (role: AdminRole) => void;
}

export const AdminRoleRightsManagerView: React.FC<AdminRoleRightsManagerViewProps> = ({
  adminAccounts,
  onSaveAdminAccounts,
  activeRole,
  onSwitchActiveRole,
  accountsConfig,
  onUpdateAccounts,
  currentRole,
  onSwitchRole,
}) => {
  const [selectedTab, setSelectedTab] = useState<'sub_admin_1' | 'sub_admin_2' | 'super_admin' | 'overview'>('sub_admin_1');
  
  // Resolve effective props
  const effectiveConfig = accountsConfig || adminAccounts || loadStoredAdminAccounts();
  const effectiveSaveHandler = onUpdateAccounts || onSaveAdminAccounts || ((updated: AdminAccountsConfig) => saveStoredAdminAccounts(updated));
  const effectiveActiveRole = currentRole || activeRole || getStoredActiveAdminRole();
  const effectiveSwitchRoleHandler = onSwitchRole || onSwitchActiveRole;

  const [config, setConfig] = useState<AdminAccountsConfig>(() => {
    const base = effectiveConfig || loadStoredAdminAccounts();
    return {
      superAdmin: { ...DEFAULT_ADMIN_ACCOUNTS.superAdmin, ...(base?.superAdmin || {}) },
      subAdmin1: { ...DEFAULT_ADMIN_ACCOUNTS.subAdmin1, ...(base?.subAdmin1 || {}) },
      subAdmin2: { ...DEFAULT_ADMIN_ACCOUNTS.subAdmin2, ...(base?.subAdmin2 || {}) },
    };
  });
  
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if external props change
  React.useEffect(() => {
    if (accountsConfig || adminAccounts) {
      const base = accountsConfig || adminAccounts || loadStoredAdminAccounts();
      setConfig({
        superAdmin: { ...DEFAULT_ADMIN_ACCOUNTS.superAdmin, ...(base?.superAdmin || {}) },
        subAdmin1: { ...DEFAULT_ADMIN_ACCOUNTS.subAdmin1, ...(base?.subAdmin1 || {}) },
        subAdmin2: { ...DEFAULT_ADMIN_ACCOUNTS.subAdmin2, ...(base?.subAdmin2 || {}) },
      });
    }
  }, [accountsConfig, adminAccounts]);

  const togglePinVisibility = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTogglePermission = (targetAdmin: 'subAdmin1' | 'subAdmin2', perm: AdminPermission) => {
    setConfig((prev) => {
      const currentPerms = prev[targetAdmin].permissions;
      const exists = currentPerms.includes(perm);
      const updatedPerms = exists 
        ? currentPerms.filter((p) => p !== perm) 
        : [...currentPerms, perm];

      return {
        ...prev,
        [targetAdmin]: {
          ...prev[targetAdmin],
          permissions: updatedPerms,
        },
      };
    });
  };

  const handleToggleAllPermissions = (targetAdmin: 'subAdmin1' | 'subAdmin2', selectAll: boolean) => {
    setConfig((prev) => ({
      ...prev,
      [targetAdmin]: {
        ...prev[targetAdmin],
        permissions: selectAll ? ALL_PERMISSIONS.map((p) => p.id) : [],
      },
    }));
  };

  const handleApplyPreset = (targetAdmin: 'subAdmin1' | 'subAdmin2', preset: 'catalog' | 'marketing' | 'readonly') => {
    let perms: AdminPermission[] = [];
    if (preset === 'catalog') {
      perms = [...DEFAULT_SUB_ADMIN_1_PERMISSIONS];
    } else if (preset === 'marketing') {
      perms = [...DEFAULT_SUB_ADMIN_2_PERMISSIONS];
    } else if (preset === 'readonly') {
      perms = ['analytics'];
    }

    setConfig((prev) => ({
      ...prev,
      [targetAdmin]: {
        ...prev[targetAdmin],
        permissions: perms,
      },
    }));
  };

  const handleUpdateAdminField = (
    targetAdmin: 'superAdmin' | 'subAdmin1' | 'subAdmin2',
    field: keyof AdminAccount,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [targetAdmin]: {
        ...prev[targetAdmin],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = () => {
    if (effectiveSaveHandler) {
      effectiveSaveHandler(config);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const getPermissionIcon = (permId: AdminPermission) => {
    switch (permId) {
      case 'manage_products':
        return <Package className="w-4 h-4 text-amber-400" />;
      case 'add_edit_products':
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'media_library':
        return <ImageIcon className="w-4 h-4 text-blue-400" />;
      case 'blog_cms':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'store_settings':
        return <Settings className="w-4 h-4 text-orange-400" />;
      case 'team_manager':
        return <Users className="w-4 h-4 text-teal-400" />;
      case 'ads_manager':
        return <Megaphone className="w-4 h-4 text-rose-400" />;
      case 'page_editor':
        return <Layout className="w-4 h-4 text-indigo-400" />;
      case 'branding_theme':
        return <Palette className="w-4 h-4 text-pink-400" />;
      case 'custom_js':
        return <Code2 className="w-4 h-4 text-yellow-400" />;
      case 'analytics':
        return <BarChart3 className="w-4 h-4 text-cyan-400" />;
      case 'export_import_reset':
        return <Download className="w-4 h-4 text-slate-300" />;
      default:
        return <Shield className="w-4 h-4 text-amber-400" />;
    }
  };

  // Group permissions for organized display
  const permissionCategories = [
    {
      category: 'CATALOG & MEDIA' as const,
      label: '📦 Catalog, Tools & Media',
      labelUrdu: 'کیٹلاگ، پراڈکٹس اور میڈیا',
      items: ALL_PERMISSIONS.filter((p) => p.category === 'CATALOG & MEDIA'),
    },
    {
      category: 'STORE & MARKETING' as const,
      label: '🏪 Store, WhatsApp & Ads',
      labelUrdu: 'اسٹور، واٹس ایپ اور اشتہارات',
      items: ALL_PERMISSIONS.filter((p) => p.category === 'STORE & MARKETING'),
    },
    {
      category: 'SITE DESIGN & CODE' as const,
      label: '🎨 Design, Themes & Code',
      labelUrdu: 'ڈیزائن، تھیمز اور کوڈنگ',
      items: ALL_PERMISSIONS.filter((p) => p.category === 'SITE DESIGN & CODE'),
    },
    {
      category: 'REPORTS & DATA' as const,
      label: '📊 Analytics & Database',
      labelUrdu: 'رپورٹس اور ڈیٹا بیس',
      items: ALL_PERMISSIONS.filter((p) => p.category === 'REPORTS & DATA'),
    },
  ];

  const currentAdminKey = selectedTab === 'sub_admin_1' ? 'subAdmin1' : selectedTab === 'sub_admin_2' ? 'subAdmin2' : 'superAdmin';
  const currentAccount = config[currentAdminKey];

  return (
    <div className="p-4 sm:p-6 space-y-6 font-mono text-slate-100 max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#171424] via-[#101524] to-[#0D121F] border border-[#2D3852] p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-white font-sans">
                Admin Role & Permissions Control
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                Super Admin Access Only
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Manage Sub Admin accounts, assign module-level rights with checkboxes, customize PINs, and grant granular functionality access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-5 py-2.5 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer font-sans text-xs uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            <span>Save All Permissions</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-3.5 rounded-lg flex items-center gap-2.5 text-xs text-emerald-200 animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">
            All Admin Roles and checkbox permissions updated & saved successfully!
          </span>
        </div>
      )}

      {/* Role Navigation Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        
        {/* Tab: Overview */}
        <button
          type="button"
          onClick={() => setSelectedTab('overview')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            selectedTab === 'overview'
              ? 'bg-[#182133] border-amber-400/60 ring-1 ring-amber-400/30 shadow-md'
              : 'bg-[#10141E] border-[#222B3D] hover:bg-[#151B29] text-slate-400'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-sans">Roles Matrix</div>
            <div className="text-[10px] text-slate-400">All 3 Accounts Overview</div>
          </div>
        </button>

        {/* Tab: Sub Admin 1 */}
        <button
          type="button"
          onClick={() => setSelectedTab('sub_admin_1')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
            selectedTab === 'sub_admin_1'
              ? 'bg-[#182133] border-amber-400/60 ring-1 ring-amber-400/30 shadow-md'
              : 'bg-[#10141E] border-[#222B3D] hover:bg-[#151B29] text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              config.subAdmin1.isActive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white font-sans truncate">
                {config.subAdmin1.name || 'Sub Admin 1'}
              </div>
              <div className="text-[10px] text-blue-300 font-mono">
                {config.subAdmin1.permissions.length} Rights Assigned
              </div>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.subAdmin1.isActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </button>

        {/* Tab: Sub Admin 2 */}
        <button
          type="button"
          onClick={() => setSelectedTab('sub_admin_2')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
            selectedTab === 'sub_admin_2'
              ? 'bg-[#182133] border-amber-400/60 ring-1 ring-amber-400/30 shadow-md'
              : 'bg-[#10141E] border-[#222B3D] hover:bg-[#151B29] text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              config.subAdmin2.isActive ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white font-sans truncate">
                {config.subAdmin2.name || 'Sub Admin 2'}
              </div>
              <div className="text-[10px] text-purple-300 font-mono">
                {config.subAdmin2.permissions.length} Rights Assigned
              </div>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.subAdmin2.isActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </button>

        {/* Tab: Super Admin */}
        <button
          type="button"
          onClick={() => setSelectedTab('super_admin')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
            selectedTab === 'super_admin'
              ? 'bg-[#182133] border-amber-400/60 ring-1 ring-amber-400/30 shadow-md'
              : 'bg-[#10141E] border-[#222B3D] hover:bg-[#151B29] text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white font-sans truncate">
                {config.superAdmin.name || 'Super Admin'}
              </div>
              <div className="text-[10px] text-amber-300 font-mono">
                Master Full Access
              </div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        </button>

      </div>

      {/* VIEW 1: Roles Matrix & Quick Summary */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Super Admin Card */}
            <div className="bg-[#111724] border border-amber-400/40 rounded-xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Role: Super Admin
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded font-bold">
                  Owner Level
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-white font-sans">{config.superAdmin.name}</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">{config.superAdmin.notes}</p>
              </div>

              <div className="bg-[#0B0F17] p-3 rounded-lg border border-[#1E2638] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Login PIN:</span>
                  <span className="font-bold text-amber-300">{config.superAdmin.pin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Granted Rights:</span>
                  <span className="text-emerald-400 font-bold">All 12 Modules (100%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sub Admin Manager:</span>
                  <span className="text-amber-400 font-bold">Enabled</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTab('super_admin')}
                className="w-full py-2 bg-[#162033] hover:bg-[#1E2B45] text-amber-300 text-xs font-bold rounded-lg border border-amber-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Edit Super Admin Info</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub Admin 1 Card */}
            <div className={`bg-[#111724] border rounded-xl p-5 space-y-4 ${
              config.subAdmin1.isActive ? 'border-blue-500/40' : 'border-slate-800 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Role: Sub Admin 1
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  config.subAdmin1.isActive 
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}>
                  {config.subAdmin1.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-white font-sans">{config.subAdmin1.name}</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">{config.subAdmin1.notes || 'Sub admin assigned to catalog management.'}</p>
              </div>

              <div className="bg-[#0B0F17] p-3 rounded-lg border border-[#1E2638] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Login PIN:</span>
                  <span className="font-bold text-blue-300">{config.subAdmin1.pin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Module Permissions:</span>
                  <span className="text-blue-300 font-bold">{config.subAdmin1.permissions.length} of {ALL_PERMISSIONS.length} Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Access Scope:</span>
                  <span className="text-slate-200">Catalog & Blog Content</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTab('sub_admin_1')}
                  className="flex-1 py-2 bg-[#162033] hover:bg-[#1E2B45] text-blue-300 text-xs font-bold rounded-lg border border-blue-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Manage Checkboxes</span>
                </button>

                {effectiveSwitchRoleHandler && (
                  <button
                    type="button"
                    onClick={() => effectiveSwitchRoleHandler('sub_admin_1')}
                    className="px-3 py-2 bg-[#141824] hover:bg-[#1F2638] text-slate-300 hover:text-white text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="Preview dashboard view as Sub Admin 1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub Admin 2 Card */}
            <div className={`bg-[#111724] border rounded-xl p-5 space-y-4 ${
              config.subAdmin2.isActive ? 'border-purple-500/40' : 'border-slate-800 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Role: Sub Admin 2
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  config.subAdmin2.isActive 
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}>
                  {config.subAdmin2.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-white font-sans">{config.subAdmin2.name}</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">{config.subAdmin2.notes || 'Sub admin assigned to store operations & ads.'}</p>
              </div>

              <div className="bg-[#0B0F17] p-3 rounded-lg border border-[#1E2638] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Login PIN:</span>
                  <span className="font-bold text-purple-300">{config.subAdmin2.pin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Module Permissions:</span>
                  <span className="text-purple-300 font-bold">{config.subAdmin2.permissions.length} of {ALL_PERMISSIONS.length} Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Access Scope:</span>
                  <span className="text-slate-200">Marketing & Store Info</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTab('sub_admin_2')}
                  className="flex-1 py-2 bg-[#162033] hover:bg-[#1E2B45] text-purple-300 text-xs font-bold rounded-lg border border-purple-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Manage Checkboxes</span>
                </button>

                {effectiveSwitchRoleHandler && (
                  <button
                    type="button"
                    onClick={() => effectiveSwitchRoleHandler('sub_admin_2')}
                    className="px-3 py-2 bg-[#141824] hover:bg-[#1F2638] text-slate-300 hover:text-white text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="Preview dashboard view as Sub Admin 2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Quick Matrix Comparison Table */}
          <div className="bg-[#101522] border border-[#232D42] rounded-xl overflow-hidden shadow-md">
            <div className="p-4 bg-[#141A2A] border-b border-[#232D42] flex items-center justify-between">
              <h4 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Feature & Permission Matrix Comparison</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">Real-time Permission Map</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0D121D] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#232D42]">
                  <tr>
                    <th className="p-3.5 pl-5">Application Feature / Module</th>
                    <th className="p-3.5 text-center text-amber-400">👑 Super Admin</th>
                    <th className="p-3.5 text-center text-blue-400">🛡️ {config.subAdmin1.name}</th>
                    <th className="p-3.5 text-center text-purple-400">🛡️ {config.subAdmin2.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D2536]">
                  {ALL_PERMISSIONS.map((perm) => {
                    const hasSub1 = config.subAdmin1.permissions.includes(perm.id);
                    const hasSub2 = config.subAdmin2.permissions.includes(perm.id);

                    return (
                      <tr key={perm.id} className="hover:bg-[#141A28] transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded bg-[#161E2D]">
                              {getPermissionIcon(perm.id)}
                            </div>
                            <div>
                              <div className="font-bold text-white font-sans">{perm.label}</div>
                              <div className="text-[10px] text-slate-400">{perm.labelUrdu} • {perm.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {hasSub1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-400">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {hasSub2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-400">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Sub Admin 1 or Sub Admin 2 Configuration with Checkboxes */}
      {(selectedTab === 'sub_admin_1' || selectedTab === 'sub_admin_2') && (
        <div className="space-y-6">
          
          {/* Sub Admin Profile & Credentials Card */}
          <div className="bg-[#101522] border border-[#253046] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#20293C]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  selectedTab === 'sub_admin_1' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white font-sans">
                    {selectedTab === 'sub_admin_1' ? 'Sub Admin 1 Account & Credentials' : 'Sub Admin 2 Account & Credentials'}
                  </h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Set display name, access status, and login PIN for this sub administrator.
                  </p>
                </div>
              </div>

              {/* Active / Inactive Toggle */}
              <div className="flex items-center gap-3 bg-[#161D2B] p-1.5 rounded-lg border border-[#26334A]">
                <span className="text-xs text-slate-300 font-bold px-2">Account Status:</span>
                <button
                  type="button"
                  onClick={() => handleUpdateAdminField(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'isActive', !currentAccount.isActive)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentAccount.isActive
                      ? 'bg-emerald-500 text-black shadow'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {currentAccount.isActive ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-black" />
                      <span>Active (Enabled)</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Disabled (Locked)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Admin Name / Role Title *
                </label>
                <input
                  type="text"
                  value={currentAccount.name}
                  onChange={(e) => handleUpdateAdminField(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'name', e.target.value)}
                  placeholder="e.g. Sub Admin 1 (Catalog Manager)"
                  className="w-full bg-[#151B28] text-white px-3.5 py-2.5 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Urdu Title (اردو نام)
                </label>
                <input
                  type="text"
                  value={currentAccount.nameUrdu || ''}
                  onChange={(e) => handleUpdateAdminField(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'nameUrdu', e.target.value)}
                  placeholder="e.g. سب ایڈمن 1 (کیٹلاگ مینیجر)"
                  className="w-full bg-[#151B28] text-white px-3.5 py-2.5 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Login PIN / Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPins[selectedTab] ? 'text' : 'password'}
                    value={currentAccount.pin}
                    onChange={(e) => handleUpdateAdminField(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'pin', e.target.value)}
                    placeholder="Enter PIN..."
                    className="w-full bg-[#151B28] text-white pl-9 pr-10 py-2.5 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => togglePinVisibility(selectedTab)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showPins[selectedTab] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Email Address / Contact
                </label>
                <input
                  type="email"
                  value={currentAccount.email || ''}
                  onChange={(e) => handleUpdateAdminField(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'email', e.target.value)}
                  placeholder="admin@rawaltools.com"
                  className="w-full bg-[#151B28] text-white px-3.5 py-2 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Assigned Responsibilities / Notes
                </label>
                <input
                  type="text"
                  value={currentAccount.notes || ''}
                  onChange={(e) => handleUpdateAdminField(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'notes', e.target.value)}
                  placeholder="Brief summary of duties..."
                  className="w-full bg-[#151B28] text-white px-3.5 py-2 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Granular Permission Checkboxes Section */}
          <div className="bg-[#101522] border border-[#253046] rounded-xl p-5 space-y-5">
            
            {/* Header with Preset Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#20293C]">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-white font-sans">
                    App Functionality Rights & Checkboxes
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedTab === 'sub_admin_1' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {currentAccount.permissions.length} of {ALL_PERMISSIONS.length} Enabled
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Check or uncheck the specific capabilities that {currentAccount.name || 'this sub admin'} is allowed to see and manage.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggleAllPermissions(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', true)}
                  className="px-2.5 py-1 rounded bg-[#162033] hover:bg-[#1E2B45] text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  ✓ Select All (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllPermissions(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', false)}
                  className="px-2.5 py-1 rounded bg-[#162033] hover:bg-[#1E2B45] text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕ Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'catalog')}
                  className="px-2.5 py-1 rounded bg-[#14223A] hover:bg-blue-900/40 text-blue-300 border border-blue-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  🛠️ Catalog Preset
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', 'marketing')}
                  className="px-2.5 py-1 rounded bg-[#231733] hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  📣 Marketing Preset
                </button>
              </div>
            </div>

            {/* Categorized Checkbox Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {permissionCategories.map((group) => (
                <div key={group.category} className="bg-[#0D121D] border border-[#20293D] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                    <span className="font-bold text-xs text-white font-sans">{group.label}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{group.labelUrdu}</span>
                  </div>

                  <div className="space-y-2.5">
                    {group.items.map((item) => {
                      const isChecked = currentAccount.permissions.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleTogglePermission(selectedTab === 'sub_admin_1' ? 'subAdmin1' : 'subAdmin2', item.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-3 ${
                            isChecked
                              ? 'bg-[#151D2C] border-amber-400/50 ring-1 ring-amber-400/20'
                              : 'bg-[#111622] border-[#20293A] hover:bg-[#141A28] opacity-75'
                          }`}
                        >
                          <div className="mt-0.5 text-amber-400">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-white font-sans">
                                {getPermissionIcon(item.id)}
                                <span>{item.label}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans">{item.labelUrdu}</span>
                            </div>

                            <p className="text-[11px] text-slate-400 font-sans leading-snug">
                              {item.description}
                            </p>

                            <div className="pt-0.5 flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-slate-500">Access Key:</span>
                              <code className="text-amber-300/80 bg-black/30 px-1.5 py-0.2 rounded">
                                {item.id}
                              </code>
                              {isChecked ? (
                                <span className="text-emerald-400 font-bold ml-auto">✓ Authorized</span>
                              ) : (
                                <span className="text-rose-400 font-semibold ml-auto">✕ Restricted</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#20293C]">
              <div className="text-xs text-slate-400 font-sans">
                💡 Changes are applied immediately to navigation bars and security filters for this Sub Admin.
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-5 py-2.5 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer font-sans text-xs uppercase"
              >
                <Save className="w-4 h-4" />
                <span>Save Rights for {currentAccount.name}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: Super Admin Configuration */}
      {selectedTab === 'super_admin' && (
        <div className="bg-[#101522] border border-amber-400/40 rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#20293C]">
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white font-sans">
                Super Admin (Master Controller Profile)
              </h4>
              <p className="text-xs text-slate-400 font-sans">
                Super Admin holds unconditional authority to manage all store parameters and grant rights.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Super Admin Name *
              </label>
              <input
                type="text"
                value={config.superAdmin.name}
                onChange={(e) => handleUpdateAdminField('superAdmin', 'name', e.target.value)}
                className="w-full bg-[#151B28] text-white px-3.5 py-2.5 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Urdu Title (اردو نام)
              </label>
              <input
                type="text"
                value={config.superAdmin.nameUrdu || ''}
                onChange={(e) => handleUpdateAdminField('superAdmin', 'nameUrdu', e.target.value)}
                className="w-full bg-[#151B28] text-white px-3.5 py-2.5 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Super Admin PIN / Password *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPins.superAdmin ? 'text' : 'password'}
                  value={config.superAdmin.pin}
                  onChange={(e) => handleUpdateAdminField('superAdmin', 'pin', e.target.value)}
                  className="w-full bg-[#151B28] text-white pl-9 pr-10 py-2.5 rounded border border-[#2D3950] focus:border-amber-400 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => togglePinVisibility('superAdmin')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPins.superAdmin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F17] p-4 rounded-xl border border-amber-400/20 space-y-2 text-xs font-sans">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Super Admin Security Rules:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              - The Super Admin cannot be disabled or stripped of rights.
              <br />
              - Only the Super Admin can view this Role Management tab and toggle permissions for Sub Admin 1 and Sub Admin 2.
              <br />
              - Changing the Super Admin PIN here automatically synchronizes with the main store dispatch password.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-6 py-2.5 rounded-lg transition-all shadow-md cursor-pointer font-sans text-xs uppercase"
            >
              <Save className="w-4 h-4" />
              <span>Save Super Admin Profile</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
