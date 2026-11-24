import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCog, X, ArrowRight } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import WhyTrustPage from './pages/WhyTrustPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './pages/AdminLoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SplashScreen from './components/SplashScreen';
import {
  fetchComplaints,
  updateComplaintStatus,
  checkBackendHealth,
  fetchCurrentUser,
  logoutUser
} from './services/api';
import { softHaptic } from './utils/haptics';

/**
 * Synchronously retrieve the active user from localStorage
 * Prevents unnecessary logout or redirect flicker on page refresh
 */
function getInitialUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('js_user');
    const token = localStorage.getItem('js_token');
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Initial-route resolver.
 *
 * IMPORTANT — public URL surface deliberately shrunk:
 *   The officer/admin portals are NO LONGER reachable by typing a URL.
 *   Anyone who hits `/admin/*`, `/officer/*`, or `/login?intent=officer`
 *   is silently redirected to the public landing page. The only way to
 *   reach the staff login chooser is the hidden easter-egg (5 quick taps
 *   on any JanSamadhan logo), which is wired up inside LandingPage +
 *   Navbar and never advertised in the public UI.
 *
 * Recognised public paths: /, /about, /why-trust, /how-it-works,
 * /services, /contact, /login, /register, /citizen/dashboard.
 */
function getInitialRoute(user) {
  if (typeof window === 'undefined') {
    return { page: 'landing', intent: 'register', path: '/' };
  }
  const path = window.location.pathname.toLowerCase();

  // ===== PUBLIC INFO PAGES =====
  if (path === '/about')           return { page: 'about',         intent: 'register', path: '/about' };
  if (path === '/why-trust')       return { page: 'why-trust',     intent: 'register', path: '/why-trust' };
  if (path === '/how-it-works')    return { page: 'how-it-works',  intent: 'register', path: '/how-it-works' };
  if (path === '/services')        return { page: 'services',      intent: 'register', path: '/services' };
  if (path === '/contact')         return { page: 'contact',       intent: 'register', path: '/contact' };

  // ===== CITIZEN AUTH (public) =====
  if (path === '/login') {
    // NOTE: ?intent=officer is intentionally ignored here — staff access
    // is gated behind the hidden easter-egg, never the URL.
    return { page: 'auth', intent: 'login', path: '/login' };
  }
  if (path === '/register') {
    return { page: 'auth', intent: 'register', path: '/register' };
  }
  if (path === '/auth') {
    return { page: 'auth', intent: 'login', path: '/login' };
  }

  // ===== CITIZEN DASHBOARD (requires login — handled by role guard) =====
  if (path === '/citizen/dashboard' || path === '/citizen') {
    if (user) {
      return { page: 'citizen-dashboard', intent: 'track', path: '/citizen/dashboard' };
    }
    return { page: 'auth', intent: 'login', path: '/login' };
  }

  // ===== EVERYTHING ELSE (incl. /admin/*, /officer/*, unknown paths) =====
  // Silently fall back to the public landing page. Staff portals are only
  // reachable through the hidden logo-tap easter-egg + chooser.
  return { page: 'landing', intent: 'register', path: '/' };
}

/**
 * Computes canonical URL for a given page name and options.
 * Only public pages get a real URL; staff pages resolve to '/' so they
 * never leak into the browser address bar.
 */
function pageToPath(page, options = {}) {
  if (options.path) return options.path;
  switch (page) {
    case 'citizen-dashboard':
      return '/citizen/dashboard';
    case 'auth':
      if (options.targetIntent === 'register') return '/register';
      return '/login';
    case 'about':
      return '/about';
    case 'why-trust':
      return '/why-trust';
    case 'how-it-works':
      return '/how-it-works';
    case 'services':
      return '/services';
    case 'contact':
      return '/contact';
    case 'landing':
    default:
      return '/';
  }
}

/**
 * Updates browser history without page reload
 */
function syncUrl(targetPath) {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname + window.location.search;
  if (current !== targetPath) {
    window.history.pushState(null, '', targetPath);
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(getInitialUser);
  const initialRoute = getInitialRoute(getInitialUser());
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [authIntent, setAuthIntent] = useState(initialRoute.intent);
  const [citizenInitialTab, setCitizenInitialTab] = useState('new-complaint');
  const [complaints, setComplaints] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Hidden staff-access chooser modal — opened only by the 5-tap logo
  // easter-egg. Never advertised anywhere in the public UI.
  const [secretChooserOpen, setSecretChooserOpen] = useState(false);

  // Synchronize initial URL if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const canonical = pageToPath(initialRoute.page, { targetIntent: initialRoute.intent, path: initialRoute.path });
      syncUrl(canonical);
    }
  }, []);

  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const activeUser = getInitialUser();
      const route = getInitialRoute(activeUser);
      setCurrentUser(activeUser);
      setCurrentPage(route.page);
      setAuthIntent(route.intent);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Background health check, complaints sync, and JWT validation
  useEffect(() => {
    async function loadData() {
      const isHealthy = await checkBackendHealth();
      setIsBackendConnected(isHealthy);

      if (isHealthy) {
        const data = await fetchComplaints();
        if (Array.isArray(data)) {
          setComplaints(data);
        }

        // Validate existing JWT token with /api/auth/me
        const authUser = await fetchCurrentUser();
        if (authUser) {
          setCurrentUser(authUser);
        } else {
          // Token expired or invalid
          const cachedUser = getInitialUser();
          if (cachedUser) {
            logoutUser();
            setCurrentUser(null);
            if (currentPage === 'admin-dashboard' || currentPage === 'admin-login') {
              setCurrentPage('admin-login');
              // no URL sync — staff route stays in-app only
            } else if (currentPage === 'officer-dashboard' || currentPage === 'citizen-dashboard') {
              setCurrentPage('auth');
              setAuthIntent('login');
              syncUrl('/login');
            }
          }
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [currentPage]);

  /**
   * Central navigation handler with role-based route protection.
   *
   * Staff portals (admin-login / admin-dashboard / officer-dashboard) are
   * navigated to IN-APP ONLY — their target pages never get a real URL in
   * the browser address bar, so they cannot be reached by typing a path.
   */
  const handleNavigate = useCallback((page, options = {}) => {
    let targetPage = page;
    let targetIntent = options.targetIntent || authIntent;
    let targetPath = options.path;

    if (page === 'admin-login') {
      // In-app only — no URL sync
      targetPage = 'admin-login';
      targetIntent = 'admin';
      setAuthIntent(targetIntent);
      setCurrentPage(targetPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'admin-dashboard') {
      // Role protection: Only authenticated ADMIN can enter
      if (!currentUser || currentUser.role !== 'ADMIN') {
        setAuthIntent('admin');
        setCurrentPage('admin-login');
      } else {
        setCurrentPage('admin-dashboard');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'officer-dashboard') {
      // Role protection: Only OFFICER or ADMIN can enter
      if (!currentUser || (currentUser.role !== 'OFFICER' && currentUser.role !== 'ADMIN')) {
        setAuthIntent('officer');
        setCurrentPage('auth');
      } else {
        setCurrentPage('officer-dashboard');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'citizen-dashboard') {
      if (!currentUser) {
        targetPage = 'auth';
        targetIntent = options.targetIntent || (options.initialTab === 'my-complaints' ? 'track' : 'register');
        targetPath = '/login';
      } else {
        if (options.initialTab) {
          setCitizenInitialTab(options.initialTab);
        }
        targetPage = 'citizen-dashboard';
        targetPath = targetPath || '/citizen/dashboard';
      }
    } else if (page === 'auth') {
      targetPage = 'auth';
      targetIntent = options.targetIntent || 'login';
      targetPath = targetPath || (targetIntent === 'register' ? '/register' : '/login');
    } else if (page === 'about' || page === 'why-trust' || page === 'how-it-works' || page === 'services' || page === 'contact') {
      // Public info pages — no auth required
      targetPage = page;
      targetPath = targetPath || pageToPath(page);
    } else if (page === 'landing') {
      targetPage = 'landing';
      targetPath = targetPath || '/';
    }

    setAuthIntent(targetIntent);
    setCurrentPage(targetPage);
    syncUrl(targetPath || pageToPath(targetPage, { targetIntent }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentUser, authIntent]);

  /**
   * Hidden staff-access trigger — fired when the owner taps any
   * JanSamadhan logo 5 times quickly. Opens a chooser modal offering
   * Officer Login and Admin Login. Public users can never discover this
   * (no menu item, no link, no URL).
   */
  const handleSecretTrigger = useCallback(() => {
    softHaptic('medium');
    setSecretChooserOpen(true);
  }, []);

  const chooseOfficer = useCallback(() => {
    setSecretChooserOpen(false);
    // If already an authenticated officer/admin, jump straight to dashboard
    if (currentUser && (currentUser.role === 'OFFICER' || currentUser.role === 'ADMIN')) {
      handleNavigate('officer-dashboard');
    } else {
      handleNavigate('auth', { targetIntent: 'officer' });
    }
  }, [currentUser, handleNavigate]);

  const chooseAdmin = useCallback(() => {
    setSecretChooserOpen(false);
    if (currentUser && currentUser.role === 'ADMIN') {
      handleNavigate('admin-dashboard');
    } else {
      handleNavigate('admin-login');
    }
  }, [currentUser, handleNavigate]);

  /**
   * Post-authentication routing based on authenticated user's role
   */
  const handleLoginSuccess = async (userData, intent) => {
    setCurrentUser(userData);
    const resolvedIntent = intent || authIntent;

    // Refresh complaints tailored to authenticated role and department
    try {
      const data = await fetchComplaints();
      if (Array.isArray(data)) {
        setComplaints(data);
      }
    } catch (e) {
      console.warn("Failed to refresh complaints on login:", e);
    }

    if (userData.role === 'ADMIN') {
      setCurrentPage('admin-dashboard');
      // staff dashboard — no URL sync (in-app only)
    } else if (userData.role === 'OFFICER') {
      setCurrentPage('officer-dashboard');
      // staff dashboard — no URL sync (in-app only)
    } else {
      if (resolvedIntent === 'track') {
        setCitizenInitialTab('my-complaints');
      } else {
        setCitizenInitialTab('new-complaint');
      }
      setCurrentPage('citizen-dashboard');
      syncUrl('/citizen/dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddComplaint = (newComplaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
  };

  const handleUpdateStatus = async (complaintId, newStatus, remark) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    setComplaints((prev) =>
      prev.map((item) =>
        item.id === complaintId
          ? {
            ...item,
            status: newStatus,
            history: [...(item.history || []), { status: newStatus, time: now, remark }]
          }
          : item
      )
    );
    // Persist to FastAPI backend
    await updateComplaintStatus(complaintId, newStatus, remark);
  };

  const handleLogout = async () => {
    // Explicitly disable Google Identity Services auto-select
    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {
        console.warn('Google disableAutoSelect notice:', e);
      }
    }
    await logoutUser();
    setCurrentUser(null);

    // If logging out from admin console, stay on the in-app admin-login
    // screen (no URL sync — staff route must never appear in address bar).
    if (currentPage === 'admin-dashboard' || currentPage === 'admin-login') {
      setCurrentPage('admin-login');
    } else {
      setCurrentPage('auth');
      setAuthIntent('login');
      syncUrl('/login');
    }

    try {
      const data = await fetchComplaints();
      if (Array.isArray(data)) setComplaints(data);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Government-style intro splash — plays once per session, overlays everything */}
      <SplashScreen onDone={() => {}} />

      <div className="min-h-screen bg-[#F5F9F6] text-[#102A43]">
        {/* 1. Landing Page */}
        {currentPage === 'landing' && (
          <LandingPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onSecretTrigger={handleSecretTrigger}
          />
        )}

        {/* 1b. Public info pages — each on its own route, with shared Navbar + Footer */}
        {currentPage === 'about' && (
          <AboutPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'why-trust' && (
          <WhyTrustPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'how-it-works' && (
          <HowItWorksPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'services' && (
          <ServicesPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'contact' && (
          <ContactPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}

        {/* 2. Dedicated Admin Login Page — in-app only (no public URL).
            Reachable exclusively via the hidden 5-tap logo easter-egg →
            staff chooser modal → "Admin Login". */}
        {currentPage === 'admin-login' && (
          <AdminLoginPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {/* 3. Main Auth Page (Citizen Login & Officer Login, with Admin banner & footer) */}
        {(currentPage === 'auth' || currentPage === 'login' || currentPage === 'register') && (
          <AuthPage
            currentUser={currentUser}
            onLogout={handleLogout}
            targetIntent={authIntent}
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {/* 4. Citizen Dashboard */}
        {currentPage === 'citizen-dashboard' && (
          currentUser ? (
            <CitizenDashboard
              user={currentUser}
              initialTab={citizenInitialTab}
              complaints={complaints}
              onAddComplaint={handleAddComplaint}
              onLogout={handleLogout}
              onNavigateHome={() => handleNavigate('landing')}
            />
          ) : (
            <AuthPage
              currentUser={currentUser}
              onLogout={handleLogout}
              targetIntent={authIntent}
              onLoginSuccess={handleLoginSuccess}
              onNavigate={handleNavigate}
            />
          )
        )}

        {/* 5. Officer Dashboard (Role Guard: OFFICER or ADMIN) */}
        {currentPage === 'officer-dashboard' && (
          currentUser && (currentUser.role === 'OFFICER' || currentUser.role === 'ADMIN') ? (
            <OfficerDashboard
              user={currentUser}
              complaints={complaints.filter(c =>
                currentUser.department
                  ? (c.assigned_department === currentUser.department || c.department === currentUser.department)
                  : true
              )}
              onUpdateStatus={handleUpdateStatus}
              onLogout={handleLogout}
              onNavigateHome={() => handleNavigate('landing')}
            />
          ) : (
            <AuthPage
              currentUser={currentUser}
              onLogout={handleLogout}
              targetIntent="officer"
              onLoginSuccess={handleLoginSuccess}
              onNavigate={handleNavigate}
            />
          )
        )}

        {/* 6. Admin Dashboard (Role Guard: ADMIN only) */}
        {currentPage === 'admin-dashboard' && (
          currentUser && currentUser.role === 'ADMIN' ? (
            <AdminDashboard
              user={currentUser}
              complaints={complaints}
              onLogout={handleLogout}
              onNavigateHome={() => handleNavigate('landing')}
            />
          ) : (
            <AdminLoginPage
              currentUser={currentUser}
              onLogout={handleLogout}
              onLoginSuccess={handleLoginSuccess}
              onNavigate={handleNavigate}
            />
          )
        )}

        {/* Live Backend Connection Indicator */}
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center space-x-2 shadow-md backdrop-blur border ${
            isBackendConnected
              ? 'bg-emerald-50/95 text-emerald-800 border-emerald-300'
              : 'bg-amber-50/95 text-amber-800 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-[#138808] animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{isBackendConnected ? 'JanSamadhan Live Backend Active' : 'Connecting to Server...'}</span>
          </div>
        </div>

        {/* ===== Hidden Staff-Access Chooser Modal =====
            Opened ONLY by the 5-tap logo easter-egg (handleSecretTrigger).
            Never advertised anywhere in the public UI. Lets the project
            owner pick Officer Login or Admin Login. */}
        <AnimatePresence>
          {secretChooserOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0b1c2d]/80 backdrop-blur-sm"
              onClick={() => setSecretChooserOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
              >
                {/* Tricolor strip header */}
                <div className="h-1.5 w-full tricolor-stripe" />

                {/* Close button */}
                <button
                  onClick={() => setSecretChooserOpen(false)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors z-10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-7 sm:p-9 text-center">
                  {/* Emblem */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#102A43] to-[#0b1c2d] flex items-center justify-center shadow-lg border border-white/20"
                  >
                    <ShieldCheck className="w-8 h-8 text-[#FF9933]" />
                  </motion.div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9933]/15 border border-[#FF9933]/30 text-[#E68A2E] text-[10px] font-black uppercase tracking-[0.15em] mb-3">
                    <ShieldCheck className="w-3 h-3" />
                    Staff Access
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-[#102A43] tracking-tight mb-2">
                    Restricted Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-7">
                    Authorized personnel only. Choose the console you wish to sign in to.
                  </p>

                  {/* Choice buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <motion.button
                      onClick={chooseOfficer}
                      whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(16,42,67,0.18)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="group w-full flex items-center gap-3 p-4 rounded-2xl bg-[#102A43] hover:bg-slate-800 text-white text-left transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <UserCog className="w-6 h-6 text-[#FF9933]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm sm:text-base">Officer Login</div>
                        <div className="text-[11px] text-slate-300">Nodal officer grievance console</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </motion.button>

                    <motion.button
                      onClick={chooseAdmin}
                      whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(255,153,51,0.30)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="group w-full flex items-center gap-3 p-4 rounded-2xl bg-[#FF9933] hover:bg-[#E68A2E] text-[#102A43] text-left transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#102A43]/15 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-6 h-6 text-[#102A43]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm sm:text-base">Admin Login</div>
                        <div className="text-[11px] text-[#102A43]/70">Central administration console</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#102A43]/60 group-hover:text-[#102A43] group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  </div>

                  <p className="mt-6 text-[10px] text-slate-400 leading-relaxed">
                    Unauthorised access is logged and may attract penal action under applicable IT Act provisions.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
