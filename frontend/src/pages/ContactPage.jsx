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

/* Verbatim from the LandingPage footer "Citizen Support" block (lines 760-768) */
const HELPLINE = {
  title: 'Citizen Support',
  label: 'National Grievance Cell Helpline:',
  number: '1800-JAN-SAMADHAN',
  note: 'Available 24 hours a day, 7 days a week. Free call from all networks.'
};

export default function ContactPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="contact" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="CONTACT"
        title="Citizen Support"
        subtitle="National Grievance Cell Helpline for every citizen."
        onNavigate={onNavigate}
      />

      <main className="flex-1 gov-container px-4 sm:px-6 py-12 sm:py-16">

        {/* ===== Intro ===== */}
        <Reveal className="text-center max-w-3xl mx-auto mb-14">
          <motion.span variants={scaleIn} className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C] border border-[#138808]/20 mb-3 inline-block">
            Citizen Support
          </motion.span>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
            Get in touch
          </motion.h2>
          <motion.div variants={fadeUp} className="w-16 h-1 bg-[#138808] mx-auto mt-3 rounded-full" />
        </Reveal>

        {/* ===== Citizen Support helpline card (verbatim from LandingPage footer) ===== */}
        <Reveal variant="scale" className="max-w-xl mx-auto">
          <div className="bg-[#102A43] rounded-2xl p-8 sm:p-10 text-white text-center relative overflow-hidden">
            <h3 className="font-bold text-white text-sm mb-3">{HELPLINE.title}</h3>
            <p className="text-slate-400 leading-relaxed mb-1">{HELPLINE.label}</p>
            <p className="text-[#FF9933] font-bold text-2xl sm:text-3xl mt-1">{HELPLINE.number}</p>
            <p className="text-slate-400 text-xs mt-4">{HELPLINE.note}</p>
          </div>
        </Reveal>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}