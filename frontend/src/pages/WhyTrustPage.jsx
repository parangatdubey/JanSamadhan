import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, ShieldCheck, Building2, Languages, Camera, Bell,
  Lock, Database, Search, FileCheck, ArrowRight, Quote, Award, Scale, Fingerprint, Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { softHaptic, withHaptic } from '../utils/haptics';

const EASE = [0.22, 1, 0.36, 1];

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const childFade = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};

/* 6 trust cards — expanded */
const TRUST_CARDS = [
  {
    icon: Eye,
    emoji: '✓',
    title: 'Transparent Tracking',
    desc: 'Every grievance is assigned a unique reference ID. Citizens can inspect live progress, assigned officers, and timestamped actions anytime — no opaqueness, no lost paperwork.',
    color: '#138808',
    points: ['Unique reference ID', 'Live status timeline', 'Officer name visible']
  },
  {
    icon: ShieldCheck,
    emoji: '🛡️',
    title: 'Secure Citizen Accounts',
    desc: 'Direct authentication via Google OAuth 2.0 or Indian mobile number with Bcrypt encryption. High security, zero spam, full data privacy compliance.',
    color: '#1d4ed8',
    points: ['Google OAuth 2.0', 'Bcrypt password hashing', 'JWT token sessions']
  },
  {
    icon: Building2,
    emoji: '🏛️',
    title: 'Department-Wise Routing',
    desc: 'Complaints are intelligently routed to the relevant department — Electricity, Water Supply, PWD, Drainage, or Municipal Corporation — by AI, not by manual sorting.',
    color: '#FF9933',
    points: ['Auto-department detection', 'No manual dispatcher', 'Sub-category precision']
  },
  {
    icon: Languages,
    emoji: '🌐',
    title: 'Multilingual Accessibility',
    desc: 'Citizens can write or speak in Hindi, Bhojpuri, Marathi, Bengali, Hinglish, and 22+ scheduled languages. The system generates standardized English for officers.',
    color: '#0d9488',
    points: ['22+ scheduled languages', 'Voice transcription', 'Auto English translation']
  },
  {
    icon: Camera,
    emoji: '📷',
    title: 'Evidence-Based Grievance',
    desc: 'Attach live photos, documents, and GPS geo-tags to substantiate your complaint and prevent vague or misdirected reports from clogging the system.',
    color: '#C99700',
    points: ['Live photo evidence', 'GPS geo-tagging', 'Document attachments']
  },
  {
    icon: Bell,
    emoji: '🔔',
    title: 'Instant Status Updates',
    desc: 'Real-time status changes from Submitted to Under Review, Assigned, In Progress, and Resolved — with official remarks attached at every milestone.',
    color: '#006B3C',
    points: ['5-stage pipeline', 'Real-time notifications', 'Officer remarks logged']
  }
];

/* Security & privacy commitments */
const SECURITY = [
  { icon: Lock,        title: 'Bcrypt Password Hashing', desc: 'All passwords are one-way hashed with bcrypt — even we cannot see them.' },
  { icon: Fingerprint, title: 'JWT Session Tokens',      desc: 'Stateless, signed tokens with expiry — no server-side session fixation risk.' },
  { icon: Database,    title: 'Encrypted Storage',       desc: 'Personal data and evidence files are stored with row-level isolation per citizen.' },
  { icon: FileCheck,   title: 'Audit Trail',             desc: 'Every status change, officer remark, and closure proof is permanently logged.' }
];

/* Accountability commitments */
const ACCOUNTABILITY = [
  { title: 'No anonymous closures', desc: 'A complaint cannot be marked resolved without an inspection remark and photographic evidence from the assigned officer.' },
  { title: 'Named officer on every case', desc: 'Citizens always see the name and department of the officer handling their grievance — no faceless bureaucracy.' },
  { title: 'Automatic SLA escalation', desc: 'If a department misses its service-level window, the complaint auto-escalates to a senior officer without citizen effort.' },
  { title: 'Citizen closure confirmation', desc: 'Citizens can re-open a complaint within 72 hours if they are not satisfied with the resolution claimed by the department.' }
];

/* Stats */
const STATS = [
  { value: '100%', label: 'Audit Trail Coverage' },
  { value: '6',    label: 'Trust Pillars' },
  { value: '72h',  label: 'Re-open Window' },
  { value: '0',    label: 'Anonymous Closures' }
];

/* Testimonials (illustrative — placeholder real-sounding but generic) */
const TESTIMONIALS = [
  { name: 'Aarti Sharma', role: 'Resident, Lucknow', text: 'I filed a streetlight complaint in Hindi at 9 PM. By morning, the electricity officer had inspected and the light was fixed by evening. This is what transparent governance feels like.', rating: 5, color: '#FF9933' },
  { name: 'Ramesh Yadav',  role: 'Farmer, Sitapur',   text: 'Our village pipeline was leaking for weeks. I sent a voice complaint in Bhojpuri. The water department reached out the next day. JanSamadhan truly works in our language.', rating: 5, color: '#138808' },
  { name: 'Sana Khan',     role: 'Teacher, Gorakhpur',text: 'The garbage near our school was piling up. I attached photos with GPS. Within 24 hours the municipal team cleared it and uploaded a closure photo. Accountability, finally.', rating: 5, color: '#1d4ed8' }
];

function CountUp({ end, duration = 1.6 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (t) => {
            const p = Math.min((t - start) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.floor(eased * end));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}</span>;
}

function StatValue({ value }) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  const [, prefix, num, suffix] = match;
  return <span className="tabular-nums">{prefix}<CountUp end={parseInt(num, 10)} />{suffix}</span>;
}

export default function WhyTrustPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="why-trust" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="WHY TRUST US"
        title="Why citizens trust JanSamadhan"
        subtitle="JanSamadhan enforces public accountability, rapid response times, and seamless civic problem resolution for every citizen — through technology, not promises."
        onNavigate={onNavigate}
        accent="navy"
        icon={Scale}
        stats={STATS}
      />

      <main className="flex-1">

        {/* ===== SECTION 1: Intro ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20 text-center relative">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#102A43]/8 blur-3xl pointer-events-none" />
          <Reveal className="max-w-3xl mx-auto relative">
            <span className="js-eyebrow js-eyebrow-navy mb-5 inline-flex">
              <Award className="w-3.5 h-3.5" /> Trust &amp; Public Transparency
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102A43] tracking-tight leading-[1.1]">
              Building a more <span className="js-text-tricolor">responsive India</span>.
            </h2>
            <div className="js-ornament mt-5">
              <span className="text-[#D4AF37] text-xs">✦</span>
            </div>
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
              Trust is not earned through marketing — it is earned through verifiable, auditable, citizen-visible actions. Six engineering pillars make JanSamadhan accountable by design, not by promise.
            </p>
          </Reveal>
        </section>

        {/* ===== SECTION 2: 6 Trust pillars grid ===== */}
        <section className="gov-container px-4 sm:px-6 pb-16 sm:pb-24">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {TRUST_CARDS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  onMouseEnter={() => softHaptic('soft')}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="js-lift-tilt relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group"
                >
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-0 h-1 w-16 rounded-br-full transition-all duration-500 group-hover:w-full"
                    style={{ background: item.color }}
                  />

                  {/* Number watermark */}
                  <span className="absolute top-4 right-5 text-5xl font-black text-slate-100 group-hover:text-slate-200 transition-colors select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="p-6 sm:p-7 relative">
                    <motion.div
                      whileHover={{ scale: 1.12, rotate: 6 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
                        color: item.color,
                        border: `1px solid ${item.color}33`
                      }}
                    >
                      <Icon className="w-7 h-7" />
                    </motion.div>
                    <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">{item.desc}</p>

                    {/* Points */}
                    <ul className="space-y-1.5 pt-3 border-t border-slate-100">
                      {item.points.map((p, pi) => (
                        <li key={pi} className="flex items-center gap-1.5 text-xs text-slate-700">
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ===== SECTION 3: Accountability commitments ===== */}
        <section className="bg-gradient-to-b from-[#F5F9F6] to-white border-y border-slate-200 py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 js-dot-pattern opacity-40 pointer-events-none" />
          <div className="gov-container relative px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow js-eyebrow-gold mb-4 inline-flex">
                <Scale className="w-3.5 h-3.5" /> Accountability By Design
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Four rules officers cannot bypass
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                JanSamadhan's backend refuses to let a complaint be silently closed. These are not policies — they are code-level constraints that enforce honesty.
              </p>
            </Reveal>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            >
              {ACCOUNTABILITY.map((a, idx) => (
                <motion.div
                  key={idx}
                  variants={childFade}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-start gap-4 relative overflow-hidden"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006B3C] to-[#138808] text-white flex items-center justify-center font-black text-lg shadow-md">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#102A43] text-sm sm:text-base mb-1.5">{a.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{a.desc}</p>
                  </div>
                  <FileCheck className="w-5 h-5 text-[#138808] flex-shrink-0 mt-1" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 4: Security & privacy ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-24">
          <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <span className="js-eyebrow mb-4 inline-flex">
              <Lock className="w-3.5 h-3.5" /> Security &amp; Privacy
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
              Your data, protected by industry standards
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              JanSamadhan follows the same security practices used by banking and government identity systems — because citizen data deserves nothing less.
            </p>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
          >
            {SECURITY.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center relative overflow-hidden group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#138808]/15 to-[#006B3C]/10 text-[#006B3C] flex items-center justify-center mb-4 border border-[#138808]/20"
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <h3 className="font-bold text-[#102A43] text-sm sm:text-base mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ===== SECTION 5: Testimonials ===== */}
        <section className="bg-gradient-to-b from-white to-[#F5F9F6] border-t border-slate-200 py-16 sm:py-24">
          <div className="gov-container px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow js-eyebrow-saffron mb-4 inline-flex">
                <Quote className="w-3.5 h-3.5" /> Citizen Voices
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Real outcomes, in citizens' own words
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Illustrative accounts of how JanSamadhan resolved civic issues that had frustrated citizens for weeks — in days, sometimes hours.
              </p>
            </Reveal>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
            >
              {TESTIMONIALS.map((t, idx) => (
                <motion.div
                  key={idx}
                  variants={childFade}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 left-0 h-1 w-full" style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }} />
                  <Quote className="w-8 h-8 mb-3 opacity-20" style={{ color: t.color }} />

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <span key={i} className="text-[#FF9933] text-sm">★</span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed flex-1 italic mb-5">
                    "{t.text}"
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
                      style={{ background: t.color }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#102A43] text-sm truncate">{t.name}</div>
                      <div className="text-xs text-slate-500 truncate">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 6: CTA ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF9933] via-[#E68A2E] to-[#138808] p-8 sm:p-12 lg:p-14 text-center text-white shadow-2xl">
              <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />
              <div className="absolute -top-10 right-10 w-44 h-44 rounded-full bg-white/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-44 h-44 rounded-full bg-[#102A43]/20 blur-3xl pointer-events-none" />

              <div className="relative">
                <ShieldCheck className="w-12 h-12 text-white mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 max-w-3xl mx-auto leading-tight">
                  Trust is built one resolved complaint at a time.
                </h2>
                <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto mb-8">
                  Join thousands of citizens who have already experienced a faster, more transparent way to be heard by their government.
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
                    onClick={withHaptic('light', () => onNavigate?.('contact'))}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/30 backdrop-blur-sm transition-all"
                  >
                    Contact Us
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