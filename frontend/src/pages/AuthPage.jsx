import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Building2,
  BadgeCheck,
  Mail
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import {
  registerWithPhone,
  loginWithPhone,
  loginWithGoogle,
  resetPassword,
  loginOfficer,
  fetchDepartments
} from '../services/api';

/**
 * AuthPage — JanSamadhan public authentication screen.
 *
 * PUBLIC SURFACE (what a normal citizen sees at /login and /register):
 *   - "Continue with Google" + "Continue with Phone Number"
 *   - Phone login + phone registration + forgot-password
 *
 * HIDDEN SURFACES (not advertised anywhere in the UI):
 *   - Officer login form: rendered ONLY when this screen is opened with
 *     targetIntent === 'officer'. That intent is set exclusively by the
 *     hidden 5-tap logo easter-egg → staff chooser modal → "Officer
 *     Login". There is no visible tab, banner, button, footer link, or
 *     URL that reveals officer login exists to the general public.
 *   - Admin login: lives on a completely separate in-app screen
 *     (see AdminLoginPage.jsx), reachable only through the same
 *     easter-egg chooser → "Admin Login". Nothing here references admin.
 *
 * Officer access path:  5-tap logo easter-egg → chooser → Officer Login.
 * Admin access path:    5-tap logo easter-egg → chooser → Admin Login.
 */
export default function AuthPage({
  currentUser = null,
  onLogout,
  targetIntent = 'register',
  onLoginSuccess,
  onNavigate
}) {
  // Portal type: 'citizen' is default. 'officer' is reachable ONLY when
  // targetIntent === 'officer' (set by the hidden 5-tap logo easter-egg →
  // staff chooser modal → "Officer Login"). The portalType switcher tab
  // is intentionally NOT rendered.
  const [portalType, setPortalType] = useState(
    targetIntent === 'officer' ? 'officer' : 'citizen'
  );

  // Citizen auth method: 'selection' | 'phone' | 'forgot-password'
  const [authMethod, setAuthMethod] = useState('selection');
  // Citizen phone sub-mode: 'login' | 'register'
  const [phoneMode, setPhoneMode] = useState(
    targetIntent === 'register' ? 'register' : 'login'
  );

  // Citizen Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Officer Form Fields
  const [departments, setDepartments] = useState(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('js_departments_cache') : null;
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [officerDepartment, setOfficerDepartment] = useState('');
  const [officerDepartmentId, setOfficerDepartmentId] = useState('');
  const [officerLoginId, setOfficerLoginId] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptsConnectionError, setDeptsConnectionError] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOfficerPassword, setShowOfficerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Google OAuth Client ID (optional — falls back gracefully)
  const googleClientId = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_GOOGLE_CLIENT_ID || '')
    : '';

  /* ---------- Departments loader (officer-only) ---------- */
  const loadDepts = async () => {
    setLoadingDepts(true);
    setDeptsConnectionError(false);
    try {
      const data = await fetchDepartments();
      if (Array.isArray(data)) {
        setDepartments(data);
        setDeptsConnectionError(false);
      }
    } catch (err) {
      if (departments.length === 0) {
        setDeptsConnectionError(true);
      }
    } finally {
      setLoadingDepts(false);
    }
  };

  useEffect(() => {
    if (portalType === 'officer') loadDepts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalType]);

  /* Keep portalType in sync with targetIntent when App re-uses this
     screen across intent changes (e.g. owner taps the hidden logo
     easter-egg while already on /login and picks Officer Login). */
  useEffect(() => {
    setPortalType(targetIntent === 'officer' ? 'officer' : 'citizen');
    setPhoneMode(targetIntent === 'register' ? 'register' : 'login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIntent]);

  const handleDepartmentChange = (e) => {
    const selectedId = e.target.value;
    setOfficerDepartmentId(selectedId);
    if (!selectedId) {
      setOfficerDepartment('');
      return;
    }
    const found = departments.find((d) => String(d.id) === String(selectedId));
    setOfficerDepartment(found ? found.name : '');
  };

  /* ---------- Google Identity Services bootstrap ---------- */
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {
        /* best-effort */
      }
    }
  }, []);

  /* ---------- Google OAuth handler ---------- */
  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (window.google && googleClientId) {
      try {
        setLoading(true);
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            if (response && response.credential) {
              try {
                const res = await loginWithGoogle({
                  credential: response.credential,
                  role: 'CITIZEN'
                });
                setSuccessMessage('Google verification successful. Redirecting...');
                setTimeout(() => {
                  onLoginSuccess(res.user, targetIntent);
                }, 400);
              } catch (err) {
                setErrorMessage(err.message || 'Google token verification failed on server.');
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          }
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
          }
        });
      } catch (err) {
        setLoading(false);
        setErrorMessage('Google Sign-In initialization error. Please use Phone Number authentication.');
      }
    } else {
      setLoading(false);
      setErrorMessage(
        'Google OAuth is not configured yet. Please use "Continue with Phone Number" below.'
      );
    }
  };

  /* ---------- Citizen phone registration ---------- */
  const handlePhoneRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase() || undefined;

    setLoading(true);
    try {
      await registerWithPhone({
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password,
        confirmPassword,
        role: 'CITIZEN'
      });
      setPassword('');
      setConfirmPassword('');
      setPhoneMode('login');
      setPhone(cleanPhone);
      setSuccessMessage('Registration successful! Please enter your password to sign in to your Citizen account.');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Mobile number or email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Citizen phone login ---------- */
  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!phone.trim() || !password.trim()) {
      setErrorMessage('Please enter your mobile number and password.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithPhone({ phone: cleanPhone, password });
      setSuccessMessage('Login successful! Welcome back.');
      setTimeout(() => {
        onLoginSuccess(res.user, targetIntent);
      }, 400);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Officer login ---------- */
  const handleOfficerLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!officerDepartmentId && !officerDepartment) {
      setErrorMessage('Please select your assigned department to proceed.');
      return;
    }
    const cleanId = officerLoginId.trim().toLowerCase();
    const cleanPw = officerPassword.trim();
    if (!cleanId || !cleanPw) {
      setErrorMessage('Please enter your Officer Login ID / Username and password.');
      return;
    }

    const selectedDeptObj = departments.find(
      (d) => String(d.id) === String(officerDepartmentId) || d.name === officerDepartment
    );
    const expectedDomain = selectedDeptObj?.login_code;

    // Domain check when a full email-style login ID is entered
    if (cleanId.includes('@') && expectedDomain) {
      const enteredDomain = cleanId.split('@')[1];
      if (enteredDomain !== expectedDomain.toLowerCase()) {
        setErrorMessage(
          `Domain mismatch: You entered '@${enteredDomain}', but '${officerDepartment}' requires '@${expectedDomain}'.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await loginOfficer({
        loginId: cleanId,
        password: cleanPw,
        department: officerDepartment,
        departmentId: officerDepartmentId
      });
      setSuccessMessage(`Officer verified. Welcome, ${res.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(res.user, 'officer');
      }, 400);
    } catch (err) {
      setErrorMessage(
        err.message || 'Officer authentication failed. Please verify your selected department and credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Password reset ---------- */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ phone: cleanPhone, newPassword: password });
      setSuccessMessage(res.message || 'Password has been updated. You can now login.');
      setPhoneMode('login');
      setAuthMethod('phone');
    } catch (err) {
      setErrorMessage(err.message || 'Password reset failed. Please verify your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Derived copy ---------- */
  const headerTitle =
    portalType === 'officer'
      ? 'Department Officer Access'
      : 'JanSamadhan Portal Access';
  const headerSubtitle =
    portalType === 'officer'
      ? 'Restricted area — for authorized department nodal staff only'
      : 'National Public Grievance Redressal & Audit System';

  return (
    <div className="min-h-screen bg-[#F5F9F6] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#138808]/20 selection:text-[#006B3C] relative overflow-hidden">
      {/* Soft tricolor atmospheric background (CSS-only, no asset import) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FF9933]/12 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#138808]/12 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #102A43 0, transparent 35%), radial-gradient(circle at 75% 75%, #006B3C 0, transparent 35%)' }} />
      </div>

      {/* Top Back Button & Branding */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => onNavigate('landing', { path: '/' })}
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#006B3C] mb-6 transition-colors cursor-pointer bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-[#006B3C]" /> Back to JanSamadhan Portal
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-3">
            <JanSamadhanLogo size="lg" variant="light" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight">
            {headerTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-5 sm:px-9 shadow-2xl rounded-3xl border border-slate-200/90 relative">

          {/* Active Session Detection Banner */}
          {currentUser && (
            <div className="mb-5 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2.5">
              <div className="flex items-center justify-center space-x-2 text-[#006B3C] font-extrabold text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 text-[#138808]" />
                <span>Active Session: {currentUser.name}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                You are currently authenticated as <strong>{currentUser.role}</strong>{' '}
                {currentUser.login_id ? `(${currentUser.login_id})` : currentUser.phone ? `(+91 ${currentUser.phone})` : ''}.
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => onLoginSuccess(currentUser, targetIntent)}
                  className="px-3.5 py-1.5 bg-[#138808] hover:bg-[#006B3C] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  Continue to Dashboard
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

          {/* NOTE: No admin/officer tab switcher, no admin banner, no admin footer link.
              The public surface is citizen-only. Officer & admin login routes
              are deliberately unadvertised (Flipkart/Amazon-style stealth). */}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{errorMessage}</span>
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
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================
              VIEW A: CITIZEN PORTAL (Phone & Google Authentication)
              This is the only view a normal public user ever sees.
              ======================================================== */}
          {portalType === 'citizen' && (
            <>
              {/* Intent Banner */}
              {targetIntent && targetIntent !== 'officer' && targetIntent !== 'admin' && (
                <div className="mb-5 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-[#006B3C] flex items-center justify-between">
                  <span>Destination: {targetIntent === 'track' ? 'Track Your Complaint' : 'Register a Complaint'}</span>
                  <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full font-bold">Auto-Redirect</span>
                </div>
              )}

              {/* CITIZEN SUB-VIEW 1: SELECTION */}
              {authMethod === 'selection' && (
                <div className="space-y-4">
                  <div className="text-center mb-3">
                    <h3 className="text-sm font-black text-[#102A43] uppercase tracking-wide">
                      Citizen Sign In
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose how you would like to authenticate:
                    </p>
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-3 text-sm cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-slate-500 font-bold">OR</span>
                    </div>
                  </div>

                  {/* Phone Authentication */}
                  <button
                    type="button"
                    onClick={() => setAuthMethod('phone')}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Continue with Phone Number</span>
                  </button>
                </div>
              )}

              {/* CITIZEN SUB-VIEW 2: PHONE AUTHENTICATION */}
              {authMethod === 'phone' && (
                <div>
                  <div className="flex border-b border-slate-200 mb-5">
                    <button
                      type="button"
                      onClick={() => { setPhoneMode('login'); setErrorMessage(''); }}
                      className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                        phoneMode === 'login'
                          ? 'border-[#006B3C] text-[#006B3C]'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Existing Citizen Login
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhoneMode('register'); setErrorMessage(''); }}
                      className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                        phoneMode === 'register'
                          ? 'border-[#006B3C] text-[#006B3C]'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      New Registration
                    </button>
                  </div>

                  <form
                    onSubmit={phoneMode === 'register' ? handlePhoneRegister : handlePhoneLogin}
                    className="space-y-4"
                  >
                    {phoneMode === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your legal name"
                            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Indian Mobile Number *
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-bold">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="w-full px-4 py-2.5 bg-white text-slate-900 font-semibold placeholder-slate-400 border border-slate-300 rounded-r-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none tracking-wider font-mono"
                        />
                      </div>
                    </div>

                    {phoneMode === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="citizen@example.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Password *
                        </label>
                        {phoneMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setAuthMethod('forgot-password'); setErrorMessage(''); }}
                            className="text-[11px] font-semibold text-[#006B3C] hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={phoneMode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                          className="w-full pl-10 pr-10 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
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

                    {phoneMode === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            className="w-full pl-10 pr-10 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
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
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#138808] hover:bg-[#006B3C] disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{phoneMode === 'register' ? 'Register & Continue' : 'Login to Dashboard'}</span>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setAuthMethod('selection')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        ← Back to Sign In Options
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* CITIZEN SUB-VIEW 3: FORGOT PASSWORD */}
              {authMethod === 'forgot-password' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006B3C] flex items-center justify-center mx-auto mb-2">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-[#102A43] text-base">Reset Your Password</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your registered 10-digit mobile number and create a new password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-bold">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-white text-slate-900 font-semibold placeholder-slate-400 border border-slate-300 rounded-r-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#006B3C] hover:bg-[#138808] disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMethod('phone'); setPhoneMode('login'); }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ========================================================
              VIEW B: DEPARTMENT OFFICER PORTAL
              REACHED ONLY VIA /login?intent=officer — no public UI hint.
              ======================================================== */}
          {portalType === 'officer' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#102A43] text-white flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#FF9933]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#102A43] uppercase tracking-wide">
                    Department Nodal Officer Console
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Municipal &amp; Public Works Department Redressal Staff
                  </p>
                </div>
              </div>

              <form onSubmit={handleOfficerLogin} className="space-y-4">
                {/* Mandatory Department Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Select Assigned Department *
                    </label>
                    {departments.length === 0 && !loadingDepts && (
                      <button
                        type="button"
                        onClick={loadDepts}
                        className="text-[11px] text-[#006B3C] font-semibold hover:underline cursor-pointer"
                      >
                        ↻ Refresh
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={officerDepartmentId}
                      onChange={handleDepartmentChange}
                      disabled={loadingDepts && departments.length === 0}
                      className="w-full pl-10 pr-9 py-2.5 bg-white text-slate-900 font-semibold border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#102A43] focus:outline-none appearance-none cursor-pointer disabled:bg-slate-50"
                    >
                      <option value="">
                        {loadingDepts
                          ? 'Loading departments...'
                          : deptsConnectionError && departments.length === 0
                          ? 'Unable to connect to backend. Please try again.'
                          : departments.length === 0
                          ? 'No departments available'
                          : '-- Choose Assigned Department --'}
                      </option>
                      {departments
                        .filter((d) => d.is_active !== false)
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-3.5 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-500 w-0 h-0"></div>
                  </div>
                  {officerDepartment ? (
                    <span className="block text-[10px] text-emerald-700 font-medium mt-1">
                      Assigned department login domain:{' '}
                      <code className="bg-emerald-50 px-1 py-0.5 rounded font-mono text-[10px]">
                        @{departments.find((d) => String(d.id) === String(officerDepartmentId) || d.name === officerDepartment)?.login_code || 'deptcode'}
                      </code>
                    </span>
                  ) : (
                    <span className="block text-[10px] text-slate-500 mt-1">
                      Mandatory: Officers can only access their officially assigned department.
                    </span>
                  )}
                  {deptsConnectionError && departments.length === 0 && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>Unable to connect to backend. Please check server on port 8000.</span>
                      </div>
                      <button
                        type="button"
                        onClick={loadDepts}
                        className="font-bold underline text-[#006B3C] hover:text-emerald-950 ml-2 cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Officer Login ID / Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={officerLoginId}
                      onChange={(e) => setOfficerLoginId(e.target.value)}
                      placeholder={
                        officerDepartment
                          ? `e.g. abc@${departments.find((d) => d.name === officerDepartment)?.login_code || 'deptcode'}`
                          : 'e.g. abc@electricity'
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#102A43] focus:outline-none font-mono text-xs"
                    />
                  </div>
                  <span className="block text-[10px] text-slate-500 mt-1">
                    Format: <code>username@{departments.find((d) => d.name === officerDepartment)?.login_code || 'deptcode'}</code> (or enter your username)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Officer Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showOfficerPassword ? 'text' : 'password'}
                      required
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      placeholder="Enter officer password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#102A43] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOfficerPassword(!showOfficerPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showOfficerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#102A43] hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4 text-[#FF9933]" />
                      <span>Authenticate &amp; Enter Console</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Advisory */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">ℹ️ Officer Notice:</span>
                Officer accounts are provisioned exclusively by Central Administration. Use the credentials provided by your Administrator.
              </div>

              {/* Quiet return to citizen sign-in — only visible once an
                  officer is already on this restricted view (does NOT
                  advertise officer login exists to the general public). */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPortalType('citizen');
                    setAuthMethod('selection');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Back to Citizen Sign In
                </button>
              </div>
            </div>
          )}

          {/* NOTE: Admin login link / banner intentionally removed.
              Admins reach /admin/login directly. */}

          {/* Terms note */}
          <p className="text-[11px] text-slate-400 text-center mt-4">
            Official Grievance Redressal System — Government of India initiative.
          </p>

        </div>
      </div>
    </div>
  );
}