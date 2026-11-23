import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Languages,
  Clock,
  Sparkles,
  Users,
  Compass,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import Navbar from '../components/Navbar';
import homeHeroBg from '../assets/home_hero_bg.jpg';
import { softHaptic, withHaptic } from '../utils/haptics';

/* ------------------------------------------------------------
   Animation variants — premium, smooth, subtle
   ------------------------------------------------------------ */
const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: i * 0.08 }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.8, ease: EASE, delay: i * 0.06 } })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: EASE, delay: i * 0.07 }
  })
};

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
};

const childFade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};

/* Reveal-on-scroll wrapper */
function Reveal({ children, variant = fadeUp, className = '', i = 0, once = true, amount = 0.25 }) {
  return (
    <motion.div
      className={className}
      variants={variant}
      custom={i}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}

/* Count-up number for hero stats */
function CountUp({ end, duration = 2, suffix = '' }) {
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
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

export default function LandingPage({ currentUser, onLogout, onNavigate }) {
  // parallax for hero
  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 500], [0, 80]);
  const heroContentY = useTransform(scrollY, [0, 500], [0, -30]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);
  const smoothY = useSpring(heroContentY, { stiffness: 120, damping: 30, mass: 0.3 });

  const handleAction = (intent) => {
    softHaptic('light');
    if (currentUser) {
      if (currentUser.role === 'OFFICER') {
        onNavigate('officer-dashboard');
      } else if (currentUser.role === 'ADMIN') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('citizen-dashboard', { initialTab: intent === 'track' ? 'my-complaints' : 'new-complaint' });
      }
    } else {
      onNavigate('auth', { targetIntent: intent });
    }
  };

  /* Magnetic button effect: track pointer for radial glow */
  const handleBtnMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6] text-[#102A43] font-sans antialiased selection:bg-[#138808]/20 selection:text-[#006B3C] overflow-x-hidden">

      {/* Shared government-style navigation (includes tricolor stripe,
          initiative topbar with helpline, and main nav). */}
      <Navbar
        currentPage="landing"
        currentUser={currentUser}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* ========================================================
          SECTION A: HERO SECTION (WITH BESPOKE INDIAN SUNRISE BG)
          ======================================================== */}
      <section
        id="home"
        className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeHeroBg})` }}
      >
        {/* Parallax bg layers */}
        <motion.div style={{ y: heroBgY }} className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/70 lg:to-white/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F9F6]/30 to-[#F5F9F6] pointer-events-none" />

        {/* Floating blobs */}
        <div className="js-bg-blob" style={{ width: 320, height: 320, background: '#FF9933', top: '10%', right: '5%' }} />
        <div className="js-bg-blob" style={{ width: 280, height: 280, background: '#138808', bottom: '5%', left: '2%', animationDelay: '4s' }} />

        <motion.div style={{ y: smoothY, opacity: heroOpacity }} className="relative gov-container">
          <div className="max-w-2xl xl:max-w-3xl 2xl:max-w-4xl space-y-6 sm:space-y-7 text-center lg:text-left">
            {/* Official Initiative Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#138808]/40 shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#138808] flex-shrink-0 relative">
                  <span className="absolute inset-0 rounded-full bg-[#138808] animate-ping opacity-75"></span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#006B3C] tracking-wide">
                  Official National Grievance Redressal Portal
                </span>
              </div>
            </motion.div>

            {/* Tagline Heading */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] xl:text-[58px] 2xl:text-[64px] font-black text-[#102A43] tracking-tight leading-[1.12]"
            >
              Your Voice. <span className="js-text-shimmer">Your Rights.</span> <br className="hidden sm:inline" />
              <span className="text-[#006B3C]">Our Responsibility.</span>
            </motion.h1>

            {/* Supporting Description */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-700 leading-relaxed font-medium max-w-2xl xl:max-w-3xl"
            >
              JanSamadhan empowers every citizen of India to report civic issues in their own native language, attach live photo evidence, and track ground resolution through a transparent, AI-driven national platform.
            </motion.p>

            {/* Multilingual Callout Chips */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 pt-1 text-xs sm:text-sm font-semibold text-slate-700"
            >
              <span className="flex items-center text-[#006B3C] font-bold mr-1">
                <Languages className="w-4 h-4 mr-1.5 text-[#006B3C] flex-shrink-0" />
                Speak or write in:
              </span>
              {['हिंदी', 'English', 'Hinglish', 'भोजपुरी', 'मराठी', 'বাংলা', 'தமிழ்', 'తెలుగు'].map((lang, i) => (
                <motion.span
                  key={lang}
                  onMouseEnter={() => softHaptic('selection')}
                  whileHover={{ y: -3, scale: 1.05 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold cursor-default"
                  style={{ originX: 0.5, originY: 1 }}
                >
                  {lang}
                </motion.span>
              ))}
              <span className="text-slate-500 font-bold px-1">&amp; 22+ Scheduled Languages</span>
            </motion.div>

            {/* matching CTA Action Buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2"
            >
              <motion.button
                onMouseMove={handleBtnMove}
                onMouseEnter={() => softHaptic('soft')}
                onClick={withHaptic('medium', () => handleAction('register'))}
                whileHover={{ y: -3, boxShadow: '0 14px 36px rgba(19,136,8,0.38)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="js-btn-primary w-full sm:w-auto h-13 sm:h-14 min-h-[52px] px-8 py-3.5 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-2xl border-2 border-[#138808] hover:border-[#006B3C] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
              >
                <span className="relative z-10">Register a Complaint</span>
                <ArrowRight className="w-5 h-5 ml-0.5 relative z-10" />
              </motion.button>
              <motion.button
                onMouseEnter={() => softHaptic('soft')}
                onClick={withHaptic('medium', () => handleAction('track'))}
                whileHover={{ y: -3, boxShadow: '0 14px 36px rgba(16,42,67,0.18)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="w-full sm:w-auto h-13 sm:h-14 min-h-[52px] px-8 py-3.5 bg-white/95 hover:bg-slate-50 text-[#102A43] font-bold rounded-2xl border-2 border-slate-300 shadow-sm hover:border-[#006B3C] transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-[#006B3C]" />
                <span>Track Your Complaint</span>
              </motion.button>
            </motion.div>

            {/* Trust and Guarantees Feature Cards */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={5}
              className="pt-4 max-w-4xl border-t border-slate-300/80 mx-auto lg:mx-0"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                {[
                  { label: '100% Free Service', icon: CheckCircle2 },
                  { label: 'Live Ground Tracking', icon: CheckCircle2 },
                  { label: 'Direct Nodal Routing', icon: CheckCircle2 },
                  { label: '24x7 Assistance', icon: CheckCircle2 }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      onMouseEnter={() => softHaptic('soft')}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="flex items-center space-x-2.5 h-12 px-3.5 py-2.5 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#138808]/40 hover:bg-white transition-all"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#138808]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#138808]" />
                      </div>
                      <span className="text-xs sm:text-[13px] text-slate-800 font-bold whitespace-nowrap leading-tight">
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================
          SECTION B: ABOUT JAN SAMADHAN
          ======================================================== */}
      <section id="about" className="py-16 md:py-24 bg-white border-y border-slate-200 relative">
        <div className="gov-container relative">
          <Reveal className="text-center max-w-3xl mx-auto mb-14">
            <motion.span
              variants={scaleIn}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C] border border-[#138808]/20 mb-3 inline-block"
            >
              Empowering Public Service
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              About JanSamadhan
            </motion.h2>
            <motion.div variants={fadeUp} className="w-16 h-1 bg-[#138808] mx-auto mt-3 rounded-full" />

            <motion.p variants={fadeUp} className="mt-5 text-sm sm:text-base text-slate-700 leading-relaxed">
              JanSamadhan is an AI-powered national grievance redressal portal built to bridge the gap between Indian citizens and public authorities. Inspired by <strong>Digital India</strong>, <strong>Clean India (Swachh Bharat)</strong>, and transparent civic administration.
            </motion.p>
          </Reveal>

          {/* 6 Key Objectives */}
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-16"
          >
            {[
              { icon: Users, title: '1. Accessible Governance', desc: 'Empowering all citizens, including rural and non-English speaking communities, to easily interact with public administration.' },
              { icon: Compass, title: '2. Transparent Tracking', desc: 'Complete traceability from registration to final resolution, with every department remark logged in a timestamped audit trail.' },
              { icon: Clock, title: '3. Rapid Processing', desc: 'Eliminating manual sorting and bureaucratic bottlenecks through instant algorithmic triage and priority assignment.' },
              { icon: Sparkles, title: '4. AI-Powered Classification', desc: 'Natural Language Processing identifies specific categories, urgency, and the exact responsible nodal office automatically.' },
              { icon: Languages, title: '5. Multilingual Citizen Voice', desc: 'Accepting complaints in Hindi, Hinglish, Bhojpuri, and 22 scheduled languages through text or spoken voice messages.' },
              { icon: ShieldCheck, title: '6. Strict Accountability', desc: 'Strict departmental accountability with escalation alerts, inspection remarks, and closure proof required for every complaint.' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  onMouseEnter={() => softHaptic('soft')}
                  whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(16,42,67,0.10)' }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="js-lift p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] group"
                >
                  <motion.div
                    whileHover={{ rotate: 6, scale: 1.08 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all"
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Relationship Flow Diagram */}
          <Reveal className="p-6 sm:p-8 bg-[#102A43] text-white rounded-3xl shadow-xl relative overflow-hidden" variant={scaleIn}>
            <div className="js-bg-blob" style={{ width: 240, height: 240, background: '#006B3C', top: '-40px', right: '-40px', opacity: 0.25 }} />
            <h3 className="text-center font-bold text-base sm:text-xl text-white mb-6 relative">
              Citizen ↔ JanSamadhan ↔ Government Department Collaboration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center relative">
              {[
                { emoji: '👥', title: '1. Citizens of India', color: '#FF9933', desc: 'Report civic issues in any language using text, microphone voice input, or photographic evidence.' },
                { emoji: '⚡', title: '2. JanSamadhan Platform', color: 'gradient', desc: 'NLP translates, standardizes to English, classifies priority, and automatically assigns complaint to the nodal officer.' },
                { emoji: '🏛️', title: '3. Government Departments', color: '#FF9933', desc: 'Electricity, Water, PWD, Drainage, and Sanitation officers inspect, update status, and resolve issues transparently.' }
              ].map((c, idx) => (
                <motion.div
                  key={idx}
                  variants={childFade}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className={
                    c.color === 'gradient'
                      ? 'p-5 bg-gradient-to-br from-[#006B3C] to-[#138808] rounded-2xl border border-emerald-400/30 shadow-lg relative'
                      : 'p-5 bg-white/10 rounded-2xl border border-white/10'
                  }
                >
                  {c.color === 'gradient' && (
                    <motion.span
                      initial={{ scale: 0.9, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9933] text-[#102A43] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    >
                      Intelligent Core
                    </motion.span>
                  )}
                  <div className="text-3xl mb-2">{c.emoji}</div>
                  <h4 className="font-extrabold text-base mb-1" style={{ color: c.color === 'gradient' ? '#FFFFFF' : '#FF9933' }}>{c.title}</h4>
                  <p className="text-xs" style={{ color: c.color === 'gradient' ? '#DCFCE7' : '#CBD5E1' }}>{c.desc}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================================================
          SECTION C: WHY TRUST JAN SAMADHAN?
          ======================================================== */}
      <section id="trust" className="py-16 md:py-24 bg-[#F5F9F6] relative">
        <div className="js-bg-blob" style={{ width: 360, height: 360, background: '#FF9933', top: '20%', right: '-100px', opacity: 0.18 }} />
        <div className="gov-container relative">
          <Reveal className="text-center max-w-3xl mx-auto mb-14">
            <motion.span variants={scaleIn} className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FF9933]/15 text-[#102A43] border border-[#FF9933]/30 mb-3 inline-block">
              Trust &amp; Public Transparency
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Building a More Responsive India
            </motion.h2>
            <motion.div variants={fadeUp} className="w-16 h-1 bg-[#006B3C] mx-auto mt-3 rounded-full" />
            <motion.p variants={fadeUp} className="mt-4 text-sm sm:text-base text-slate-600">
              JanSamadhan enforces public accountability, rapid response times, and seamless civic problem resolution for every citizen.
            </motion.p>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 relative"
          >
            {[
              { emoji: '✓', title: 'Transparent Tracking', desc: 'Every grievance is assigned a unique reference ID. Citizens can inspect live progress, assigned officers, and timestamped actions anytime.' },
              { emoji: '🛡️', title: 'Secure Citizen Accounts', desc: 'Direct authentication via Google OAuth 2.0 or Indian mobile number with Bcrypt encryption. High security, zero spam.' },
              { emoji: '🏛️', title: 'Department-Wise Routing', desc: 'Complaints are intelligently routed to the relevant department: Electricity, Water Supply, PWD, Drainage, or Municipal Corporation.' },
              { emoji: '🌐', title: 'Multilingual Accessibility', desc: 'Citizens can write or speak in Hindi, Bhojpuri, Marathi, Bengali, Hinglish, etc. The system generates standardized English for officers.' },
              { emoji: '📷', title: 'Evidence-Based Grievance', desc: 'Attach live photos, documents, and GPS geo-tags to substantiate your complaint and prevent vague or misdirected reports.' },
              { emoji: '🔔', title: 'Instant Status Updates', desc: 'Real-time status changes from Submitted to Under Review, Assigned, In Progress, and Resolved, with official remarks attached.' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={childFade}
                onMouseEnter={() => softHaptic('soft')}
                whileHover={{ y: -6, boxShadow: '0 18px 44px rgba(16,42,67,0.10)' }}
                transition={{ duration: 0.35, ease: EASE }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 group"
              >
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 4 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold text-lg"
                >
                  {item.emoji}
                </motion.div>
                <h3 className="font-bold text-[#102A43] text-base sm:text-lg">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECTION D: HOW IT WORKS
          ======================================================== */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white border-y border-slate-200 relative">
        <div className="gov-container relative">
          <Reveal className="text-center max-w-3xl mx-auto mb-14">
            <motion.span variants={scaleIn} className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C] border border-[#138808]/20 mb-3 inline-block">
              Simple 4-Step Process
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              How JanSamadhan Works
            </motion.h2>
            <motion.div variants={fadeUp} className="w-16 h-1 bg-[#138808] mx-auto mt-3 rounded-full" />
            <motion.p variants={fadeUp} className="mt-4 text-sm sm:text-base text-slate-600">
              From submission to ground resolution in four transparent, automated steps.
            </motion.p>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative"
          >
            {[
              { num: '1', bg: 'bg-[#102A43]', badge: 'Authentication', badgeColor: 'text-[#FF9933]', title: 'Register or Login', desc: 'Citizens create an account or login instantly using Google OAuth 2.0 or their 10-digit Indian mobile number.' },
              { num: '2', bg: 'bg-[#006B3C]', badge: 'Submission', badgeColor: 'text-[#138808]', title: 'Submit Complaint', desc: 'Citizens report issues by typing in any regional language, speaking via microphone voice input, or attaching photos and GPS location.' },
              { num: '3', bg: 'bg-[#FF9933]', textDark: true, badge: 'AI Processing', badgeColor: 'text-amber-700', title: 'NLP & Routing', desc: 'The NLP system detects language, standardizes to formal English, categorizes the grievance, and auto-assigns it to the correct department.' },
              { num: '4', bg: 'bg-[#138808]', badge: 'Resolution', badgeColor: 'text-[#006B3C]', title: 'Track Resolution', desc: 'Citizens monitor complaint status in real-time, view official inspection notes, and confirm closure with complete transparency.' }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                variants={childFade}
                onMouseEnter={() => softHaptic('soft')}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(16,42,67,0.10)' }}
                transition={{ duration: 0.4, ease: EASE }}
                className="bg-[#F5F9F6] p-6 rounded-2xl border border-slate-200 relative group"
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.span
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className={`w-9 h-9 rounded-xl ${step.bg} ${step.textDark ? 'text-[#102A43]' : 'text-white'} flex items-center justify-center font-black text-sm`}
                  >
                    {step.num}
                  </motion.span>
                  <span className={`text-[11px] font-bold ${step.badgeColor} uppercase`}>{step.badge}</span>
                </div>
                <h3 className="text-base font-bold text-[#102A43] mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECTION E: MAIN ACTION SECTION
          ======================================================== */}
      <section id="action-section" className="py-16 md:py-24 bg-gradient-to-b from-[#F5F9F6] via-white to-[#F5F9F6] relative js-aurora">
        <div className="js-bg-blob" style={{ width: 320, height: 320, background: '#138808', bottom: '10%', left: '-80px', opacity: 0.18 }} />
        <div className="js-bg-blob" style={{ width: 280, height: 280, background: '#FF9933', top: '10%', right: '-60px', opacity: 0.18, animationDelay: '5s' }} />
        <div className="gov-container relative">

          {/* Centered Logo & Heading */}
          <Reveal className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <motion.div variants={scaleIn} className="flex justify-center mb-1">
              <JanSamadhanLogo size="lg" variant="light" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-black text-[#102A43] tracking-tight">
              Your Problem Deserves Attention.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              Raise a grievance or track an existing one. JanSamadhan makes public service accessible, honest, and swift.
            </motion.p>
          </Reveal>

          {/* TWO LARGE PREMIUM ACTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch relative">

            {/* CARD 1: REGISTER A COMPLAINT */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              onMouseEnter={() => softHaptic('soft')}
              whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(19,136,8,0.20)' }}
              transition={{ duration: 0.4, ease: EASE }}
              className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-300 shadow-xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#138808]/15 to-transparent rounded-bl-full pointer-events-none" />
              <div className="space-y-4 relative">
                <motion.div
                  whileHover={{ rotate: 6, scale: 1.08 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] group-hover:scale-105 transition-transform"
                >
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                </motion.div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C]">
                  Citizen Grievance Filing
                </div>

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#102A43]">
                  REGISTER A COMPLAINT
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Facing a civic problem? Register your complaint using text, voice, or supporting evidence.
                </p>

                <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#138808] flex-shrink-0" />
                    <span>Microphone voice recording in any native language</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#138808] flex-shrink-0" />
                    <span>Attach photo evidence &amp; GPS location tag</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#138808] flex-shrink-0" />
                    <span>Automated AI departmental routing</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 relative">
                <motion.button
                  onMouseMove={handleBtnMove}
                  onClick={withHaptic('medium', () => handleAction('register'))}
                  whileHover={{ y: -2, boxShadow: '0 14px 36px rgba(19,136,8,0.32)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="js-btn-primary w-full py-4 px-6 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
                >
                  <span className="relative z-10">Register Complaint</span>
                  <ArrowRight className="w-5 h-5 ml-1 relative z-10" />
                </motion.button>
              </div>
            </motion.div>

            {/* CARD 2: TRACK YOUR COMPLAINT */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              custom={1}
              onMouseEnter={() => softHaptic('soft')}
              whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(16,42,67,0.20)' }}
              transition={{ duration: 0.4, ease: EASE }}
              className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 hover:border-[#102A43] shadow-xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#102A43]/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="space-y-4 relative">
                <motion.div
                  whileHover={{ rotate: -6, scale: 1.08 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#102A43]/10 flex items-center justify-center text-[#102A43] group-hover:scale-105 transition-transform"
                >
                  <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-[#102A43]" />
                </motion.div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#102A43]/10 text-[#102A43]">
                  Live Audit &amp; Status Check
                </div>

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#102A43]">
                  TRACK YOUR COMPLAINT
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Already submitted a complaint? Check its current status and follow every update.
                </p>

                <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#102A43] flex-shrink-0" />
                    <span>Real-time status updates (Assigned, In Progress, Resolved)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#102A43] flex-shrink-0" />
                    <span>Read official nodal officer inspection remarks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#102A43] flex-shrink-0" />
                    <span>Full history of all previously lodged grievances</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 relative">
                <motion.button
                  onMouseMove={handleBtnMove}
                  onClick={withHaptic('medium', () => handleAction('track'))}
                  whileHover={{ y: -2, boxShadow: '0 14px 36px rgba(16,42,67,0.30)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="js-btn-primary w-full py-4 px-6 bg-[#102A43] hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
                >
                  <MapPin className="w-5 h-5 mr-1 text-[#FF9933] relative z-10" />
                  <span className="relative z-10">Track Your Complaint</span>
                </motion.button>
              </div>
            </motion.div>

          </div>

          <div className="mt-8 text-center text-xs text-slate-500 font-medium">
            🔒 Protected by 256-bit encryption. All actions comply with digital citizen governance privacy guidelines.
          </div>
        </div>
      </section>

      {/* ========================================================
          FOOTER & CONTACT SECTION
          ======================================================== */}
      <footer id="contact" className="mt-auto bg-[#102A43] text-slate-300 text-xs border-t border-slate-800 relative overflow-hidden">
        <div className="js-bg-blob" style={{ width: 300, height: 300, background: '#006B3C', bottom: '-100px', right: '5%', opacity: 0.15 }} />
        <div className="gov-container py-12 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3">
              <JanSamadhanLogo size="md" variant="dark" />
              <p className="text-slate-400 text-xs leading-relaxed">
                JanSamadhan is an AI-powered grievance redressal portal bringing transparent, multilingual civic problem resolution to every citizen.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-3">Grievance Domains</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Electricity &amp; Streetlights</li>
                <li>Potable Water Supply</li>
                <li>Public Works &amp; Roads (PWD)</li>
                <li>Municipal Sanitation &amp; Waste</li>
                <li>Drainage &amp; Flood Management</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-3">Quick Navigation</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#about" className="hover:text-white">About JanSamadhan</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><button onClick={() => handleAction('register')} className="hover:text-white cursor-pointer">Register Complaint</button></li>
                <li><button onClick={() => handleAction('track')} className="hover:text-white cursor-pointer">Track Complaint</button></li>
                <li><button onClick={() => onNavigate('auth', { targetIntent: 'officer', path: '/login?intent=officer' })} className="hover:text-white cursor-pointer">Department Officer Portal</button></li>
                <li><button onClick={() => onNavigate('admin-login', { path: '/admin/login' })} className="text-[#FF9933] hover:underline font-bold cursor-pointer">Central Admin Portal (/admin/login)</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-3">Citizen Support</h4>
              <p className="text-slate-400 leading-relaxed">
                National Grievance Cell Helpline:
              </p>
              <p className="text-[#FF9933] font-bold text-sm mt-1">1800-JAN-SAMADHAN</p>
              <p className="text-slate-400 text-[11px] mt-2">
                Available 24 hours a day, 7 days a week. Free call from all networks.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>© 2026 JanSamadhan — Digital Citizen Grievance Redressal System.</p>
            <p className="text-slate-500">
              Your Voice. Your Rights. Our Responsibility.
            </p>
          </div>
        </div>
        <div className="h-1 w-full tricolor-stripe"></div>
      </footer>
    </div>
  );
}