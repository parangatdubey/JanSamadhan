import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, ShieldCheck } from 'lucide-react';
import { withHaptic } from '../utils/haptics';

/**
 * PageHeader — shared premium hero banner at the top of every interior page
 * (About / Why Trust / How It Works / Services / Contact).
 *
 * Theme: light saffron-to-mint gradient on cream background (matches the
 * JanSamadhan landing page). Dark slate text for maximum readability —
 * NO dark navy band, NO duplicate tricolor stripe (the Navbar already
 * carries the tricolor accent, so we only add one thin divider here).
 *
 * Props:
 *   - title:       main page title (e.g. "About JanSamadhan")
 *   - subtitle:    one-line description below title
 *   - badge:       small kicker above the title (e.g. "WHO WE ARE")
 *   - onNavigate:  (page) => void  — used for breadcrumb home link
 *   - accent:      'green' | 'saffron' | 'gold'  (default green)
 *   - stats:       optional array of {label, value} for hero stat row
 *   - icon:        optional lucide-react icon component
 */
const EASE = [0.22, 1, 0.36, 1];

const ACCENT_MAP = {
  green:   { color: '#138808', deep: '#006B3C', badgeBg: 'rgba(19, 136, 8, 0.10)',  badgeText: '#006B3C', badgeBorder: 'rgba(19, 136, 8, 0.30)', statText: '#006B3C' },
  saffron: { color: '#FF9933', deep: '#E68A2E', badgeBg: 'rgba(255, 153, 51, 0.12)', badgeText: '#E68A2E', badgeBorder: 'rgba(255, 153, 51, 0.35)', statText: '#E68A2E' },
  gold:    { color: '#C99700', deep: '#8A6508', badgeBg: 'rgba(212, 175, 55, 0.14)', badgeText: '#8A6508', badgeBorder: 'rgba(212, 175, 55, 0.40)', statText: '#8A6508' }
};

export default function PageHeader({ title, subtitle, badge, onNavigate, accent = 'green', stats = [], icon: Icon }) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.green;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EC] via-[#F5F9F6] to-[#ECFDF5]">
      {/* Soft warm bokeh accents (saffron + green, no blue) */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FF9933]/15 blur-3xl pointer-events-none animate-[js-blob-drift_18s_var(--js-ease)_infinite]" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#138808]/12 blur-3xl pointer-events-none animate-[js-blob-drift_22s_var(--js-ease)_infinite]" style={{ animationDelay: '3s' }} />

      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />

      <div className="gov-container relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 mb-5"
          aria-label="Breadcrumb"
        >
          <button
            onClick={withHaptic('tick', () => onNavigate?.('landing'))}
            className="flex items-center gap-1 hover:text-[#006B3C] transition-colors font-semibold"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-400" />
          <span className="text-[#102A43] font-bold">{title}</span>
        </motion.nav>

        {/* Badge row with icon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
          className="flex items-center gap-3 mb-5 flex-wrap"
        >
          {badge && (
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase border"
              style={{
                background: a.badgeBg,
                color: a.badgeText,
                borderColor: a.badgeBorder
              }}
            >
              {Icon ? <Icon className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {badge}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] js-blink" />
            Government of India Initiative
          </span>
        </motion.div>

        {/* Title — dark slate for max contrast on light bg */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl text-[#102A43]"
        >
          {title}
        </motion.h1>

        {/* Tricolor underline accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
          style={{ transformOrigin: 'left center' }}
          className="mt-5 h-1 w-28 rounded-full"
        >
          <div className="h-full w-full tricolor-stripe rounded-full" />
        </motion.div>

        {/* Subtitle — slate-700 for readability */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            className="mt-6 text-sm sm:text-base lg:text-lg text-slate-700 max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Stats row — white cards on light bg, dark stat numbers */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
            className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl"
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.45 + i * 0.07 }}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm"
              >
                <div
                  className="text-xl sm:text-2xl lg:text-3xl font-black tabular-nums"
                  style={{ color: a.statText }}
                >
                  {s.value}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-600 font-semibold mt-1 leading-tight">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Single thin tricolor divider at the bottom — no full stripe band */}
      <div className="h-0.5 w-full tricolor-stripe opacity-70" />
    </section>
  );
}