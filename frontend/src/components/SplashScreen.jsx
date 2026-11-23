import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { softHaptic } from '../utils/haptics';
import JanSamadhanLogo from './JanSamadhanLogo';

/**
 * SplashScreen
 *
 * Government-style introduction screen for JanSamadhan Portal.
 *
 * Lifecycle & Reliability:
 *   - Stable interval & watchdog timer based on wall-clock time (Date.now()).
 *   - Guaranteed progress forward progression: 0% -> 100% reliably.
 *   - Non-blocking: missing or slow images NEVER block progress or exit.
 *   - Double-guarded exit: automatic transition at completion + master fallback timer.
 *   - Instant "Skip Intro" option.
 *   - Session-persisted via sessionStorage ('jansamadhan_splash_seen').
 */

const EASE = [0.22, 1, 0.36, 1];
const EASE_SPRING = [0.34, 1.56, 0.64, 1];

export default function SplashScreen({
  onDone,
  duration = 4200,
  showOnce = true
}) {
  // Store onDone in a ref so changes never re-trigger or cancel the timer effect
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Synchronous initial check prevents 1-frame flicker if already viewed
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
  const hasFinishedRef = useRef(false);

  // Guaranteed single-execution finish callback
  const finish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    if (showOnce && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('jansamadhan_splash_seen', '1');
      } catch (_) {}
    }

    if (typeof onDoneRef.current === 'function') {
      try {
        onDoneRef.current();
      } catch (err) {
        console.warn('SplashScreen onDone error:', err);
      }
    }
  }, [showOnce]);

  // Instant skip handler
  const handleSkip = useCallback(() => {
    softHaptic('tick');
    setVisible(false);
    finish();
  }, [finish]);

  useEffect(() => {
    // If not visible initially, finish immediately
    if (!visible) {
      finish();
      return;
    }

    softHaptic('selection');

    const totalDuration = Math.max(1800, duration);
    const fadeOutAt = Math.max(1200, totalDuration - 600);
    const startTime = Date.now();

    // Wall-clock based interval guarantees forward progression without drift
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.round((elapsed / fadeOutAt) * 100));
      setProgress(currentPct);

      if (elapsed >= fadeOutAt) {
        clearInterval(intervalId);
        setProgress(100);
        setVisible(false);
      }
    }, 40);

    // Master watchdog timeout: guarantees completion even if interval throttles
    const watchdogId = setTimeout(() => {
      clearInterval(intervalId);
      setProgress(100);
      setVisible(false);
      finish();
    }, totalDuration + 600);

    return () => {
      clearInterval(intervalId);
      clearTimeout(watchdogId);
    };
  }, [visible, duration, finish]);

  return (
    <AnimatePresence onExitComplete={finish}>
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

          {/* Top-right Skip Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute top-4 right-4 z-20"
          >
            <button
              onClick={handleSkip}
              type="button"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white/85 hover:bg-white hover:text-slate-900 border border-slate-300 shadow-xs backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              aria-label="Skip splash screen"
            >
              Skip Intro &rarr;
            </button>
          </motion.div>

          {/* ============ TOP: JanSamadhan Logo ============ */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            className="relative z-10 mt-1"
          >
            <JanSamadhanLogo size="lg" variant="light" showTagline={true} />
          </motion.div>

          {/* ============ CENTER: Ashoka Emblem / Civic Seal ============ */}
          <motion.div
            initial={{ scale: 0.65, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.85, ease: EASE_SPRING, delay: 0.3 }}
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
            transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
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
 * Asynchronously checks for the official Ashoka Lion Capital PNG in /public.
 * Protected with an 800ms abort timer so missing or slow assets NEVER block
 * the portal or cause broken image displays.
 */
function AshokaEmblemDisplay() {
  const [useAsset, setUseAsset] = useState(false);
  const rawSrc = `${import.meta.env.BASE_URL}Ashoka emblem.png`;

  useEffect(() => {
    let active = true;
    const img = new Image();

    // 800ms abort timeout: if image hasn't loaded, safely default to SVG
    const timer = setTimeout(() => {
      if (active) setUseAsset(false);
    }, 800);

    img.onload = () => {
      clearTimeout(timer);
      if (active) setUseAsset(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      if (active) setUseAsset(false);
    };
    img.src = rawSrc;

    return () => {
      active = false;
      clearTimeout(timer);
    };
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
 * Dignified official government portal medallion adhering strictly to:
 * - Mathematical 24-spoke Ashoka Chakra (Dharma Chakra) in official Navy Blue (#000080).
 * - Sacred National Motto "सत्यमेव जयते" (Satyameva Jayate) in Devanagari script.
 * - Double concentric ceremonial bronze/gold borders and clean administrative typography.
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
 * Asynchronously checks for the official Digital India PNG in /public.
 * Protected with an 800ms abort timer so missing assets fall back seamlessly.
 */
function DigitalIndiaLogo() {
  const [useAsset, setUseAsset] = useState(false);
  const rawSrc = `${import.meta.env.BASE_URL}digital-india.png`;

  useEffect(() => {
    let active = true;
    const img = new Image();

    const timer = setTimeout(() => {
      if (active) setUseAsset(false);
    }, 800);

    img.onload = () => {
      clearTimeout(timer);
      if (active) setUseAsset(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      if (active) setUseAsset(false);
    };
    img.src = rawSrc;

    return () => {
      active = false;
      clearTimeout(timer);
    };
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
