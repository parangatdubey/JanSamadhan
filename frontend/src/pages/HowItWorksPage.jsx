import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Mic, FileText, Cpu, Route, CheckCircle2,
  ArrowRight, Clock, Zap, ShieldCheck, Eye, Bell, Camera, MapPin, Languages, Search, Award
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { softHaptic, withHaptic } from '../utils/haptics';

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: i * 0.08 } })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: (i = 0) => ({ opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE, delay: i * 0.07 } })
};

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const childFade = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};

/* 4-step process — expanded with richer content */
const STEPS = [
  {
    num: '01',
    bg: 'from-[#006B3C] to-[#138808]',
    accent: '#006B3C',
    badge: 'Authentication',
    badgeColor: '#7CE38B',
    title: 'Register or Login',
    icon: UserPlus,
    desc: 'Citizens create a secure account or log in instantly using Google OAuth 2.0 (one-tap) or their 10-digit Indian mobile number with Bcrypt-encrypted password.',
    duration: '~30 seconds',
    bullets: ['Google one-tap sign-in', 'Phone + password', 'JWT secured session'],
    stats: { value: '30s', label: 'To onboard' }
  },
  {
    num: '02',
    bg: 'from-[#006B3C] to-[#138808]',
    accent: '#138808',
    badge: 'Submission',
    badgeColor: '#7CE38B',
    title: 'Submit Complaint',
    icon: Mic,
    desc: 'Citizens report issues by typing in any regional language, speaking via microphone voice input that gets transcribed automatically, or attaching photos and GPS location as evidence.',
    duration: '~2 minutes',
    bullets: ['Multilingual text or voice', 'Photo & GPS evidence', 'AI-assisted category hint'],
    stats: { value: '22+', label: 'Languages' }
  },
  {
    num: '03',
    bg: 'from-[#FF9933] to-[#E68A2E]',
    accent: '#FF9933',
    textDark: true,
    badge: 'AI Processing',
    badgeColor: '#92400E',
    title: 'NLP & Smart Routing',
    icon: Cpu,
    desc: 'The NLP system detects language, standardizes to formal English for officers, categorizes the grievance into the correct department, assigns priority, and auto-routes to the nodal officer — all in seconds.',
    duration: '<3 seconds',
    bullets: ['Language detection & translation', 'Auto category + priority', 'Direct nodal officer routing'],
    stats: { value: '<3s', label: 'AI triage time' }
  },
  {
    num: '04',
    bg: 'from-[#006B3C] to-[#138808]',
    accent: '#006B3C',
    badge: 'Resolution',
    badgeColor: '#7CE38B',
    title: 'Track Resolution',
    icon: CheckCircle2,
    desc: 'Citizens monitor complaint status in real-time, view official inspection notes and timestamped updates, and confirm closure with photographic proof — full transparency from start to finish.',
    duration: 'Real-time',
    bullets: ['Live status timeline', 'Official inspection remarks', 'Closure with photo proof'],
    stats: { value: '100%', label: 'Audit trail' }
  }
];

/* Process highlights */
const HIGHLIGHTS = [
  { icon: Zap,        title: 'Instant Triage',     desc: 'AI categorization completes in under three seconds, replacing days of manual sorting.', color: '#FF9933' },
  { icon: Languages,  title: 'Multilingual NLP',   desc: 'Accepts 22+ scheduled languages and standardizes to formal English for officers.', color: '#138808' },
  { icon: Eye,        title: 'Live Transparency',  desc: 'Every status change is logged with timestamp, officer name, and remark.', color: '#1d4ed8' },
  { icon: Bell,       title: 'Real-time Alerts',   desc: 'Citizens receive notifications at each milestone — submission, assignment, inspection, resolution.', color: '#0d9488' }
];

/* Submission input options */
const INPUT_OPTIONS = [
  { icon: FileText,   title: 'Text Input',     desc: 'Type your complaint in Hindi, English, Bhojpuri, Marathi, Bengali, Tamil, Telugu or any scheduled language.' },
  { icon: Mic,        title: 'Voice Recording',desc: 'Speak naturally into your microphone — the system transcribes and translates your voice into formal English for officers.' },
  { icon: Camera,     title: 'Photo Evidence', desc: 'Attach live photographs of the issue — broken streetlights, water leakage, garbage piles, potholes, and more.' },
  { icon: MapPin,     title: 'GPS Location',   desc: 'Tag the exact location of the grievance so officers can locate and inspect the site quickly.' }
];

/* Status pipeline */
const PIPELINE = [
  { label: 'Submitted',     color: '#64748B', icon: FileText },
  { label: 'Under Review',  color: '#1d4ed8', icon: Search },
  { label: 'Assigned',      color: '#FF9933', icon: Route },
  { label: 'In Progress',   color: '#0d9488', icon: Cpu },
  { label: 'Resolved',      color: '#138808', icon: CheckCircle2 }
];

/* Stats header */
const STATS = [
  { value: '4',    label: 'Transparent Steps' },
  { value: '<3s',  label: 'AI Triage Time' },
  { value: '22+',  label: 'Languages' },
  { value: '100%', label: 'Audit Trail' }
];

export default function HowItWorksPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="how-it-works" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="HOW IT WORKS"
        title="How JanSamadhan Works"
        subtitle="From submission to ground resolution in four transparent, automated steps — engineered for speed, accountability, and accessibility."
        onNavigate={onNavigate}
        accent="saffron"
        icon={Zap}
        stats={STATS}
      />

      <main className="flex-1">

        {/* ===== SECTION 1: Intro ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20 text-center relative">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#FF9933]/8 blur-3xl pointer-events-none" />
          <Reveal className="max-w-3xl mx-auto relative">
            <span className="js-eyebrow js-eyebrow-saffron mb-5 inline-flex">
              <Clock className="w-3.5 h-3.5" /> Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102A43] tracking-tight leading-[1.1]">
              From complaint to closure — <span className="js-text-tricolor">in four transparent steps</span>.
            </h2>
            <div className="js-ornament mt-5">
              <span className="text-[#D4AF37] text-xs">✦</span>
            </div>
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
              Every grievance travels through the same rigorous pipeline: secure authentication, multilingual submission, AI-powered triage, and fully transparent resolution — with every step logged on a tamper-proof audit trail.
            </p>
          </Reveal>
        </section>

        {/* ===== SECTION 2: 4-step vertical timeline ===== */}
        <section className="gov-container px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="relative">
            {/* Vertical timeline line — desktop */}
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF9933] via-[#138808] to-[#006B3C] rounded-full opacity-30" />

            <div className="space-y-10 lg:space-y-16">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isLeft = idx % 2 === 0;
                return (
                  <div key={idx} className={`relative lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center ${isLeft ? '' : 'lg:[direction:rtl]'}`}>
                    {/* Center node */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.bg} text-white font-black text-base flex items-center justify-center shadow-xl border-4 border-white`}
                      >
                        {step.num}
                      </motion.div>
                      <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: step.accent }} />
                    </div>

                    {/* Card */}
                    <Reveal variant={isLeft ? 'left' : 'right'} className={isLeft ? 'lg:pr-12 [direction:ltr]' : 'lg:pl-12 lg:col-start-2 [direction:ltr]'}>
                      <motion.div
                        onMouseEnter={() => softHaptic('soft')}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="js-lift bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden relative group"
                      >
                        {/* Top color band */}
                        <div className={`h-2 bg-gradient-to-r ${step.bg}`} />

                        <div className="p-6 sm:p-8">
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                              <motion.div
                                whileHover={{ rotate: 8, scale: 1.1 }}
                                transition={{ duration: 0.4, ease: EASE }}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${step.bg} flex items-center justify-center shadow-lg ${step.textDark ? 'text-[#102A43]' : 'text-white'}`}
                              >
                                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                              </motion.div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: step.badgeColor }}>
                                  {step.badge}
                                </span>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#102A43] tracking-tight leading-tight">{step.title}</h3>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: step.accent }}>
                                {step.stats.value}
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{step.stats.label}</div>
                            </div>
                          </div>

                          <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-5">
                            {step.desc}
                          </p>

                          {/* Bullets */}
                          <ul className="space-y-2 mb-5">
                            {step.bullets.map((b, bi) => (
                              <li key={bi} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: step.accent }} />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Duration chip */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5" style={{ color: step.accent }} />
                            {step.duration}
                          </div>
                        </div>

                        {/* Number watermark */}
                        <span className="absolute bottom-4 right-5 text-7xl font-black text-slate-50 select-none pointer-events-none group-hover:text-slate-100 transition-colors">
                          {step.num}
                        </span>
                      </motion.div>
                    </Reveal>

                    {/* Spacer for the empty half on desktop */}
                    <div className="hidden lg:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: Submission input options ===== */}
        <section className="bg-gradient-to-b from-white to-[#F5F9F6] border-y border-slate-200 py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 js-dot-pattern opacity-40 pointer-events-none" />
          <div className="gov-container relative px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow mb-4 inline-flex">
                <Mic className="w-3.5 h-3.5" /> Submission Methods
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Speak. Type. Snap. Tag.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Every citizen can submit a complaint in the way most natural to them — no technical literacy required, no English mandatory.
              </p>
            </Reveal>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            >
              {INPUT_OPTIONS.map((opt, idx) => {
                const Icon = opt.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={childFade}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="js-lift-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative group text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 4 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#FF9933]/15 to-[#138808]/10 text-[#006B3C] flex items-center justify-center mb-4 border border-[#138808]/20"
                    >
                      <Icon className="w-7 h-7" />
                    </motion.div>
                    <h3 className="font-bold text-[#102A43] text-sm sm:text-base mb-2">{opt.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{opt.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 4: Status pipeline visual ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-24">
          <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <span className="js-eyebrow js-eyebrow-navy mb-4 inline-flex">
              <Eye className="w-3.5 h-3.5" /> Status Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
              Track every stage — live
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Every complaint travels through these five stages. Citizens see the current stage, the officer assigned, and the timestamp of each transition.
            </p>
          </Reveal>

          <Reveal variant="scale">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 relative overflow-hidden">
              {/* Desktop horizontal pipeline */}
              <div className="hidden md:flex items-center justify-between gap-2 relative">
                {PIPELINE.map((stage, idx) => {
                  const Icon = stage.icon;
                  return (
                    <React.Fragment key={idx}>
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: EASE, delay: idx * 0.12 }}
                        className="flex flex-col items-center gap-3 text-center relative z-10 flex-shrink-0"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                          style={{ background: stage.color }}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#102A43]">{stage.label}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Stage {idx + 1}</span>
                      </motion.div>
                      {idx < PIPELINE.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, ease: EASE, delay: idx * 0.12 + 0.3 }}
                          style={{ transformOrigin: 'left center' }}
                          className="flex-1 h-1 rounded-full"
                        >
                          <div className="h-full w-full bg-gradient-to-r rounded-full" style={{ background: `linear-gradient(90deg, ${stage.color}, ${PIPELINE[idx + 1].color})` }} />
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mobile vertical pipeline */}
              <div className="md:hidden space-y-4">
                {PIPELINE.map((stage, idx) => {
                  const Icon = stage.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, ease: EASE, delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                          style={{ background: stage.color }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {idx < PIPELINE.length - 1 && <div className="w-0.5 h-8 bg-slate-200 mt-1" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stage {idx + 1}</span>
                        <div className="font-bold text-[#102A43] text-sm">{stage.label}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===== SECTION 5: Process highlights ===== */}
        <section className="bg-gradient-to-b from-[#F5F9F6] to-white border-t border-slate-200 py-16 sm:py-24">
          <div className="gov-container px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow js-eyebrow-gold mb-4 inline-flex">
                <Award className="w-3.5 h-3.5" /> Engineered Advantages
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Why this pipeline beats traditional grievance systems
              </h2>
            </Reveal>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            >
              {HIGHLIGHTS.map((h, idx) => {
                const Icon = h.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={childFade}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40" style={{ background: h.color }} />
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                      style={{ background: `${h.color}15`, color: h.color, border: `1px solid ${h.color}33` }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-[#102A43] text-sm sm:text-base mb-2 relative">{h.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed relative">{h.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 6: CTA ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF9933] via-[#E68A2E] to-[#138808] p-8 sm:p-12 lg:p-14 text-center text-white shadow-2xl">
              <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />
              <div className="absolute -top-10 right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-40 h-40 rounded-full bg-[#102A43]/20 blur-3xl pointer-events-none" />

              <div className="relative">
                <ShieldCheck className="w-12 h-12 text-white mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 max-w-3xl mx-auto leading-tight">
                  Ready to file your first complaint?
                </h2>
                <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto mb-8">
                  It takes less than two minutes from sign-up to submission. Your complaint reaches the right officer before you finish your tea.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.button
                    onClick={withHaptic('medium', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
                    onMouseEnter={() => softHaptic('soft')}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="js-btn-primary inline-flex items-center gap-2 px-7 py-3.5 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-xl shadow-xl"
                  >
                    Register Now <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={withHaptic('light', () => onNavigate?.('services'))}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/30 backdrop-blur-sm transition-all"
                  >
                    View Services
                  </motion.button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}