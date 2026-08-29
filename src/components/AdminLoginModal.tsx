import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  X, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Shield 
} from 'lucide-react';
import { StoreSettings, AdminAccountsConfig, AdminRole } from '../types';
import { 
  setStoredAdminAuthenticated, 
  loadStoredAdminAccounts, 
  setStoredActiveAdminRole, 
  authenticateAdminCredentials 
} from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role?: AdminRole) => void;
  settings: StoreSettings;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings,
}) => {
  if (!isOpen) return null;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [adminAccounts, setAdminAccounts] = useState<AdminAccountsConfig>(() => loadStoredAdminAccounts());

  useEffect(() => {
    const loaded = loadStoredAdminAccounts();
    // Synchronize Super Admin PIN with settings.adminPin if present
    if (settings.adminPin && settings.adminPin.trim() !== loaded.superAdmin.pin) {
      loaded.superAdmin.pin = settings.adminPin.trim();
    }
    setAdminAccounts(loaded);
  }, [settings.adminPin, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Please enter your Admin PIN or password.');
      return;
    }

    // Auto-detect authentication across Super Admin, Sub Admin 1, and Sub Admin 2
    const authResult = authenticateAdminCredentials(trimmed, adminAccounts);

    if (authResult.success && authResult.role) {
      setError('');
      setPassword('');
      setStoredAdminAuthenticated(true);
      setStoredActiveAdminRole(authResult.role);
      onSuccess(authResult.role);
    } else {
      setError(authResult.error || 'Invalid PIN / Password. Please check your credentials and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div 
        id="admin-login-dialog"
        className="bg-[#0D111A] border border-[#26334A] rounded-xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-[#F5F5F5] relative font-sans"
      >
        {/* Close Button */}
        <button
          id="close-admin-login"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white bg-[#141A26] border border-[#222E42] transition-colors rounded-lg cursor-pointer"
          title="Close Login Window"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2.5 pt-1">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-amber-400 font-bold">
              AUTHORIZED ACCESS ONLY
            </span>
            <h3 className="text-2xl font-serif-editorial italic text-white leading-tight">
              Rawal Tools Admin Panel
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            Enter your secure administrator PIN or password to access store management.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-5 font-mono">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                Admin PIN / Master Password
              </label>
            </div>
            
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter PIN or Password..."
                className="w-full bg-[#131926] text-sm font-mono text-[#F5F5F5] placeholder-slate-600 pl-10 pr-11 py-3 rounded-lg border border-[#2D3950] focus:border-amber-400 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono mt-2.5 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              id="submit-admin-login"
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-widest py-3.5 rounded-lg font-mono transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-[11px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider py-1 cursor-pointer"
            >
              Cancel & Return to Store
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="pt-4 mt-3 border-t border-[#1C2538] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Authentication</span>
          </div>
          <span className="text-amber-400/80">Rawal Tools Industrial</span>
        </div>
      </div>
    </div>
  );
};
