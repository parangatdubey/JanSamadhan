import React, { useRef } from 'react';
import { softHaptic } from '../utils/haptics';

/**
 * Module-level tap counter — shared across ALL JanSamadhanLogo instances
 * (navbar logo + landing action-section logo) so the hidden easter-egg
 * threshold is reached no matter which logo the owner taps.
 *
 * The counter is intentionally invisible: no on-screen cue while tapping,
 * only a single confirmation haptic + the parent's chooser modal on success.
 */
const SECRET_TAPS = 5;        // number of taps required
const SECRET_WINDOW = 1800;   // ms window in which all taps must occur
const _secretTapTimes = [];

export default function JanSamadhanLogo({
  size = 'md',
  variant = 'light',
  showTagline = true,
  onClick,
  onSecretTrigger
}) {
  const lastTrigger = useRef(0);

  const handleClick = (e) => {
    // ---- Hidden staff-access easter-egg (5 quick taps) ----
    if (onSecretTrigger) {
      const now = Date.now();
      // prune taps older than the window
      while (_secretTapTimes.length && now - _secretTapTimes[0] > SECRET_WINDOW) {
        _secretTapTimes.shift();
      }
      _secretTapTimes.push(now);
      const count = _secretTapTimes.length;

      if (count >= SECRET_TAPS) {
        // throttle: don't re-trigger more than once per second
        if (now - lastTrigger.current > 1000) {
          lastTrigger.current = now;
          _secretTapTimes.length = 0;
          softHaptic('medium');
          onSecretTrigger();
        } else {
          _secretTapTimes.length = 0;
        }
        return; // do NOT also fire normal navigation on the trigger tap
      }
      // subtle tactile escalation from the 3rd tap onward (mobile only)
      if (count >= 3) softHaptic('soft');
    }

    // ---- Normal single-click behaviour (navigate home, etc.) ----
    if (onClick) onClick(e);
  };
  // Sizes: sm, md, lg
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconDim = isSm ? 'w-8 h-8 sm:w-9 sm:h-9' : isLg ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11';
  const titleSize = isSm ? 'text-sm sm:text-base' : isLg ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg';
  const taglineSize = isSm ? 'text-[9px] sm:text-[10px]' : isLg ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]';

  const isDarkVariant = variant === 'dark'; // for dark background

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center space-x-2.5 sm:space-x-3 select-none flex-shrink-0 ${(onClick || onSecretTrigger) ? 'cursor-pointer' : ''}`}
    >
      {/* Emblem / Shield with Tricolor & Resolution Checkmark */}
      <div className={`relative ${iconDim} rounded-xl bg-gradient-to-br from-[#102A43] to-[#0b1c2d] flex items-center justify-center p-0.5 shadow-md border border-white/20 overflow-hidden flex-shrink-0`}>
        {/* Subtle Indian Tricolor arcs */}
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#FF9933]/30 blur-sm pointer-events-none"></div>
        <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-[#138808]/30 blur-sm pointer-events-none"></div>

        {/* Civic Emblem Graphic: Shield + Checkmark */}
        <svg viewBox="0 0 40 40" className="w-full h-full p-1 drop-shadow">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9933" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#138808" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#FF8F00" />
            </linearGradient>
          </defs>

          {/* Shield outline */}
          <path
            d="M20 3 L34 8 C34 22 25 32 20 37 C15 32 6 22 6 8 Z"
            fill="none"
            stroke="url(#shieldGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner Civic Core: Two citizen silhouettes merged into harmony */}
          <circle cx="20" cy="14" r="3.2" fill="#FFFFFF" />
          <path
            d="M13 24 C13 19 16 18 20 18 C24 18 27 19 27 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Resolution Badge & Checkmark */}
          <circle cx="25" cy="25" r="4.8" fill="#138808" stroke="#FFFFFF" strokeWidth="1.2" />
          <path
            d="M23 25 L24.5 26.5 L27.5 23.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Typography: JAN SAMADHAN + Tagline */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap">
          <span className={`font-black tracking-tight ${titleSize} ${isDarkVariant ? 'text-white' : 'text-[#102A43]'}`}>
            JAN
          </span>
          <span className={`font-extrabold tracking-tight ${titleSize} ${isDarkVariant ? 'text-[#FF9933]' : 'text-[#006B3C]'}`}>
            SAMADHAN
          </span>
        </div>

        {showTagline && (
          <span className={`font-medium tracking-normal ${taglineSize} ${isDarkVariant ? 'text-slate-300' : 'text-slate-600'} whitespace-nowrap hidden xs:block sm:block`}>
            समाधान आपके अधिकार का
          </span>
        )}
      </div>
    </div>
  );
}