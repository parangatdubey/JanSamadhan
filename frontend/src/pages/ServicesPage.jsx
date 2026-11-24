import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Droplets, HardHat, Trash2, Waves, ArrowRight,
  CheckCircle2, MapPin, Clock, Users, Building2, Server, ShieldCheck, TrendingUp
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

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const childFade = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};

/* Expanded grievance domains with icons, sample issues, and SLA hints */
const DOMAINS = [
  {
    num: '01',
    icon: Zap,
    title: 'Electricity & Streetlights',
    code: 'ELEC',
    color: '#F59E0B',
    desc: 'Power outages, faulty streetlights, transformer issues, exposed wiring, illegal connections, and billing disputes with the electricity department.',
    samples: ['Streetlight not working', 'Frequent power cuts', 'Exposed live wire', 'Transformer sparking'],
    sla: '48 hours'
  },
  {
    num: '02',
    icon: Droplets,
    title: 'Potable Water Supply',
    code: 'WATER',
    color: '#1d4ed8',
    desc: 'Drinking water shortages, contaminated supply, broken pipelines, low pressure, tanker mismanagement, and meter or billing issues.',
    samples: ['No water for 3 days', 'Dirty water supply', 'Pipeline burst', 'Low water pressure'],
    sla: '24 hours'
  },
  {
    num: '03',
    icon: HardHat,
    title: 'Public Works & Roads (PWD)',
    code: 'PWD',
    color: '#6B7280',
    desc: 'Potholes, broken roads, damaged footpaths, illegal encroachments, falling trees on roads, and traffic signage issues.',
    samples: ['Large pothole on main road', 'Broken footpath', 'Damaged speed breaker', 'Fallen tree blocking road'],
    sla: '72 hours'
  },
  {
    num: '04',
    icon: Trash2,
    title: 'Municipal Sanitation & Waste',
    code: 'SAN',
    color: '#138808',
    desc: 'Garbage pile-ups, irregular waste collection, dirty public toilets, stray animal nuisance, and unclean public spaces.',
    samples: ['Garbage not collected', 'Public toilet unclean', 'Stray dog menace', 'Open drain overflow'],
    sla: '24 hours'
  },
  {
    num: '05',
    icon: Waves,
    title: 'Drainage & Flood Management',
    code: 'DRN',
    color: '#0d9488',
    desc: 'Clogged drains, water-logging, sewage overflow, missing manhole covers, and monsoon flood-prone area complaints.',
    samples: ['Drain blocked', 'Sewage overflow', 'Missing manhole cover', 'Water-logging on street'],
    sla: '48 hours'
  }
];

/* Process feature row */
const FEATURES = [
  { icon: MapPin,      title: 'Geo-Tagged Routing', desc: 'GPS coordinates auto-route your complaint to the correct municipal ward and zonal office.', color: '#FF9933' },
  { icon: Clock,       title: 'SLA Enforcement',    desc: 'Each department has a service-level agreement. Escalation triggers automatically on breach.', color: '#138808' },
  { icon: Users,       title: 'Nodal Officer Assign',desc: 'A specific named officer is assigned to every complaint — no anonymous "department" responses.', color: '#1d4ed8' },
  { icon: ShieldCheck, title: 'Closure Proof',      desc: 'Complaints cannot be marked resolved without inspection remarks and photographic evidence.', color: '#006B3C' }
];

/* Stats */
const STATS = [
  { value: '5',    label: 'Civic Departments' },
  { value: '20+',  label: 'Issue Subcategories' },
  { value: '24h',  label: 'Fastest SLA' },
  { value: '100%', label: 'Closure Verified' }
];

/* Count-up number for stats */
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

export default function ServicesPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="services" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="SERVICES"
        title="Grievance Domains We Cover"
        subtitle="Five core civic departments, twenty-plus issue categories, and a single intelligent pipeline that routes your complaint to the right officer — automatically."
        onNavigate={onNavigate}
        accent="green"
        icon={Server}
        stats={STATS}
      />

      <main className="flex-1">

        {/* ===== SECTION 1: Intro ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20 text-center relative">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#138808]/8 blur-3xl pointer-events-none" />
          <Reveal className="max-w-3xl mx-auto relative">
            <span className="js-eyebrow mb-5 inline-flex">
              <Building2 className="w-3.5 h-3.5" /> Five Civic Departments
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102A43] tracking-tight leading-[1.1]">
              One portal for <span className="js-text-tricolor">everyday civic issues</span>.
            </h2>
            <div className="js-ornament mt-5">
              <span className="text-[#D4AF37] text-xs">✦</span>
            </div>
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
              JanSamadhan currently covers the five departments that touch daily citizen life most directly. Each complaint is auto-classified, geo-tagged, and routed to the responsible nodal officer with a clear service-level commitment.
            </p>
          </Reveal>
        </section>

        {/* ===== SECTION 2: Domain cards (detailed) ===== */}
        <section className="gov-container px-4 sm:px-6 pb-16 sm:pb-24">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {DOMAINS.map((d, idx) => {
              const Icon = d.icon;
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  onMouseEnter={() => softHaptic('soft')}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="js-lift relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group flex flex-col"
                >
                  {/* Top color band */}
                  <div className="h-1.5 w-full" style={{ background: d.color }} />

                  <div className="p-6 sm:p-7 flex-1 flex flex-col">
                    {/* Header row: icon + num + code */}
                    <div className="flex items-start justify-between mb-5">
                      <motion.div
                        whileHover={{ rotate: 6, scale: 1.08 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${d.color}22, ${d.color}11)`,
                          color: d.color,
                          border: `1px solid ${d.color}33`
                        }}
                      >
                        <Icon className="w-7 h-7" />
                      </motion.div>
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Domain
                        </div>
                        <div className="text-2xl font-black tabular-nums text-slate-300 group-hover:text-slate-400 transition-colors">
                          {d.num}
                        </div>
                      </div>
                    </div>

                    {/* Code chip */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                        style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}33` }}
                      >
                        {d.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dept. Code</span>
                    </div>

                    {/* Title + desc */}
                    <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">{d.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">{d.desc}</p>

                    {/* Sample issues */}
                    <div className="mb-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Sample Issues</div>
                      <ul className="space-y-1.5">
                        {d.samples.map((s, si) => (
                          <li key={si} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: d.color }} />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SLA chip — push to bottom */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700">
                        <Clock className="w-3 h-3" style={{ color: d.color }} />
                        SLA: {d.sla}
                      </div>
                      <motion.button
                        onClick={withHaptic('medium', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                        style={{ color: d.color }}
                      >
                        File <ArrowRight className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Add-on: "More coming" placeholder card */}
            <motion.div
              variants={childFade}
              className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 sm:p-7 flex flex-col items-center justify-center text-center min-h-[280px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                <TrendingUp className="w-7 h-7 text-[#006B3C]" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">More departments on the roadmap</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Health, Education, Transport, and Women & Child Welfare departments are planned for the next phase of JanSamadhan.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ===== SECTION 3: Pipeline features ===== */}
        <section className="bg-gradient-to-b from-[#F5F9F6] to-white border-y border-slate-200 py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 js-dot-pattern opacity-40 pointer-events-none" />
          <div className="gov-container relative px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow js-eyebrow-saffron mb-4 inline-flex">
                <ShieldCheck className="w-3.5 h-3.5" /> How We Route & Resolve
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Every complaint, handled with discipline
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                From GPS tagging to SLA enforcement and closure proof — four engineering choices that make JanSamadhan more accountable than any traditional grievance register.
              </p>
            </Reveal>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            >
              {FEATURES.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={childFade}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="js-lift-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40" style={{ background: f.color }} />
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                      style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}33` }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-[#102A43] text-sm sm:text-base mb-2 relative">{f.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed relative">{f.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 4: CTA ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#138808] via-[#006B3C] to-[#FF9933] p-8 sm:p-12 lg:p-14 text-center text-white shadow-2xl">
              <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-white/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#102A43]/15 blur-3xl pointer-events-none" />

              <div className="relative">
                <Building2 className="w-12 h-12 text-white mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 max-w-3xl mx-auto leading-tight">
                  Have a civic issue? File it now.
                </h2>
                <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto mb-8">
                  Pick the department that matches your problem — or let our AI figure it out for you from your description. Either way, the right officer gets notified in seconds.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.button
                    onClick={withHaptic('medium', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
                    onMouseEnter={() => softHaptic('soft')}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="js-btn-gold inline-flex items-center gap-2 px-7 py-3.5 text-[#102A43] font-extrabold rounded-xl shadow-xl"
                  >
                    File a Complaint <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={withHaptic('light', () => onNavigate?.('how-it-works'))}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/30 backdrop-blur-sm transition-all"
                  >
                    How It Works
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