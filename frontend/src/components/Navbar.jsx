import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, ArrowRight, Phone, PhoneCall, ShieldCheck } from 'lucide-react';
import JanSamadhanLogo from './JanSamadhanLogo';
import { softHaptic, withHaptic } from '../utils/haptics';

/**
 * Navbar — shared, government-style sticky header.
 *
 * Used on every public page (landing, about, why-trust, how-it-works,
 * services, contact) so navigation feels like a single cohesive portal
 * rather than separate one-page scrollers.
 *
 * Layout (top to bottom):
 *   1. Tricolor accent strip
 *   2. Dark navy topbar — Digital India initiative (left) +
 *      Citizen Helpline 1800-JAN-SAMADHAN + Admin Login button (right)
 *   3. White main bar — Logo (left) | Nav links (center) | CTAs (right)
 *
 * Props:
 *   - currentPage:   the active page key (for the underline highlight)
 *   - currentUser:   optional logged-in user (changes right-side CTA)
 *   - onNavigate:    (page, options) => void  — used for client-side routing
 *   - onLogout:      optional, shown only when currentUser is set
 */
const EASE = [0.22, 1, 0.36, 1];

const NAV_ITEMS = [
  { id: 'about',         label: 'About',         route: 'about' },
  { id: 'why-trust',     label: 'Why Trust',     route: 'why-trust' },
  { id: 'how-it-works',  label: 'How It Works',  route: 'how-it-works' },
  { id: 'services',      label: 'Services',      route: 'services' },
  { id: 'contact',       label: 'Contact',       route: 'contact' }
];

export default function Navbar({ currentPage = 'landing', currentUser, onNavigate, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add subtle shadow once user scrolls down (govt portal feel)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const go = (route) => withHaptic('tick', () => {
    closeMobileMenu();
    onNavigate?.(route);
  });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b transition-shadow ${
        scrolled ? 'border-slate-200 shadow-md' : 'border-slate-200/80 shadow-sm'
      }`}
    >
      {/* ===== Top tricolor accent strip (Govt-of-India feel) ===== */}
      <div className="h-1.5 w-full tricolor-stripe" />

      {/* ===== Dark navy topbar: Initiative + Helpline + Admin Login ===== */}
      <div className="bg-[#102A43] text-slate-300 text-xs py-2 border-b border-slate-800">
        <div className="gov-container flex flex-wrap justify-between items-center gap-2">
          {/* Left: Initiative Titles */}
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
            <span className="relative w-2 h-2 rounded-full bg-[#FF9933] flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-[#FF9933] animate-ping opacity-75"></span>
            </span>
            <span className="font-semibold text-slate-100 whitespace-nowrap">
              Digital India Civic Redressal Initiative
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline whitespace-nowrap">Clean India • Prosperous India</span>
          </div>

          {/* Right: Citizen Helpline & Admin Login */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs text-slate-300">
            <span className="inline-flex items-center space-x-1.5 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0" />
              <span className="whitespace-nowrap"><span className="hidden sm:inline">Citizen </span>Helpline: <strong className="text-white font-bold tracking-wide">1800-JAN-SAMADHAN</strong></span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <motion.button
              onClick={withHaptic('light', () => onNavigate?.('admin-login', { path: '/admin/login' }))}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="hidden sm:inline-flex bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold cursor-pointer transition-colors shadow-sm whitespace-nowrap items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-slate-950" />
              <span>Admin Login ↗</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ===== Main bar: Logo | Nav links | CTAs ===== */}
      <div className="gov-container h-[68px] sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <motion.div
          className="flex items-center flex-shrink-0"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <JanSamadhanLogo
            size="md"
            variant="light"
            showTagline={true}
            onClick={withHaptic('tick', () => onNavigate?.('landing'))}
          />
        </motion.div>

        {/* Center: Nav links (lg:flex, 1024px+) */}
        <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 text-sm font-semibold text-slate-700">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.route;
            return (
              <motion.button
                key={item.id}
                onClick={go(item.route)}
                onMouseEnter={() => softHaptic('tick')}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: EASE }}
                className={`relative px-3.5 xl:px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[#006B3C] bg-[#138808]/8'
                    : 'hover:text-[#006B3C] hover:bg-slate-50'
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-3.5 right-3.5 -bottom-0.5 h-[3px] rounded-full bg-[#006B3C]"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Right: Action buttons (lg:flex) */}
        <div className="hidden lg:flex items-center justify-end gap-2 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={withHaptic('medium', () => onNavigate?.(currentUser.role === 'ADMIN' ? 'admin-dashboard' : currentUser.role === 'OFFICER' ? 'officer-dashboard' : 'citizen-dashboard'))}
                whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(16,42,67,0.22)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="h-10 px-4 text-xs sm:text-sm font-bold bg-[#102A43] text-white hover:bg-slate-800 rounded-xl shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Dashboard ({currentUser.name?.split(' ')[0] || 'User'})</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              {onLogout && (
                <motion.button
                  onClick={withHaptic('light', onLogout)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-10 px-3 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center"
                >
                  Logout
                </motion.button>
              )}
            </div>
          ) : (
            <>
              <motion.button
                onMouseEnter={() => softHaptic('tick')}
                onClick={withHaptic('light', () => onNavigate?.('auth', { targetIntent: 'officer', path: '/login?intent=officer' }))}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="h-10 px-3.5 text-xs xl:text-sm font-semibold text-slate-700 hover:text-[#102A43] hover:bg-slate-100 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center"
              >
                Officer Portal
              </motion.button>
              <motion.button
                onMouseEnter={() => softHaptic('tick')}
                onClick={withHaptic('light', () => onNavigate?.('auth', { targetIntent: 'login', path: '/login' }))}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="h-10 px-3.5 text-xs xl:text-sm font-semibold text-[#102A43] hover:text-[#006B3C] hover:bg-slate-100 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center"
              >
                Citizen Login
              </motion.button>
              <motion.button
                onMouseEnter={() => softHaptic('soft')}
                onClick={withHaptic('medium', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
                whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(19,136,8,0.32)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="js-btn-primary h-10 px-4 text-xs xl:text-sm font-bold bg-[#138808] hover:bg-[#006B3C] text-white rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span className="relative z-10">Raise Complaint</span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </motion.button>
            </>
          )}
        </div>

        {/* Mobile toggle (lg:hidden) */}
        <div className="flex items-center gap-2 lg:hidden">
          {!currentUser && (
            <motion.button
              onClick={withHaptic('medium', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
              whileTap={{ scale: 0.96 }}
              className="hidden sm:inline-flex h-10 px-3.5 text-xs font-bold bg-[#138808] text-white rounded-xl shadow-sm whitespace-nowrap items-center gap-1"
            >
              Raise Complaint <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
          <motion.button
            onClick={withHaptic('selection', () => setIsMobileMenuOpen(!isMobileMenuOpen))}
            whileTap={{ scale: 0.92 }}
            className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-[#102A43]" /> : <Menu className="w-6 h-6 text-[#102A43]" />}
          </motion.button>
        </div>
      </div>

      {/* ===== Mobile / tablet drawer (lg:hidden) ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="lg:hidden bg-white border-b-2 border-[#138808] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-6 space-y-4">
              {/* Page links */}
              <nav className="flex flex-col space-y-1 font-semibold text-slate-800 text-sm">
                {[{ id: 'home', label: 'Home', route: 'landing' }, ...NAV_ITEMS].map((item, idx) => {
                  const active = currentPage === item.route;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={go(item.route)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * idx, duration: 0.3, ease: EASE }}
                      className={`px-3 py-2.5 rounded-lg text-left flex items-center justify-between ${
                        active ? 'text-[#006B3C] bg-[#138808]/8' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && <ChevronRight className="w-4 h-4" />}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => { closeMobileMenu(); onNavigate?.(currentUser.role === 'ADMIN' ? 'admin-dashboard' : currentUser.role === 'OFFICER' ? 'officer-dashboard' : 'citizen-dashboard'); }}
                      className="w-full py-3 bg-[#102A43] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Dashboard ({currentUser.name})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {onLogout && (
                      <button
                        onClick={() => { closeMobileMenu(); onLogout(); }}
                        className="w-full py-2.5 text-xs font-bold text-red-600 border border-red-200 rounded-xl"
                      >
                        Logout
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={withHaptic('medium', () => { closeMobileMenu(); onNavigate?.('auth', { targetIntent: 'register', path: '/register' }); })}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3 bg-[#138808] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md"
                    >
                      Raise Complaint <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    <button
                      onClick={() => { closeMobileMenu(); onNavigate?.('auth', { targetIntent: 'login', path: '/login' }); }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#102A43] font-bold rounded-xl text-sm"
                    >
                      Citizen Login
                    </button>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => { closeMobileMenu(); onNavigate?.('auth', { targetIntent: 'officer', path: '/login?intent=officer' }); }}
                        className="py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center"
                      >
                        Officer Portal
                      </button>
                      <button
                        onClick={() => { closeMobileMenu(); onNavigate?.('admin-login', { path: '/admin/login' }); }}
                        className="py-2.5 bg-amber-50 border border-amber-300 text-slate-900 rounded-xl text-xs font-bold text-center"
                      >
                        Admin Login ↗
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Helpline strip — govt portal feel (consistent with topbar) */}
              <div className="pt-3 mt-1 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                <span>Helpline: <span className="font-bold text-[#006B3C]">1800-JAN-SAMADHAN</span></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}