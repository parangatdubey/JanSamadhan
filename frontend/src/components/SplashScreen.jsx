import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { softHaptic } from '../utils/haptics';
import JanSamadhanLogo from './JanSamadhanLogo';

/**
 * SplashScreen (simple version)
 *
 * Minimal government-style intro that mirrors the reference mockup:
 *   ┌─────────────────────────────────────┐
 *   │                                     │
 *   │      [JanSamadhanLogo]   (top)      │
 *   │                                     │
 *   │      [Ashoka emblem.png]  (center)  │
 *   │                                     │
 *   │      [Digital India logo] (bottom)  │
 *   │                                     │
 *   └─────────────────────────────────────┘
 *
 * Visual flow (~5.3 seconds total):
 *   0.0 - 0.4s : Cream background + tricolor top/bottom stripes fade in
 *   0.4 - 1.2s : Ashoka emblem scales + gently rotates in
 *   1.0 - 1.6s : JanSamadhan logo fades in at top
 *   2.0 - 2.6s : Digital India logo fades in at bottom
 *   2.6 - 4.8s : Hold — user reads emblem + tagline
 *   4.8 - 5.3s : Splash fades + scales + blurs out
 *
 * Props:
 *   - onDone: called after the splash fully finishes (defaults to no-op)
 *   - duration: total splash time in ms (default 5300)
 *   - showOnce: if true (default), sessionStorage prevents replay on reload
 */
export default function SplashScreen({
  onDone = () => {},
  duration = 5300,
  showOnce = true
}) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Skip animation if already shown this session
    if (showOnce && typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('jansamadhan_splash_seen') === '1') {
          setVisible(false);
          const t = setTimeout(() => onDone(), 0);
          return () => clearTimeout(t);
        }
      } catch (_) { /* sessionStorage might throw in private mode */ }
    }

    softHaptic('selection');

    const exitAt = duration - 500;     // start fading 500ms before end
    const doneAt = duration + 200;     // onDone fires after fade completes

    // Progress bar — animate 0 → 100 over the visible duration
    const start = Date.now();
    const visibleMs = exitAt;
    const raf = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / visibleMs) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(raf);
    }, 60);

    const t1 = setTimeout(() => setVisible(false), exitAt);
    const t2 = setTimeout(() => {
      if (showOnce && typeof window !== 'undefined') {
        try { sessionStorage.setItem('jansamadhan_splash_seen', '1'); } catch (_) {}
      }
      onDone();
    }, doneAt);

    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(raf); };
  }, [duration, showOnce, onDone]);

  const EASE = [0.22, 1, 0.36, 1];
  const EASE_SPRING = [0.34, 1.56, 0.64, 1];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-between py-10 sm:py-14"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #FFF8F0 0%, #FFE4D6 60%, #FCE7D5 100%)'
          }}
          role="dialog"
          aria-label="JanSamadhan — loading"
          aria-busy="true"
        >
          {/* Top tricolor stripe */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            className="absolute top-0 left-0 h-1.5 w-full tricolor-stripe"
            style={{ transformOrigin: 'left center' }}
          />

          {/* Bottom tricolor stripe */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            className="absolute bottom-0 left-0 h-1.5 w-full tricolor-stripe"
            style={{ transformOrigin: 'right center' }}
          />

          {/* ============ TOP: JanSamadhan Logo ============ */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 1.0 }}
            className="relative z-10 mt-2"
          >
            <JanSamadhanLogo size="lg" variant="light" showTagline={true} />
          </motion.div>

          {/* ============ CENTER: Ashoka Emblem PNG ============ */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -25 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.0, ease: EASE_SPRING, delay: 0.4 }}
            className="relative flex-1 flex items-center justify-center"
            style={{ filter: 'drop-shadow(0 12px 28px rgba(16,42,67,0.30))' }}
          >
            {/* Pulse ring around emblem */}
            <motion.span
              initial={{ scale: 0.85, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 m-auto w-40 h-40 rounded-full border-2 border-[#138808]/30 pointer-events-none"
            />

            <img
              src={`${import.meta.env.BASE_URL}Ashoka emblem.png`}
              alt="National Emblem of India — Lion Capital of Ashoka with Satyameva Jayate"
              className="relative w-36 sm:w-44 md:w-48 h-auto select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          </motion.div>

          {/* ============ BOTTOM: Digital India Logo + Progress ============ */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 2.0 }}
            className="relative z-10 flex flex-col items-center mb-2"
          >
            {/* Digital India logo PNG (from /public).
                Falls back gracefully to an inline SVG logo if the PNG is missing. */}
            <DigitalIndiaLogo />

            {/* Tricolor progress bar with % */}
            <div className="mt-4 w-56">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Loading</span>
                <span className="text-[10px] font-bold text-[#006B3C] tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  className="tricolor-stripe h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 *  DigitalIndiaLogo
 *  Renders the official Digital India logo PNG from /public if present,
 *  otherwise falls back to an inline SVG (fingerprint + wordmark).
 * ============================================================ */
function DigitalIndiaLogo() {
  const [imgOk, setImgOk] = useState(true);
  const src = `${import.meta.env.BASE_URL}digital-india.png`;

  if (imgOk) {
    return (
      <img
        src={src}
        alt="Digital India — Power to Empower"
        className="h-10 sm:h-12 w-auto select-none"
        style={{ objectFit: 'contain' }}
        draggable={false}
        onError={() => setImgOk(false)}
      />
    );
  }

  // Fallback inline SVG (fingerprint mark + "Digital India" wordmark)
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="diGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#006B3C" />
            <stop offset="100%" stopColor="#138808" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="none" stroke="url(#diGrad)" strokeWidth="1.4" />
        <circle cx="20" cy="20" r="13" fill="none" stroke="url(#diGrad)" strokeWidth="1.4" />
        <circle cx="20" cy="20" r="8"  fill="none" stroke="url(#diGrad)" strokeWidth="1.4" />
        <path d="M 20 2 L 20 38 M 2 20 L 38 20" stroke="url(#diGrad)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="3" fill="#006B3C" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-bold text-[#006B3C]">Digital India</span>
        <span className="text-[8px] text-slate-500 italic">Power to Empower</span>
      </div>
    </div>
  );
}