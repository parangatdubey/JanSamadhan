import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { softHaptic } from '../utils/haptics';

/* Animation variants — kept identical to the original How It Works section on LandingPage */
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

/* 4-step process — verbatim from the original How It Works section on LandingPage */
const STEPS = [
  { num: '1', bg: 'bg-[#102A43]', badge: 'Authentication', badgeColor: 'text-[#FF9933]', title: 'Register or Login',   desc: 'Citizens create an account or login instantly using Google OAuth 2.0 or their 10-digit Indian mobile number.' },
  { num: '2', bg: 'bg-[#006B3C]', badge: 'Submission',    badgeColor: 'text-[#138808]', title: 'Submit Complaint',   desc: 'Citizens report issues by typing in any regional language, speaking via microphone voice input, or attaching photos and GPS location.' },
  { num: '3', bg: 'bg-[#FF9933]', textDark: true,         badge: 'AI Processing',       badgeColor: 'text-amber-700', title: 'NLP & Routing',      desc: 'The NLP system detects language, standardizes to formal English, categorizes the grievance, and auto-assigns it to the correct department.' },
  { num: '4', bg: 'bg-[#138808]', badge: 'Resolution',    badgeColor: 'text-[#006B3C]', title: 'Track Resolution',    desc: 'Citizens monitor complaint status in real-time, view official inspection notes, and confirm closure with complete transparency.' }
];

export default function HowItWorksPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="how-it-works" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="HOW IT WORKS"
        title="How JanSamadhan Works"
        subtitle="From submission to ground resolution in four transparent, automated steps."
        onNavigate={onNavigate}
      />

      <main className="flex-1 gov-container px-4 sm:px-6 py-12 sm:py-16">

        {/* ===== Intro: "Simple 4-Step Process" badge + heading + subtitle ===== */}
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

        {/* ===== 4-step process grid ===== */}
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative"
        >
          {STEPS.map((step, idx) => (
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
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}