import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { softHaptic } from '../utils/haptics';
import JanSamadhanLogo from './JanSamadhanLogo';

/**
 * SplashScreen
 *
 * Dignified, government-style portal introduction for JanSamadhan:
 *   ┌────────────────────────────────────────────────────────┐
 *   │  [JanSamadhan Logo]              [Skip Intro ->]       │
 *   │                                                        │
 *   │     [Official Civic Emblem / Dharma Chakra Seal]       │
 *   │                                                        │
 *   │  [Digital India Logo]                                  │
 *   │  [=== Tricolor Loading Progress Bar ===]               │
 *   └────────────────────────────────────────────────────────┘
 *
 * Lifecycle:
 *   - Runs once per browser session (recorded in sessionStorage).
 *   - Total duration: ~5.3s (progress bar reaches 100% at ~4.8s, then smooth fade/blur exit).
 *   - User can skip at any time using the "Skip Intro" button.
 *   - Gracefully handles missing or slow image assets with authentic vector fallbacks.
 *   - Zero DOM interference or route disruption once dismissed.
 */

const EASE = [0.22, 1, 0.36, 1];
const EASE_SPRING = [0.34, 1.56, 0.64, 1];

export default function SplashScreen({
  onDone = () => {},
  duration = 5300,
  showOnce = true
}) {
  // Synchronous initialization prevents 1-frame flash on session reloads
  const [visible, setVisible] = useState(() => {
    if (showOnce && typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('jansamadhan_splash_seen') === '1') {
          return false;
        }
      } catch (_) {}
    }
    return true;
  });

  const [progress, setProgress] = useState(0);

  const markSeenAndFinish = useCallback(() => {
    if (showOnce && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('jansamadhan_splash_seen', '1');
      } catch (_) {}
    }
    onDone();
  }, [showOnce, onDone]);

  const handleSkip = useCallback(() => {
    softHaptic('tick');
    setVisible(false);
    markSeenAndFinish();
  }, [markSeenAndFinish]);

  useEffect(() => {
    // If already marked as seen, exit immediately
    if (!visible) {
      const t = setTimeout(() => onDone(), 0);
      return () => clearTimeout(t);
    }

    softHaptic('selection');

    const exitAt = Math.max(1000, duration - 500);
    const doneAt = duration + 200;

    // Progress bar animation 0 -> 100%
    const start = Date.now();
    const visibleMs = exitAt;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / visibleMs) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);

    const t1 = setTimeout(() => setVisible(false), exitAt);
    const t2 = setTimeout(() => {
      markSeenAndFinish();
    }, doneAt);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [visible, duration, markSeenAndFinish, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-between py-8 sm:py-12 px-4"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #FFFBF5 0%, #FFF2E6 60%, #FCE8D8 100%)'
          }}
          role="dialog"
          aria-label="JanSamadhan — Portal Initialization"
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

          {/* Top Skip Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute top-4 right-4 z-20"
          >
            <button
              onClick={handleSkip}
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white hover:text-slate-900 border border-slate-300/80 shadow-xs backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              aria-label="Skip splash screen"
            >
              Skip Intro &rarr;
            </button>
          </motion.div>

          {/* ============ TOP: JanSamadhan Logo ============ */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
            className="relative z-10 mt-1"
          >
            <JanSamadhanLogo size="lg" variant="light" showTagline={true} />
          </motion.div>

          {/* ============ CENTER: Ashoka Emblem / Civic Seal ============ */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.9, ease: EASE_SPRING, delay: 0.4 }}
            className="relative flex-1 flex items-center justify-center my-2"
          >
            {/* Animated Pulse Rings */}
            <motion.span
              initial={{ scale: 0.85, opacity: 0.4 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 m-auto w-40 sm:w-48 h-40 sm:h-48 rounded-full border-2 border-[#138808]/30 pointer-events-none"
            />
            <motion.span
              initial={{ scale: 0.7, opacity: 0.3 }}
              animate={{ scale: 1.25, opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
              className="absolute inset-0 m-auto w-36 sm:w-44 h-36 sm:h-44 rounded-full border border-[#FF9933]/30 pointer-events-none"
            />

            <AshokaEmblemDisplay />
          </motion.div>

          {/* ============ BOTTOM: Digital India + Progress ============ */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
            className="relative z-10 flex flex-col items-center mb-1 w-full max-w-xs"
          >
            <DigitalIndiaLogo />

            {/* Tricolor progress bar */}
            <div className="mt-4 w-full px-2">
              <div className="flex justify-between items-center mb-1.5 text-slate-600">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Initializing Portal
                </span>
                <span className="text-[11px] font-extrabold text-[#006B3C] tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-white/70 rounded-full overflow-hidden shadow-inner border border-slate-200/60">
                <motion.div
                  className="tricolor-stripe h-full rounded-full transition-all duration-75"
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

/**
 * AshokaEmblemDisplay
 *
 * Preloads the official Ashoka Lion Capital PNG if present in /public.
 * If the PNG asset is missing or blocked, gracefully renders the authentic
 * Civic Dharma Chakra seal with Satyameva Jayate to avoid broken images.
 */
function AshokaEmblemDisplay() {
  const [useAsset, setUseAsset] = useState(false);
  const rawSrc = `${import.meta.env.BASE_URL}Ashoka emblem.png`;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setUseAsset(true);
    img.onerror = () => setUseAsset(false);
    img.src = rawSrc;
  }, [rawSrc]);

  if (useAsset) {
    return (
      <img
        src={rawSrc}
        alt="National Emblem of India — Lion Capital of Ashoka with Satyameva Jayate"
        className="relative w-36 sm:w-44 md:w-48 h-auto select-none drop-shadow-xl"
        style={{ objectFit: 'contain' }}
        draggable={false}
      />
    );
  }

  return <CivicDharmaChakraSeal />;
}

/**
 * CivicDharmaChakraSeal
 *
 * Authentic, dignified government portal medallion adhering strictly to:
 * - Mathematical 24-spoke Ashoka Chakra (Dharma Chakra) in official Navy Blue (#000080).
 * - Sacred National Motto "सत्यमेव जयते" (Satyameva Jayate) in Devanagari script.
 * - Double concentric ceremonial bronze/gold borders and clean administrative typography.
 * - Does not fabricate unofficial lion drawings, maintaining complete respect.
 */
function CivicDharmaChakraSeal() {
  return (
    <div className="relative flex flex-col items-center justify-center select-none drop-shadow-xl">
      <svg
        viewBox="0 0 200 200"
        className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48"
        aria-label="Civic Seal of Grievance Redressal — Satyameva Jayate"
      >
        <defs>
          <linearGradient id="sealBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C99700" />
            <stop offset="50%" stopColor="#8A6508" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <radialGradient id="sealCenterBg" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#F9EDE0" />
          </radialGradient>
          <path
            id="curvedGovtPath"
            d="M 28 98 A 72 72 0 0 1 172 98"
            fill="none"
          />
        </defs>

        {/* Outer Circular Medallion */}
        <circle cx="100" cy="100" r="95" fill="url(#sealCenterBg)" />
        <circle cx="100" cy="100" r="95" fill="none" stroke="url(#sealBorder)" strokeWidth="3" />
        <circle cx="100" cy="100" r="89" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 2" />

        {/* Top Curved Official Header */}
        <text fill="#102A43" fontSize="8.2" fontWeight="700" letterSpacing="1.8">
          <textPath href="#curvedGovtPath" startOffset="50%" textAnchor="middle">
            भारत सरकार • GOVERNMENT OF INDIA
          </textPath>
        </text>

        {/* Center: Ashoka Chakra (Dharma Chakra with 24 Spokes) */}
        <g transform="translate(0, 4)">
          {/* Outer Rim */}
          <circle cx="100" cy="80" r="25" fill="none" stroke="#000080" strokeWidth="2.4" />

          {/* 24 Mathematical Spokes */}
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="80"
              x2="100"
              y2="55"
              stroke="#000080"
              strokeWidth="1.3"
              strokeLinecap="round"
              transform={`rotate(${i * 15} 100 80)`}
            />
          ))}

          {/* Central Hub & White Core */}
          <circle cx="100" cy="80" r="5" fill="#000080" />
          <circle cx="100" cy="80" r="1.8" fill="#FFFFFF" />
        </g>

        {/* National Motto: सत्यमेव जयते */}
        <text
          x="100"
          y="136"
          textAnchor="middle"
          fill="#102A43"
          fontSize="12.5"
          fontWeight="800"
          fontFamily="'Tiro Devanagari Hindi', 'Noto Serif Devanagari', 'Mangal', serif"
          letterSpacing="0.8"
        >
          सत्यमेव जयते
        </text>

        {/* Romanized Motto & Subtitle */}
        <text
          x="100"
          y="151"
          textAnchor="middle"
          fill="#006B3C"
          fontSize="7"
          fontWeight="800"
          letterSpacing="1.4"
        >
          SATYAMEVA JAYATE
        </text>

        <text
          x="100"
          y="163"
          textAnchor="middle"
          fill="#627D98"
          fontSize="6.2"
          fontWeight="700"
          letterSpacing="1.2"
        >
          PUBLIC GRIEVANCE REDRESSAL
        </text>

        {/* Bottom Tricolor Decorative Arc */}
        <path
          d="M 65 178 Q 100 188 135 178"
          fill="none"
          stroke="#138808"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="100" cy="183" r="2.2" fill="#FF9933" />
      </svg>
    </div>
  );
}

/**
 * DigitalIndiaLogo
 *
 * Preloads the official Digital India PNG if present in /public.
 * If missing, falls back to the official geometry inline SVG logo with tagline.
 */
function DigitalIndiaLogo() {
  const [useAsset, setUseAsset] = useState(false);
  const rawSrc = `${import.meta.env.BASE_URL}digital-india.png`;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setUseAsset(true);
    img.onerror = () => setUseAsset(false);
    img.src = rawSrc;
  }, [rawSrc]);

  if (useAsset) {
    return (
      <img
        src={rawSrc}
        alt="Digital India — Power to Empower"
        className="h-9 sm:h-11 w-auto select-none"
        style={{ objectFit: 'contain' }}
        draggable={false}
      />
    );
  }

  // Graceful fallback inline SVG (fingerprint mark + "Digital India" wordmark)
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200/60 shadow-2xs">
      <svg width="26" height="26" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="diGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#006B3C" />
            <stop offset="100%" stopColor="#138808" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="none" stroke="url(#diGrad)" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="13" fill="none" stroke="url(#diGrad)" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="8" fill="none" stroke="url(#diGrad)" strokeWidth="1.5" />
        <path d="M 20 2 L 20 38 M 2 20 L 38 20" stroke="url(#diGrad)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="3" fill="#006B3C" />
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-xs font-black tracking-tight text-[#006B3C]">
          Digital India
        </span>
        <span className="text-[8.5px] font-semibold text-slate-500 italic">
          Power To Empower
        </span>
      </div>
    </div>
  );
}
