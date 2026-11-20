import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './pages/AdminLoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import {
  fetchComplaints,
  updateComplaintStatus,
  checkBackendHealth,
  fetchCurrentUser,
  logoutUser
} from './services/api';

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
 * Maps browser pathname on first load to the corresponding internal page and intent
 */
function getInitialRoute(user) {
  if (typeof window === 'undefined') {
    return { page: 'landing', intent: 'register', path: '/' };
  }
  const path = window.location.pathname.toLowerCase();

  if (path === '/admin/login') {
    return { page: 'admin-login', intent: 'admin', path: '/admin/login' };
  }

  if (path === '/admin/dashboard' || path === '/admin') {
    if (user && user.role === 'ADMIN') {
      return { page: 'admin-dashboard', intent: 'admin', path: '/admin/dashboard' };
    }
    // Unauthorized access falls back to dedicated Admin Login
    return { page: 'admin-login', intent: 'admin', path: '/admin/login' };
  }

  if (path === '/officer/dashboard' || path === '/officer') {
    if (user && (user.role === 'OFFICER' || user.role === 'ADMIN')) {
      return { page: 'officer-dashboard', intent: 'officer', path: '/officer/dashboard' };
    }
    return { page: 'auth', intent: 'officer', path: '/login?intent=officer' };
  }

  if (path === '/citizen/dashboard' || path === '/citizen') {
    if (user) {
      return { page: 'citizen-dashboard', intent: 'track', path: '/citizen/dashboard' };
    }
    return { page: 'auth', intent: 'login', path: '/login' };
  }

  if (path === '/login') {
    const searchParams = new URLSearchParams(window.location.search);
    const intent = searchParams.get('intent') === 'officer' ? 'officer' : 'login';
    return { page: 'auth', intent, path: window.location.pathname + window.location.search };
  }

  if (path === '/register') {
    return { page: 'auth', intent: 'register', path: '/register' };
  }

  if (path === '/auth') {
    return { page: 'auth', intent: 'login', path: '/login' };
  }

  return { page: 'landing', intent: 'register', path: '/' };
}

/**
 * Computes canonical URL for a given page name and options
 */
function pageToPath(page, options = {}) {
  if (options.path) return options.path;
  switch (page) {
    case 'admin-login':
      return '/admin/login';
    case 'admin-dashboard':
      return '/admin/dashboard';
    case 'officer-dashboard':
      return '/officer/dashboard';
    case 'citizen-dashboard':
      return '/citizen/dashboard';
    case 'auth':
      if (options.targetIntent === 'register') return '/register';
      if (options.targetIntent === 'officer') return '/login?intent=officer';
      return '/login';
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
            if (currentPage === 'admin-dashboard') {
              setCurrentPage('admin-login');
              syncUrl('/admin/login');
            } else if (currentPage === 'officer-dashboard' || currentPage === 'citizen-dashboard') {
              setCurrentPage('auth');
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
   * Central navigation handler with role-based route protection
   */
  const handleNavigate = useCallback((page, options = {}) => {
    let targetPage = page;
    let targetIntent = options.targetIntent || authIntent;
    let targetPath = options.path;

    if (page === 'admin-login') {
      targetPage = 'admin-login';
      targetIntent = 'admin';
      targetPath = targetPath || '/admin/login';
    } else if (page === 'admin-dashboard') {
      // Role protection: Only authenticated ADMIN can enter
      if (!currentUser || currentUser.role !== 'ADMIN') {
        targetPage = 'admin-login';
        targetIntent = 'admin';
        targetPath = '/admin/login';
      } else {
        targetPage = 'admin-dashboard';
        targetPath = targetPath || '/admin/dashboard';
      }
    } else if (page === 'officer-dashboard') {
      // Role protection: Only OFFICER or ADMIN can enter
      if (!currentUser || (currentUser.role !== 'OFFICER' && currentUser.role !== 'ADMIN')) {
        targetPage = 'auth';
        targetIntent = 'officer';
        targetPath = '/login?intent=officer';
      } else {
        targetPage = 'officer-dashboard';
        targetPath = targetPath || '/officer/dashboard';
      }
    } else if (page === 'citizen-dashboard') {
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
      targetPath = targetPath || (targetIntent === 'register' ? '/register' : (targetIntent === 'officer' ? '/login?intent=officer' : '/login'));
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
      syncUrl('/admin/dashboard');
    } else if (userData.role === 'OFFICER') {
      setCurrentPage('officer-dashboard');
      syncUrl('/officer/dashboard');
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

    // If logging out from admin console, return to admin-login
    if (currentPage === 'admin-dashboard' || currentPage === 'admin-login') {
      setCurrentPage('admin-login');
      syncUrl('/admin/login');
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
    <div className="min-h-screen bg-[#F5F9F6] text-[#102A43]">
      {/* 1. Landing Page */}
      {currentPage === 'landing' && (
        <LandingPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {/* 2. Dedicated Admin Login Page (Route: /admin/login) */}
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
    </div>
  );
}
