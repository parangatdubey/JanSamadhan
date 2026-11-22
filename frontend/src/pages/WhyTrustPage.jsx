import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { softHaptic } from '../utils/haptics';

/* Animation variants — kept identical to the original Why Trust section on LandingPage */
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

/* 6 trust cards — verbatim (emoji + title + desc) from the original Why Trust section on LandingPage */
const TRUST_CARDS = [
  { emoji: '✓',   title: 'Transparent Tracking',       desc: 'Every grievance is assigned a unique reference ID. Citizens can inspect live progress, assigned officers, and timestamped actions anytime.' },
  { emoji: '🛡️', title: 'Secure Citizen Accounts',     desc: 'Direct authentication via Google OAuth 2.0 or Indian mobile number with Bcrypt encryption. High security, zero spam.' },
  { emoji: '🏛️', title: 'Department-Wise Routing',     desc: 'Complaints are intelligently routed to the relevant department: Electricity, Water Supply, PWD, Drainage, or Municipal Corporation.' },
  { emoji: '🌐', title: 'Multilingual Accessibility',  desc: 'Citizens can write or speak in Hindi, Bhojpuri, Marathi, Bengali, Hinglish, etc. The system generates standardized English for officers.' },
  { emoji: '📷', title: 'Evidence-Based Grievance',     desc: 'Attach live photos, documents, and GPS geo-tags to substantiate your complaint and prevent vague or misdirected reports.' },
  { emoji: '🔔', title: 'Instant Status Updates',       desc: 'Real-time status changes from Submitted to Under Review, Assigned, In Progress, and Resolved, with official remarks attached.' }
];

export default function WhyTrustPage({ currentUser, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6]">
      <Navbar currentPage="why-trust" currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />

      <PageHeader
        badge="WHY TRUST US"
        title="Why citizens trust JanSamadhan"
        subtitle="JanSamadhan enforces public accountability, rapid response times, and seamless civic problem resolution for every citizen."
        onNavigate={onNavigate}
      />

      <main className="flex-1 gov-container px-4 sm:px-6 py-12 sm:py-16">

        {/* ===== Intro: "Trust & Public Transparency" badge + heading + subtitle ===== */}
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

        {/* ===== 6 trust cards grid (emoji-based, exactly like the original) ===== */}
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 relative"
        >
          {TRUST_CARDS.map((item, idx) => (
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
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}