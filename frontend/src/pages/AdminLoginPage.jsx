import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import adminDashboardBg from '../assets/admin_dashboard_bg.jpg';
import { loginAdmin, getAdminSetupStatus, firstTimeAdminSetup } from '../services/api';

export default function AdminLoginPage({
  currentUser = null,
  onLogout,
  onLoginSuccess,
  onNavigate
}) {
  const [adminLoginId, setAdminLoginId] = useState('admin@jansamadhanadmin');
  const [adminName, setAdminName] = useState('Central Administrator');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'setup'
  const [isConfigured, setIsConfigured] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check whether Admin account is configured
  useEffect(() => {
    let isMounted = true;
    getAdminSetupStatus()
      .then((status) => {
        if (isMounted) {
          const configured = !!status.is_configured;
          setIsConfigured(configured);
          setMode(configured ? 'login' : 'setup');
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsConfigured(true);
          setMode('login');
        }
      })
      .finally(() => {
        if (isMounted) setCheckingSetup(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanId = adminLoginId.trim().toLowerCase();
    const cleanPw = adminPassword.trim();

    if (!cleanId) {
      setErrorMessage('Please enter the Admin Login ID (e.g. admin@jansamadhanadmin).');
      return;
    }

    if (!cleanPw) {
      setErrorMessage('Please enter the Admin confidential password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin({
        loginId: cleanId,
        password: cleanPw
      });

      setSuccessMessage(`Administrative access granted. Welcome, ${res.user.name || 'Administrator'}!`);
      setTimeout(() => {
        onLoginSuccess(res.user, 'admin');
      }, 350);
    } catch (err) {
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your Admin Login ID and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanId = adminLoginId.trim().toLowerCase();
    const cleanPw = adminPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanId) {
      setErrorMessage('Please enter an Admin Login ID (e.g. admin@jansamadhanadmin).');
      return;
    }

    if (cleanPw.length < 6) {
      setErrorMessage('Admin Password must be at least 6 characters in length.');
      return;
    }

    if (cleanPw !== cleanConfirm) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await firstTimeAdminSetup({
        name: adminName.trim() || 'Central Administrator',
        loginId: cleanId,
        password: cleanPw,
        confirmPassword: cleanConfirm
      });

      setSuccessMessage('Primary Administrator account created and configured successfully! Launching dashboard...');
      setIsConfigured(true);
      setTimeout(() => {
        onLoginSuccess(res.user, 'admin');
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'Setup failed. Please check details or server logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#102A43] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#FF9933]/30 selection:text-white text-slate-100 bg-cover bg-fixed bg-center relative"
      style={{ backgroundImage: `url(${adminDashboardBg})` }}
    >
      {/* Background Readability Mask: Deep navy executive cyber command glow */}
      <div className="fixed inset-0 bg-[#0c1f33]/92 backdrop-blur-[2px] pointer-events-none z-0"></div>
      
      {/* Top Header Bar & Back to Main Login */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('auth', { path: '/login' })}
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-300 hover:text-[#FF9933] transition-colors cursor-pointer bg-slate-900/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 text-[#FF9933]" /> Back to Main Login
          </button>
          
          <button
            onClick={() => onNavigate('landing', { path: '/' })}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-700/60"
          >
            Portal Home ↗
          </button>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-3">
            <JanSamadhanLogo size="lg" variant="dark" />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-[#FF9933]/40 text-[#FF9933] text-xs font-bold mb-2 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>CENTRAL ADMINISTRATION CONSOLE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'setup' ? 'One-Time Admin Setup' : 'Administrator Sign In'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            {mode === 'setup'
              ? 'No Administrator account detected. Configure the Primary Admin credentials below.'
              : 'Dedicated portal for National Grievance Oversight & Audit'}
          </p>
        </div>
      </div>

      {/* Admin Authentication Card */}
      <div className="relative z-10 mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md text-slate-900 py-8 px-6 sm:px-9 shadow-2xl rounded-3xl border border-slate-200/90 relative">

          {/* Active Admin Session Banner */}
          {currentUser && currentUser.role === 'ADMIN' && (
            <div className="mb-5 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-[#006B3C] font-extrabold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#138808]" />
                <span>Active Administrator Session Detected</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Logged in as <strong>{currentUser.name}</strong> ({currentUser.login_id || 'admin@jansamadhanadmin'}).
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('admin-dashboard', { path: '/admin/dashboard' })}
                  className="px-3.5 py-1.5 bg-[#102A43] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  Enter Command Center
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notice if logged in as Non-Admin */}
          {currentUser && currentUser.role !== 'ADMIN' && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900">
              <span className="font-bold block">Current Session: {currentUser.name} ({currentUser.role})</span>
              <span>This portal requires Central Administrator privileges. Please authenticate with Admin credentials below or switch account.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-red-900 font-bold ml-2 hover:opacity-80 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Mode: One-Time First-Time Setup */}
          {mode === 'setup' ? (
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>First-Time Project Owner Setup:</strong> Set up your Primary Administrator account. Credentials are encrypted and securely stored.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admin Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Central Administrator"
                    className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admin Login ID *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={adminLoginId}
                    onChange={(e) => setAdminLoginId(e.target.value)}
                    placeholder="admin@jansamadhanadmin"
                    className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 font-mono text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Recommended standard: <code>admin@jansamadhanadmin</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Choose Confidential Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2 bg-white text-slate-900 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2 bg-white text-slate-900 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#FF9933] hover:bg-[#e68524] disabled:opacity-50 text-slate-950 font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Configuring Admin Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Create &amp; Activate Primary Admin</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Mode: Standard Sign In */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admin Login ID *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={adminLoginId}
                    onChange={(e) => setAdminLoginId(e.target.value)}
                    placeholder="admin@jansamadhanadmin"
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 font-mono text-xs sm:text-sm font-semibold placeholder-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Standard format: <code>admin@jansamadhanadmin</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admin Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#102A43] hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#FF9933]" />
                    <span>Authenticate &amp; Enter Dashboard</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back Navigation & Help Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('auth', { path: '/login' })}
              className="text-xs font-bold text-[#006B3C] hover:underline cursor-pointer block w-full"
            >
              ← Back to Main Login (Citizen &amp; Officer Portals)
            </button>
            <p className="text-[11px] text-slate-400">
              Admin credentials are fully controlled by the project owner via this portal, <code>backend/.env</code>, or <code>python setup_admin.py</code>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
