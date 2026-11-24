import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Compass, Clock, Sparkles, Languages, ShieldCheck,
  Building2, Zap, Target, Heart, ArrowRight, Quote, Award, Globe2, Scale
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

/* 6 Key Objectives — verbatim from the original About section on LandingPage */
const OBJECTIVES = [
  { icon: Users,        title: '1. Accessible Governance',    desc: 'Empowering all citizens, including rural and non-English speaking communities, to easily interact with public administration through any device, in any language.', color: '#138808' },
  { icon: Compass,      title: '2. Transparent Tracking',     desc: 'Complete traceability from registration to final resolution, with every department remark logged in a timestamped audit trail accessible to the citizen.', color: '#FF9933' },
  { icon: Clock,        title: '3. Rapid Processing',         desc: 'Eliminating manual sorting and bureaucratic bottlenecks through instant algorithmic triage and priority assignment in under three seconds.', color: '#0d9488' },
  { icon: Sparkles,     title: '4. AI-Powered Classification',desc: 'Natural Language Processing identifies specific categories, urgency, and the exact responsible nodal office automatically — no human dispatcher required.', color: '#1d4ed8' },
  { icon: Languages,    title: '5. Multilingual Citizen Voice',desc: 'Accepting complaints in Hindi, Hinglish, Bhojpuri, and 22 scheduled languages through text or spoken voice messages, all standardized for officers.', color: '#C99700' },
  { icon: ShieldCheck,  title: '6. Strict Accountability',    desc: 'Strict departmental accountability with escalation alerts, inspection remarks, and closure proof required for every complaint before final status update.', color: '#006B3C' }
];

/* Relationship Flow Diagram */
const FLOW = [
  { emoji: '👥', title: 'Citizens of India',            color: '#FF9933', desc: 'Report civic issues in any language using text, microphone voice input, or photographic evidence attached with GPS location.', step: '01' },
  { emoji: '⚡', title: 'JanSamadhan Platform',          color: 'gradient', desc: 'NLP translates, standardizes to English, classifies priority, and automatically assigns the complaint to the correct nodal officer.', step: '02' },
  { emoji: '🏛️', title: 'Government Departments',       color: '#FF9933', desc: 'Electricity, Water, PWD, Drainage, and Sanitation officers inspect, update status, and resolve issues transparently with proof.', step: '03' }
];

/* Mission pillars */
const PILLARS = [
  { icon: Target,   title: 'Mission',   text: 'To bridge the trust gap between Indian citizens and public authorities by providing a transparent, AI-driven grievance redressal channel that works in every regional language.' },
  { icon: Heart,    title: 'Vision',    text: 'A digitally empowered India where every voice — regardless of language, region, or literacy — is heard, tracked, and resolved with dignity and speed.' },
  { icon: Scale,    title: 'Values',    text: 'Transparency, accountability, accessibility, and inclusion. Every complaint is treated with equal seriousness, every citizen with equal respect.' }
];

/* Stats */
const STATS = [
  { value: '28+', label: 'Scheduled Languages Supported' },
  { value: '5',   label: 'Core Civic Departments' },
  { value: '<3s', label: 'AI Triage Time' },
  { value: '24x7',label: 'Citizen Helpline Availability' }
];

/* Inspired-by initiatives */
const INITIATIVES = [
  { name: 'Digital India',       emoji: '📱', desc: 'Citizen-first digital infrastructure for service delivery.' },
  { name: 'Swachh Bharat',       emoji: '🧹', desc: 'Clean India mission — civic sanitation and waste accountability.' },
  { name: 'Make in India',       emoji: '🇮🇳', desc: 'Built, hosted, and operated entirely on Indian soil.' },
  { name: 'Sabka Saath Sabka Vikas', emoji: '🤝', desc: 'Inclusive development for every section of society.' }
];

/* Count-up number for stats */
function CountUp({ end, duration = 1.8 }) {
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

/* Parse a stat string like "28+", "<3s", "24x7" — animate numeric prefix when possible */
function StatValue({ value }) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  const [, prefix, num, suffix] = match;
  return (
    <span className="tabular-nums">
      {prefix}<CountUp end={parseInt(num, 10)} />{suffix}
    </span>
  );
}

export default function AboutPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="about" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="WHO WE ARE"
        title="About JanSamadhan"
        subtitle="An AI-powered national grievance redressal portal built to bridge the gap between Indian citizens and public authorities."
        onNavigate={onNavigate}
        accent="green"
        icon={Building2}
        stats={STATS}
      />

      <main className="flex-1">

        {/* ===== SECTION 1: Intro narrative + Mission pillars ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-24 relative">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-[#FF9933]/8 blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-[#138808]/8 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative">
            {/* Left: Narrative */}
            <Reveal variant="left" className="lg:col-span-7">
              <span className="js-eyebrow mb-5">
                <Sparkles className="w-3.5 h-3.5" /> Empowering Public Service
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102A43] tracking-tight leading-[1.1] mb-6">
                A digital bridge between <span className="js-text-tricolor">citizens</span> and the <span className="text-[#006B3C]">government</span>.
              </h2>
              <div className="space-y-4 text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed">
                <p>
                  JanSamadhan is an AI-powered national grievance redressal portal built to bridge the gap between Indian citizens and public authorities. Inspired by <strong className="text-[#006B3C]">Digital India</strong>, <strong className="text-[#006B3C]">Clean India (Swachh Bharat)</strong>, and transparent civic administration, the platform places the power of accountability directly in the hands of every citizen.
                </p>
                <p>
                  Whether reporting an unlit streetlight in a remote village, a broken water pipeline in a metro, or unsanitary conditions in a neighborhood, citizens can submit complaints in their <strong>native language</strong>, attach photographic evidence, and watch the entire resolution journey unfold transparently — from initial triage to departmental inspection to verified closure.
                </p>
                <p>
                  Behind the scenes, a multilingual Natural Language Processing engine classifies each grievance, identifies the responsible nodal officer, and assigns priority automatically — eliminating the bureaucratic delays that have historically plagued public grievance systems.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <motion.button
                  onClick={withHaptic('medium', () => onNavigate?.('how-it-works'))}
                  onMouseEnter={() => softHaptic('soft')}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="js-btn-primary inline-flex items-center gap-2 px-6 py-3 bg-[#138808] hover:bg-[#006B3C] text-white font-bold rounded-xl shadow-lg"
                >
                  See How It Works <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={withHaptic('light', () => onNavigate?.('contact'))}
                  onMouseEnter={() => softHaptic('tick')}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#102A43] font-bold rounded-xl border-2 border-slate-200 hover:border-[#006B3C] hover:text-[#006B3C] transition-all"
                >
                  Contact Support
                </motion.button>
              </div>
            </Reveal>

            {/* Right: Mission pillars stack */}
            <div className="lg:col-span-5 space-y-4">
              {PILLARS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.title} variant="right" delay={0.1 * i}>
                    <motion.div
                      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(16,42,67,0.10)' }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="js-lift-sm bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#138808] to-[#006B3C] flex items-center justify-center text-white shadow-md">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-bold text-[#102A43] text-base sm:text-lg">{p.title}</h3>
                          <span className="js-eyebrow js-eyebrow-gold !text-[9px] !px-2 !py-0.5">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{p.text}</p>
                      </div>
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: Stats band ===== */}
        <section className="relative py-16 sm:py-20 bg-gradient-to-br from-[#006B3C] via-[#0b1c2d] to-[#102A43] overflow-hidden">
          <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-[#FF9933]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full bg-[#138808]/30 blur-3xl pointer-events-none" />
          <div className="gov-container relative px-4 sm:px-6">
            <Reveal className="text-center mb-10 sm:mb-12">
              <span className="js-eyebrow js-eyebrow-gold mb-4 inline-flex">
                <Award className="w-3.5 h-3.5" /> By the Numbers
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Engineered for every Indian citizen
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/90 max-w-2xl mx-auto">
                Built to scale across languages, departments, and geographies — from metropolitan cities to the remotest villages.
              </p>
            </Reveal>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  variants={childFade}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-7 border border-white/20 text-center relative overflow-hidden group"
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#FF9933]/25 blur-2xl pointer-events-none" />
                  <div
                    className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 relative"
                    style={{ color: '#FFD9A0' }}
                  >
                    <StatValue value={s.value} />
                  </div>
                  <div className="text-[11px] sm:text-xs text-white/90 font-semibold uppercase tracking-wider leading-tight relative">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 3: 6 Key Objectives grid ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-24 relative">
          <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <span className="js-eyebrow mb-4 inline-flex">
              <Target className="w-3.5 h-3.5" /> Six Strategic Objectives
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
              What JanSamadhan stands for
            </h2>
            <div className="js-ornament mt-4">
              <span className="text-[#D4AF37] text-xs">✦</span>
            </div>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Each objective is engineered to remove a specific pain point in traditional public grievance systems — from language barriers to opaque routing and slow manual triage.
            </p>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {OBJECTIVES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  onMouseEnter={() => softHaptic('soft')}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="js-lift-tilt relative p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-sm group overflow-hidden"
                >
                  {/* Number watermark */}
                  <span className="absolute top-4 right-4 text-5xl font-black text-slate-100 group-hover:text-[#138808]/10 transition-colors select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-0 h-1 w-16 rounded-br-full transition-all duration-500 group-hover:w-full"
                    style={{ background: item.color }}
                  />

                  <motion.div
                    whileHover={{ rotate: 6, scale: 1.1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
                      color: item.color,
                      border: `1px solid ${item.color}33`
                    }}
                  >
                    <Icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2 relative">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed relative">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ===== SECTION 4: Relationship Flow Diagram ===== */}
        <section className="bg-gradient-to-b from-[#F5F9F6] to-white border-y border-slate-200 py-16 sm:py-24 relative overflow-hidden">
          <div className="gov-container relative px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow js-eyebrow-saffron mb-4 inline-flex">
                <Globe2 className="w-3.5 h-3.5" /> Collaboration Flow
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Citizen ↔ JanSamadhan ↔ Government
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                A three-way collaboration where technology acts as the honest mediator between citizens and the departments meant to serve them.
              </p>
            </Reveal>

            <Reveal variant="scale" className="relative">
              <div className="bg-gradient-to-br from-[#0b1c2d] via-[#102A43] to-[#006B3C] rounded-3xl shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden">
                <div className="absolute top-[-60px] right-[-60px] w-72 h-72 rounded-full bg-[#006B3C]/30 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full bg-[#FF9933]/20 blur-3xl pointer-events-none" />

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
                  {FLOW.map((c, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: EASE, delay: idx * 0.15 }}
                      whileHover={{ y: -8 }}
                      className={
                        c.color === 'gradient'
                          ? 'p-6 bg-gradient-to-br from-[#006B3C] to-[#138808] rounded-2xl border border-emerald-400/40 shadow-2xl relative flex flex-col'
                          : 'p-6 bg-slate-800/80 rounded-2xl border border-white/15 flex flex-col'
                      }
                    >
                      {c.color === 'gradient' && (
                        <motion.span
                          initial={{ scale: 0.85, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9933] text-[#102A43] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] whitespace-nowrap"
                        >
                          Intelligent Core
                        </motion.span>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-4xl sm:text-5xl">{c.emoji}</span>
                        <span className="font-black text-2xl text-white/40">{c.step}</span>
                      </div>
                      <h4 className="font-extrabold text-base sm:text-lg mb-2" style={{ color: c.color === 'gradient' ? '#FFFFFF' : '#FFB366' }}>
                        {c.title}
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed flex-1" style={{ color: c.color === 'gradient' ? '#ECFDF5' : '#E2E8F0' }}>
                        {c.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Connection arrows hint */}
                <div className="hidden md:flex items-center justify-center gap-2 mt-8 text-white/70 text-xs font-bold tracking-wider uppercase">
                  <span>Submit</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-[#FF9933]">AI Triage</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Route</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-[#7CE38B]">Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Resolve</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== SECTION 5: Inspired by initiatives ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-24">
          <Reveal className="text-center max-w-3xl mx-auto mb-12">
            <span className="js-eyebrow mb-4 inline-flex">
              <Heart className="w-3.5 h-3.5" /> Inspired By
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
              Aligned with national missions
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              JanSamadhan extends the spirit of these flagship Government of India initiatives into the realm of citizen grievance redressal.
            </p>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {INITIATIVES.map((init, idx) => (
              <motion.div
                key={idx}
                variants={childFade}
                whileHover={{ y: -6, boxShadow: '0 18px 44px rgba(16,42,67,0.10)' }}
                transition={{ duration: 0.35, ease: EASE }}
                className="js-lift-sm bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm text-center group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{init.emoji}</div>
                <h3 className="font-bold text-[#102A43] text-sm sm:text-base mb-1.5">{init.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{init.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ===== SECTION 6: Quote / closing CTA ===== */}
        <section className="gov-container px-4 sm:px-6 pb-16 sm:pb-24">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006B3C] via-[#138808] to-[#006B3C] p-8 sm:p-12 lg:p-16 text-center text-white shadow-2xl">
              <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#FF9933]/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />

              <div className="relative">
                <Quote className="w-12 h-12 text-[#FFD9A0] mx-auto mb-6 opacity-80" />
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug max-w-4xl mx-auto mb-6">
                  "A complaint heard is a problem half-solved. A complaint tracked is a problem solved."
                </p>
                <p className="text-sm text-emerald-100/90 font-semibold mb-8">— The JanSamadhan Principle</p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.button
                    onClick={withHaptic('medium', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
                    onMouseEnter={() => softHaptic('soft')}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="js-btn-gold inline-flex items-center gap-2 px-7 py-3.5 text-[#102A43] font-extrabold rounded-xl shadow-xl"
                  >
                    Register a Complaint <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={withHaptic('light', () => onNavigate?.('why-trust'))}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/30 backdrop-blur-sm transition-all"
                  >
                    Why Trust Us
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