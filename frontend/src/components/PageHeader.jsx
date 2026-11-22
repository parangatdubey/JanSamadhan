import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { withHaptic } from '../utils/haptics';

/**
 * PageHeader — shared hero banner at the top of every interior page
 * (About / Why Trust / How It Works / Services / Contact).
 *
 * Renders a clean tricolor-accented page title with breadcrumb so users
 * always know where they are inside the portal.
 *
 * Props:
 *   - title:       main page title (e.g. "About JanSamadhan")
 *   - subtitle:    one-line description below title
 *   - badge:       small kicker above the title (e.g. "WHO WE ARE")
 *   - onNavigate:  (page) => void  — used for breadcrumb home link
 */
const EASE = [0.22, 1, 0.36, 1];

export default function PageHeader({ title, subtitle, badge, onNavigate }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#102A43] via-[#0b1c2d] to-[#102A43] text-white">
      {/* Tricolor accent strip on top */}
      <div className="h-1.5 w-full tricolor-stripe" />

      {/* Soft bokeh accents */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#FF9933]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#138808]/15 blur-3xl pointer-events-none" />

      <div className="gov-container relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 mb-4"
          aria-label="Breadcrumb"
        >
          <button
            onClick={withHaptic('tick', () => onNavigate?.('landing'))}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <span className="text-white font-semibold">{title}</span>
        </motion.nav>

        {/* Badge */}
        {badge && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
            className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-[#138808]/30 text-[#7CE38B] border border-[#138808]/40 mb-4"
          >
            {badge}
          </motion.span>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Bottom tricolor accent */}
      <div className="h-1 w-full tricolor-stripe opacity-50" />
    </section>
  );
}