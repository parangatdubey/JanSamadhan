import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, MapPin, Globe, Clock, MessageSquare, Send,
  ArrowRight, Building2, Headphones, Zap, ShieldCheck, AlertCircle, CheckCircle2
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

/* Helpline config (verbatim spirit from LandingPage footer) */
const HELPLINE = {
  title: 'Citizen Support',
  label: 'National Grievance Cell Helpline:',
  number: '1800-JAN-SAMADHAN',
  note: 'Available 24 hours a day, 7 days a week. Free call from all networks.',
  email: 'help@jansamadhan.gov.in',
  address: 'Department of Administrative Reforms & Public Grievances, New Delhi - 110001',
  website: 'www.jansamadhan.gov.in'
};

/* Contact channels */
const CHANNELS = [
  {
    icon: Phone,
    title: 'Call the Helpline',
    primary: '1800-JAN-SAMADHAN',
    secondary: 'Toll-free • 24x7 • All networks',
    color: '#138808',
    action: 'tel:18005627262',
    actionLabel: 'Call Now'
  },
  {
    icon: Mail,
    title: 'Email Support',
    primary: 'help@jansamadhan.gov.in',
    secondary: 'Replies within 24 hours • For written queries',
    color: '#1d4ed8',
    action: 'mailto:help@jansamadhan.gov.in',
    actionLabel: 'Send Email'
  },
  {
    icon: MessageSquare,
    title: 'Track a Complaint',
    primary: 'Use the search bar above',
    secondary: 'Enter your reference ID in the navbar search',
    color: '#FF9933',
    action: 'track',
    actionLabel: 'Go to Tracking'
  }
];

/* Office locations / departments */
const OFFICES = [
  { name: 'Central Nodal Office',  address: 'Department of Administrative Reforms & Public Grievances, New Delhi - 110001', hours: 'Mon–Sat • 9:00 AM – 6:00 PM', icon: Building2 },
  { name: 'Electricity Wing',      address: 'Block C, Power Department Hub, New Delhi', hours: 'Mon–Sat • 9:00 AM – 8:00 PM', icon: Zap },
  { name: 'Water & Sanitation',    address: 'Jal Nigam Bhawan, Sector 18, New Delhi', hours: 'Mon–Sat • 8:00 AM – 6:00 PM', icon: ShieldCheck }
];

/* FAQ entries */
const FAQS = [
  {
    q: 'How do I file my first complaint?',
    a: 'Click "Login" or "Raise Complaint" in the navbar, register with your mobile number or Google account, then describe your issue in any language — attach photos and GPS if possible. Our AI routes it to the right officer automatically.'
  },
  {
    q: 'Is JanSamadhan really free for citizens?',
    a: 'Yes — registering, filing, and tracking complaints is completely free for every Indian citizen. Helpline calls are toll-free from all networks.'
  },
  {
    q: 'In which languages can I submit a complaint?',
    a: 'You can write or speak in Hindi, English, Hinglish, Bhojpuri, Marathi, Bengali, Tamil, Telugu, and 22+ scheduled languages. The system transcribes and translates voice automatically.'
  },
  {
    q: 'What if my complaint is not resolved in time?',
    a: 'Each department has a service-level agreement. If breached, the complaint auto-escalates to a senior officer. You can also re-open a closed complaint within 72 hours if unsatisfied.'
  },
  {
    q: 'How do I track the status of my complaint?',
    a: 'Use the search bar in the navbar (top of every page) — enter your reference ID. You can also see the live pipeline (Submitted → Under Review → Assigned → In Progress → Resolved) inside your citizen dashboard.'
  }
];

/* Stats */
const STATS = [
  { value: '24x7', label: 'Helpline Availability' },
  { value: '<24h', label: 'Email Response' },
  { value: '3',    label: 'Contact Channels' },
  { value: 'Free', label: 'For Every Citizen' }
];

export default function ContactPage({ currentUser, onNavigate, onLogout }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    softHaptic('medium');
    // No backend wiring here — this is a static front-end contact form.
    // In production, POST to /api/contact or mailto fallback.
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="contact" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="CONTACT"
        title="Get in touch with us"
        subtitle="National Grievance Cell helpline for every citizen. Call, email, or send us a message — we respond within 24 hours."
        onNavigate={onNavigate}
        accent="saffron"
        icon={Headphones}
        stats={STATS}
      />

      <main className="flex-1">

        {/* ===== SECTION 1: Intro ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20 text-center relative">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#FF9933]/8 blur-3xl pointer-events-none" />
          <Reveal className="max-w-3xl mx-auto relative">
            <span className="js-eyebrow js-eyebrow-saffron mb-5 inline-flex">
              <Headphones className="w-3.5 h-3.5" /> We Are Here To Help
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102A43] tracking-tight leading-[1.1]">
              Reach out, <span className="js-text-tricolor">anytime</span>.
            </h2>
            <div className="js-ornament mt-5">
              <span className="text-[#D4AF37] text-xs">✦</span>
            </div>
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
              Whether you need help filing a complaint, want to track an existing one, or have a question about how JanSamadhan works — our citizen support team is available around the clock, free of cost.
            </p>
          </Reveal>
        </section>

        {/* ===== SECTION 2: Contact channels ===== */}
        <section className="gov-container px-4 sm:px-6 pb-16 sm:pb-20">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
          >
            {CHANNELS.map((c, idx) => {
              const Icon = c.icon;
              const handleAction = () => {
                if (c.action === 'track') {
                  onNavigate?.('landing');
                } else if (c.action.startsWith('http') || c.action.startsWith('mailto') || c.action.startsWith('tel')) {
                  window.location.href = c.action;
                }
              };
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="js-lift relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group"
                >
                  <div className="h-1.5 w-full" style={{ background: c.color }} />
                  <div className="p-6 sm:p-7">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 6 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${c.color}22, ${c.color}11)`,
                        color: c.color,
                        border: `1px solid ${c.color}33`
                      }}
                    >
                      <Icon className="w-7 h-7" />
                    </motion.div>
                    <h3 className="font-bold text-[#102A43] text-base sm:text-lg mb-2">{c.title}</h3>
                    <p className="font-black text-[#102A43] text-lg sm:text-xl mb-1" style={{ color: c.color }}>
                      {c.primary}
                    </p>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">{c.secondary}</p>

                    <motion.button
                      onClick={withHaptic('medium', handleAction)}
                      onMouseEnter={() => softHaptic('tick')}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}33` }}
                    >
                      {c.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ===== SECTION 3: Hero helpline band + Contact form ===== */}
        <section className="bg-gradient-to-b from-white to-[#F5F9F6] border-y border-slate-200 py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 js-dot-pattern opacity-40 pointer-events-none" />
          <div className="gov-container relative px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

              {/* Left: Helpline highlight card */}
              <Reveal variant="left">
                <div className="bg-gradient-to-br from-[#0b1c2d] via-[#102A43] to-[#006B3C] rounded-3xl p-8 sm:p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden h-full">
                  <div className="absolute top-[-60px] right-[-60px] w-72 h-72 rounded-full bg-[#FF9933]/25 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full bg-[#138808]/30 blur-3xl pointer-events-none" />

                  <div className="relative">
                    <span className="js-eyebrow js-eyebrow-saffron mb-5 inline-flex">
                      <Phone className="w-3.5 h-3.5" /> {HELPLINE.title}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black mb-3">{HELPLINE.label}</h3>
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-black js-text-shimmer mb-5">
                      {HELPLINE.number}
                    </p>
                    <p className="text-sm text-white/90 mb-8 leading-relaxed">{HELPLINE.note}</p>

                    {/* Contact details grid */}
                    <div className="space-y-4 pt-6 border-t border-white/20">
                      {[
                        { icon: Mail,   label: 'Email',     value: HELPLINE.email },
                        { icon: MapPin, label: 'Address',   value: HELPLINE.address },
                        { icon: Globe,  label: 'Website',   value: HELPLINE.website },
                        { icon: Clock,  label: 'Hours',     value: '24 × 7 × 365 — including holidays' }
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0 text-[#FFB366]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-0.5">{item.label}</div>
                              <div className="text-sm text-white font-semibold leading-snug break-words">{item.value}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Right: Contact form */}
              <Reveal variant="right">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 lg:p-10 h-full">
                  <h3 className="text-xl sm:text-2xl font-black text-[#102A43] mb-2">Send us a message</h3>
                  <p className="text-sm text-slate-600 mb-6">Fill out the form below and our team will respond within 24 hours.</p>

                  {sent ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="bg-[#138808]/8 border border-[#138808]/25 rounded-2xl p-8 text-center"
                    >
                      <CheckCircle2 className="w-14 h-14 text-[#138808] mx-auto mb-4" />
                      <h4 className="font-black text-[#102A43] text-lg mb-2">Message sent!</h4>
                      <p className="text-sm text-slate-600">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Aarti Sharma"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006B3C] focus:bg-white focus:ring-2 focus:ring-[#138808]/15 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Phone</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006B3C] focus:bg-white focus:ring-2 focus:ring-[#138808]/15 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006B3C] focus:bg-white focus:ring-2 focus:ring-[#138808]/15 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Subject *</label>
                        <input
                          type="text"
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          placeholder="What's this about?"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006B3C] focus:bg-white focus:ring-2 focus:ring-[#138808]/15 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Message *</label>
                        <textarea
                          required
                          rows={4}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Describe your query, issue, or feedback in detail..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006B3C] focus:bg-white focus:ring-2 focus:ring-[#138808]/15 transition-all resize-none"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        onMouseEnter={() => softHaptic('soft')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="js-btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-xl shadow-lg"
                      >
                        Send Message <Send className="w-4 h-4" />
                      </motion.button>

                      <p className="text-[11px] text-slate-500 text-center pt-2 flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        For urgent grievance escalations, please call the helpline directly.
                      </p>
                    </form>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== SECTION 4: Office locations ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-24">
          <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <span className="js-eyebrow mb-4 inline-flex">
              <Building2 className="w-3.5 h-3.5" /> Office Locations
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
              Where to find us
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Walk-in support available at our nodal offices during working hours. Bring your reference ID for faster service.
            </p>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {OFFICES.map((o, idx) => {
              const Icon = o.icon;
              return (
                <motion.div
                  key={idx}
                  variants={childFade}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="js-lift-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#006B3C] to-[#138808] text-white flex items-center justify-center shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#102A43] text-sm sm:text-base">{o.name}</h3>
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-[#FF9933] flex-shrink-0" />
                      <span className="leading-relaxed">{o.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 text-[#138808] flex-shrink-0" />
                      <span className="leading-relaxed">{o.hours}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ===== SECTION 5: FAQ accordion ===== */}
        <section className="bg-gradient-to-b from-[#F5F9F6] to-white border-t border-slate-200 py-16 sm:py-24">
          <div className="gov-container px-4 sm:px-6">
            <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
              <span className="js-eyebrow js-eyebrow-gold mb-4 inline-flex">
                <MessageSquare className="w-3.5 h-3.5" /> Frequently Asked
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#102A43] tracking-tight">
                Questions, answered
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Quick answers to the most common questions we hear from citizens. Don't see yours? Use the form above.
              </p>
            </Reveal>

            <Reveal variant="up" className="max-w-3xl mx-auto space-y-3">
              {FAQS.map((f, idx) => {
                const open = openFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: EASE, delay: idx * 0.05 }}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${open ? 'border-[#138808]/40 shadow-lg' : 'border-slate-200 shadow-sm'}`}
                  >
                    <button
                      onClick={() => {
                        softHaptic('tick');
                        setOpenFaq(open ? -1 : idx);
                      }}
                      className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left"
                    >
                      <span className={`font-bold text-sm sm:text-base transition-colors ${open ? 'text-[#006B3C]' : 'text-[#102A43]'}`}>
                        {f.q}
                      </span>
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg font-light transition-colors ${open ? 'bg-[#138808] text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        +
                      </motion.span>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{
                        height: open ? 'auto' : 0,
                        opacity: open ? 1 : 0
                      }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 sm:px-6 pb-5 text-sm text-slate-600 leading-relaxed">
                        {f.a}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </Reveal>
          </div>
        </section>

        {/* ===== SECTION 6: CTA ===== */}
        <section className="gov-container px-4 sm:px-6 py-16 sm:py-20">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF9933] via-[#E68A2E] to-[#138808] p-8 sm:p-12 lg:p-14 text-center text-white shadow-2xl">
              <div className="absolute inset-0 js-dot-pattern opacity-30 pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-white/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#102A43]/30 blur-3xl pointer-events-none" />

              <div className="relative">
                <Phone className="w-12 h-12 text-white mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 max-w-3xl mx-auto leading-tight">
                  Still need help? We're a call away.
                </h2>
                <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto mb-8">
                  Our citizen support team is available 24×7 to help you file, track, or escalate any grievance. The call is free from every network in India.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.a
                    href="tel:18005627262"
                    onMouseEnter={() => softHaptic('soft')}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="js-btn-primary inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#102A43] font-extrabold rounded-xl shadow-xl"
                  >
                    <Phone className="w-4 h-4" /> Call 1800-JAN-SAMADHAN
                  </motion.a>
                  <motion.button
                    onClick={withHaptic('light', () => onNavigate?.('auth', { targetIntent: 'register', path: '/register' }))}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#102A43]/30 hover:bg-[#102A43]/50 text-white font-bold rounded-xl border border-white/40 backdrop-blur-sm transition-all"
                  >
                    Register a Complaint <ArrowRight className="w-4 h-4" />
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