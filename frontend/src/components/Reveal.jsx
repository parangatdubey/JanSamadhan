import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reveal — lightweight scroll-triggered animation wrapper.
 * Used by every interior page (About / Why Trust / How It Works / Services / Contact)
 * for consistent fade-up reveal of content blocks as the user scrolls.
 *
 * Props:
 *   - children:  content
 *   - variant:   'up' (default) | 'fade' | 'scale' | 'left' | 'right'
 *   - delay:     seconds of additional delay
 *   - className: passthrough
 *   - once:      animate only the first time it enters viewport (default true)
 *   - amount:    fraction of element visible before triggering (default 0.2)
 */
const EASE = [0.22, 1, 0.36, 1];

const VARIANTS = {
  up:    { hidden: { opacity: 0, y: 24 },                  show: { opacity: 1, y: 0 } },
  fade:  { hidden: { opacity: 0 },                         show: { opacity: 1 } },
  scale: { hidden: { opacity: 0, scale: 0.94 },            show: { opacity: 1, scale: 1 } },
  left:  { hidden: { opacity: 0, x: -28 },                 show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 28 },                  show: { opacity: 1, x: 0 } }
};

export default function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  once = true,
  amount = 0.2
}) {
  const v = VARIANTS[variant] || VARIANTS.up;
  return (
    <motion.div
      className={className}
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}