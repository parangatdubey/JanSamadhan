import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Compass, Clock, Sparkles, Languages, ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { softHaptic } from '../utils/haptics';

/* Animation variants — kept identical to the original About section on LandingPage */
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
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
};

const childFade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};

/* 6 Key Objectives — verbatim from the original About section on LandingPage */
const OBJECTIVES = [
  { icon: Users,        title: '1. Accessible Governance',        desc: 'Empowering all citizens, including rural and non-English speaking communities, to easily interact with public administration.' },
  { icon: Compass,      title: '2. Transparent Tracking',         desc: 'Complete traceability from registration to final resolution, with every department remark logged in a timestamped audit trail.' },
  { icon: Clock,        title: '3. Rapid Processing',            desc: 'Eliminating manual sorting and bureaucratic bottlenecks through instant algorithmic triage and priority assignment.' },
  { icon: Sparkles,     title: '4. AI-Powered Classification',   desc: 'Natural Language Processing identifies specific categories, urgency, and the exact responsible nodal office automatically.' },
  { icon: Languages,    title: '5. Multilingual Citizen Voice',  desc: 'Accepting complaints in Hindi, Hinglish, Bhojpuri, and 22 scheduled languages through text or spoken voice messages.' },
  { icon: ShieldCheck,  title: '6. Strict Accountability',      desc: 'Strict departmental accountability with escalation alerts, inspection remarks, and closure proof required for every complaint.' }
];

/* Relationship Flow Diagram — verbatim from the original About section on LandingPage */
const FLOW = [
  { emoji: '👥', title: '1. Citizens of India',            color: '#FF9933', desc: 'Report civic issues in any language using text, microphone voice input, or photographic evidence.' },
  { emoji: '⚡', title: '2. JanSamadhan Platform',          color: 'gradient', desc: 'NLP translates, standardizes to English, classifies priority, and automatically assigns complaint to the nodal officer.' },
  { emoji: '🏛️', title: '3. Government Departments',       color: '#FF9933', desc: 'Electricity, Water, PWD, Drainage, and Sanitation officers inspect, update status, and resolve issues transparently.' }
];

export default function AboutPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="about" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="WHO WE ARE"
        title="About JanSamadhan"
        subtitle="An AI-powered national grievance redressal portal built to bridge the gap between Indian citizens and public authorities."
        onNavigate={onNavigate}
      />

      <main className="flex-1 gov-container px-4 sm:px-6 py-12 sm:py-16">

        {/* ===== Intro: "Empowering Public Service" badge + About heading + intro paragraph ===== */}
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

        {/* ===== 6 Key Objectives grid ===== */}
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-16"
        >
          {OBJECTIVES.map((item, idx) => {
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

        {/* ===== Relationship Flow Diagram: Citizen ↔ JanSamadhan ↔ Government Departments ===== */}
        <Reveal className="p-6 sm:p-8 bg-[#102A43] text-white rounded-3xl shadow-xl relative overflow-hidden" variant="scale">
          <div className="js-bg-blob" style={{ width: 240, height: 240, background: '#006B3C', top: '-40px', right: '-40px', opacity: 0.25 }} />
          <h3 className="text-center font-bold text-base sm:text-xl text-white mb-6 relative">
            Citizen ↔ JanSamadhan ↔ Government Department Collaboration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center relative">
            {FLOW.map((c, idx) => (
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
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}