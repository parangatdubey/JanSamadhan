// ============================================================
// JanSamadhan — Haptics Utility
// Soft, subtle vibration feedback. Falls back gracefully on
// devices without Vibration API (desktops, iOS Safari, etc.)
// ============================================================

const isSupported = () =>
  typeof window !== 'undefined' &&
  'vibrate' in navigator &&
  typeof navigator.vibrate === 'function';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Soft "premium" patterns — gentle, not aggressive
const PATTERNS = {
  tick: 4,                // micro tick — link/nav hover
  selection: 3,           // chip / segment select
  light: 8,               // standard button press
  soft: 6,                 // card hover enter
  medium: 12,              // primary CTA tap
  success: [8, 28, 12],    // successful action
  warning: [10, 40, 10],   // caution
  error: [15, 50, 15, 50, 15], // failure
};

/**
 * Fire a haptic pattern.
 * @param {'tick'|'selection'|'light'|'soft'|'medium'|'success'|'warning'|'error'} pattern
 */
export function haptic(pattern = 'light') {
  if (!isSupported()) return;
  try {
    navigator.vibrate(PATTERNS[pattern] ?? PATTERNS.light);
  } catch (_) {
    /* no-op: haptics are best-effort */
  }
}

/**
 * Soft haptic — respects prefers-reduced-motion.
 * Use this for everyday interactions (button taps, card hovers).
 */
export function softHaptic(pattern = 'light') {
  if (prefersReducedMotion()) return;
  haptic(pattern);
}

/**
 * Helper: attach a soft press feedback to any onClick handler.
 * Usage:  onClick={withHaptic('medium', handleRegister)}
 */
export function withHaptic(pattern = 'light', handler) {
  return (event) => {
    softHaptic(pattern);
    if (typeof handler === 'function') return handler(event);
  };
}

export default haptic;