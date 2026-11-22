import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';

/* Animation variants — kept identical to the patterns used on the original LandingPage */
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

/* Verbatim from the LandingPage footer "Grievance Domains" list (lines 738-745) */
const DOMAINS = [
  'Electricity & Streetlights',
  'Potable Water Supply',
  'Public Works & Roads (PWD)',
  'Municipal Sanitation & Waste',
  'Drainage & Flood Management'
];

export default function ServicesPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="services" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="SERVICES"
        title="Grievance Domains"
        subtitle="The civic problem areas JanSamadhan covers."
        onNavigate={onNavigate}
      />

      <main className="flex-1 gov-container px-4 sm:px-6 py-12 sm:py-16">

        {/* ===== Intro ===== */}
        <Reveal className="text-center max-w-3xl mx-auto mb-14">
          <motion.span variants={scaleIn} className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C] border border-[#138808]/20 mb-3 inline-block">
            Grievance Domains
          </motion.span>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
            What JanSamadhan covers
          </motion.h2>
          <motion.div variants={fadeUp} className="w-16 h-1 bg-[#138808] mx-auto mt-3 rounded-full" />
        </Reveal>

        {/* ===== Domains list (verbatim from LandingPage footer) ===== */}
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 relative"
        >
          {DOMAINS.map((d, idx) => (
            <motion.div
              key={idx}
              variants={childFade}
              whileHover={{ y: -6, boxShadow: '0 18px 44px rgba(16,42,67,0.10)' }}
              transition={{ duration: 0.35, ease: EASE }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold text-lg mb-3">
                {idx + 1}
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">{d}</h3>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}