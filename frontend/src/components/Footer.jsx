import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { softHaptic, withHaptic } from '../utils/haptics';
import JanSamadhanLogo from './JanSamadhanLogo';

/**
 * Footer — shared, government-style footer with contact info, quick links,
 * and official Govt-of-India disclaimer. Used on every public page.
 *
 * Props:
 *   - onNavigate: (page, options) => void
 */
const EASE = [0.22, 1, 0.36, 1];

const QUICK_LINKS = [
  { label: 'Home',          route: 'landing' },
  { label: 'About',         route: 'about' },
  { label: 'Why Trust',     route: 'why-trust' },
  { label: 'How It Works',  route: 'how-it-works' },
  { label: 'Services',      route: 'services' },
  { label: 'Contact',       route: 'contact' }
];

const PORTAL_LINKS = [
  { label: 'Citizen Login',        route: 'auth',   opts: { targetIntent: 'login',    path: '/login' } },
  { label: 'Register a Complaint', route: 'auth',   opts: { targetIntent: 'register',path: '/register' } }
];

export default function Footer({ onNavigate }) {
  return (
    <footer className="mt-auto bg-[#102A43] text-slate-300 text-xs border-t border-slate-800 relative overflow-hidden">
      {/* Top tricolor accent */}
      <div className="h-1 w-full tricolor-stripe" />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #FF9933 0, transparent 40%), radial-gradient(circle at 80% 70%, #138808 0, transparent 40%)' }} />

      <div className="gov-container relative py-12 px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <JanSamadhanLogo size="md" variant="dark" showTagline={true} onClick={withHaptic('tick', () => onNavigate?.('landing'))} />
            <p className="mt-4 text-slate-400 leading-relaxed max-w-xs">
              JanSamadhan is an online grievance redressal portal empowering citizens to
              raise, track and resolve complaints against government departments — transparently and on time.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <img
                src={`${import.meta.env.BASE_URL}digital-india.png`}
                alt="Digital India"
                className="h-8 w-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={withHaptic('tick', () => onNavigate?.(l.route))}
                    onMouseEnter={() => softHaptic('tick')}
                    className="hover:text-white transition-colors flex items-center gap-1 text-left"
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Portals</h4>
            <ul className="space-y-2">
              {PORTAL_LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={withHaptic('tick', () => onNavigate?.(l.route, l.opts))}
                    onMouseEnter={() => softHaptic('tick')}
                    className="hover:text-white transition-colors flex items-center gap-1 text-left"
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Contact Us</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 mt-0.5 text-[#FF9933] flex-shrink-0" />
                <span>Helpline: <span className="font-bold text-white">1800-JAN-SAMADHAN</span></span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-0.5 text-[#FF9933] flex-shrink-0" />
                <span>help@jansamadhan.gov.in</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#FF9933] flex-shrink-0" />
                <span>Department of Administrative Reforms &amp; Public Grievances, New Delhi - 110001</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 mt-0.5 text-[#FF9933] flex-shrink-0" />
                <span>www.jansamadhan.gov.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} JanSamadhan. Government of India. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={withHaptic('tick', () => onNavigate?.('about'))}       className="hover:text-white transition-colors">About</button>
            <button onClick={withHaptic('tick', () => onNavigate?.('contact'))}    className="hover:text-white transition-colors">Contact</button>
            <span className="opacity-60">|</span>
            <span>Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}