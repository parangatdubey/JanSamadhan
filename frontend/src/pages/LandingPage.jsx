import React, { useState } from 'react';
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
  CheckCircle,
  Menu,
  X,
  PhoneCall
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import homeHeroBg from '../assets/home_hero_bg.jpg';

export default function LandingPage({ currentUser, onLogout, onNavigate }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAction = (intent) => {
    setIsMobileMenuOpen(false);
    // If logged in, navigate straight to citizen dashboard with intended mode
    if (currentUser) {
      if (currentUser.role === 'OFFICER') {
        onNavigate('officer-dashboard');
      } else if (currentUser.role === 'ADMIN') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('citizen-dashboard', { initialTab: intent === 'track' ? 'my-complaints' : 'new-complaint' });
      }
    } else {
      // Redirect to authentication with preserved intent
      onNavigate('auth', { targetIntent: intent });
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9F6] text-[#102A43] font-sans antialiased selection:bg-[#138808]/20 selection:text-[#006B3C] overflow-x-hidden">
      {/* Top National Tricolor Stripe & Initiative Bar */}
      <div className="h-1.5 w-full tricolor-stripe"></div>
      
      <div className="bg-[#102A43] text-slate-300 text-xs py-2 border-b border-slate-800">
        <div className="gov-container flex flex-wrap justify-between items-center gap-2">
          {/* Left: Initiative Titles */}
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse flex-shrink-0"></span>
            <span className="font-semibold text-slate-100 whitespace-nowrap">
              Digital India Civic Redressal Initiative
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline whitespace-nowrap">Clean India • Prosperous India</span>
          </div>

          {/* Right: Citizen Helpline & Admin Login */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs text-slate-300">
            <span className="inline-flex items-center space-x-1.5 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0" />
              <span className="whitespace-nowrap"><span className="hidden sm:inline">Citizen </span>Helpline: <strong className="text-white font-bold tracking-wide">1800-JAN-SAMADHAN</strong></span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <button
              onClick={() => onNavigate('admin-login', { path: '/admin/login' })}
              className="bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold cursor-pointer transition-colors shadow-sm whitespace-nowrap inline-flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-slate-950" />
              <span>Admin Login ↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation (Stable Three-Section Grid Layout) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80">
        <div className="gov-container h-20 flex items-center justify-between xl:grid xl:grid-cols-[auto_1fr_auto] xl:gap-8">
          {/* Section 1: Left Auto-sized Logo */}
          <div className="flex items-center flex-shrink-0">
            <JanSamadhanLogo size="md" variant="light" onClick={() => onNavigate('landing')} />
          </div>

          {/* Section 2: Center Flexible Navigation Section (xl:flex, 1280px+) */}
          <nav className="hidden xl:flex items-center justify-center space-x-6 2xl:space-x-8 text-sm font-semibold text-slate-700">
            <a href="#home" className="text-[#006B3C] hover:text-[#138808] transition-colors whitespace-nowrap py-1">Home</a>
            <a href="#about" className="hover:text-[#006B3C] transition-colors whitespace-nowrap py-1">About</a>
            <a href="#trust" className="hover:text-[#006B3C] transition-colors whitespace-nowrap py-1">Why Trust</a>
            <a href="#how-it-works" className="hover:text-[#006B3C] transition-colors whitespace-nowrap py-1">How It Works</a>
            <a href="#action-section" className="hover:text-[#006B3C] transition-colors whitespace-nowrap py-1">Services</a>
            <a href="#contact" className="hover:text-[#006B3C] transition-colors whitespace-nowrap py-1">Contact</a>
          </nav>

          {/* Section 3: Right Auto-sized Action Section (xl:flex, 1280px+) */}
          <div className="hidden xl:flex items-center justify-end space-x-2.5 2xl:space-x-3 flex-shrink-0">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAction('dashboard')}
                  className="h-10 px-4 text-xs sm:text-sm font-bold bg-[#102A43] text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
                >
                  <span>Dashboard ({currentUser.name?.split(' ')[0] || 'User'})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="h-10 px-3 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('auth', { targetIntent: 'officer', path: '/login?intent=officer' })}
                  className="h-10 px-3.5 text-xs xl:text-sm font-semibold text-slate-700 hover:text-[#102A43] hover:bg-slate-100 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center"
                >
                  Officer Portal
                </button>
                <button
                  onClick={() => onNavigate('auth', { targetIntent: 'login', path: '/login' })}
                  className="h-10 px-3.5 text-xs xl:text-sm font-semibold text-[#102A43] hover:text-[#006B3C] hover:bg-slate-100 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center"
                >
                  Citizen Login
                </button>
                <button
                  onClick={() => handleAction('register')}
                  className="h-10 px-4 text-xs xl:text-sm font-bold bg-[#138808] hover:bg-[#006B3C] text-white rounded-xl transition-all shadow-sm hover:shadow flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Raise Complaint</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile & Tablet Toggle (xl:hidden) */}
          <div className="flex items-center space-x-2 xl:hidden">
            {!currentUser && (
              <button
                onClick={() => handleAction('register')}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold bg-[#138808] text-white rounded-xl shadow-sm whitespace-nowrap"
              >
                Raise Complaint
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-[#102A43]" /> : <Menu className="w-6 h-6 text-[#102A43]" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Drawer (xl:hidden) */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white border-b-2 border-[#138808] shadow-2xl px-5 py-6 space-y-4 animate-in slide-in-from-top-3 duration-200">
            <nav className="flex flex-col space-y-2.5 font-semibold text-slate-800 text-sm">
              <a href="#home" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-slate-50 text-[#006B3C]">Home</a>
              <a href="#about" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-slate-50">About</a>
              <a href="#trust" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-slate-50">Why Trust</a>
              <a href="#how-it-works" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-slate-50">How It Works</a>
              <a href="#action-section" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-slate-50">Services</a>
              <a href="#contact" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-slate-50">Contact</a>
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2.5">
              {currentUser ? (
                <>
                  <button
                    onClick={() => handleAction('dashboard')}
                    className="w-full py-3 bg-[#102A43] text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-1.5"
                  >
                    <span>Go to Dashboard ({currentUser.name})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => { closeMobileMenu(); onLogout(); }}
                      className="w-full py-2.5 text-xs font-bold text-red-600 border border-red-200 rounded-xl"
                    >
                      Logout
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAction('register')}
                    className="w-full py-3 bg-[#138808] text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md"
                  >
                    <span>Raise Complaint</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { closeMobileMenu(); onNavigate('auth', { targetIntent: 'login', path: '/login' }); }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#102A43] font-bold rounded-xl text-sm"
                  >
                    Citizen Login
                  </button>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => { closeMobileMenu(); onNavigate('auth', { targetIntent: 'officer', path: '/login?intent=officer' }); }}
                      className="py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center"
                    >
                      Officer Portal
                    </button>
                    <button
                      onClick={() => { closeMobileMenu(); onNavigate('admin-login', { path: '/admin/login' }); }}
                      className="py-2.5 bg-amber-50 border border-amber-300 text-slate-900 rounded-xl text-xs font-bold text-center"
                    >
                      Admin Login ↗
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          SECTION A: HERO SECTION (WITH BESPOKE INDIAN SUNRISE BG)
          ======================================================== */}
      <section
        id="home"
        className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeHeroBg})` }}
      >
        {/* Responsive Atmospheric Gradient Mask: guarantees total readability on all screen sizes */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/70 lg:to-white/40 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F9F6]/30 to-[#F5F9F6] pointer-events-none"></div>

        <div className="relative gov-container">
          <div className="max-w-2xl xl:max-w-3xl 2xl:max-w-4xl space-y-6 sm:space-y-7 text-center lg:text-left">
            {/* Official Initiative Badge */}
            <div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#138808]/40 shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#138808] animate-pulse flex-shrink-0"></span>
                <span className="text-xs sm:text-sm font-bold text-[#006B3C] tracking-wide">
                  Official National Grievance Redressal Portal
                </span>
              </div>
            </div>

            {/* Tagline Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] xl:text-[58px] 2xl:text-[64px] font-black text-[#102A43] tracking-tight leading-[1.12]">
              Your Voice. <span className="text-[#FF9933]">Your Rights.</span> <br className="hidden sm:inline" />
              <span className="text-[#006B3C]">Our Responsibility.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-700 leading-relaxed font-medium max-w-2xl xl:max-w-3xl">
              JanSamadhan empowers every citizen of India to report civic issues in their own native language, attach live photo evidence, and track ground resolution through a transparent, AI-driven national platform.
            </p>

            {/* Multilingual Callout Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 pt-1 text-xs sm:text-sm font-semibold text-slate-700">
              <span className="flex items-center text-[#006B3C] font-bold mr-1">
                <Languages className="w-4 h-4 mr-1.5 text-[#006B3C] flex-shrink-0" />
                Speak or write in:
              </span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">हिंदी</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">English</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">Hinglish</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">भोजपुरी</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">मराठी</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">বাংলা</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">தமிழ்</span>
              <span className="px-2.5 sm:px-3 py-1 bg-white/95 rounded-lg border border-slate-200 shadow-2xs font-bold">తెలుగు</span>
              <span className="text-slate-500 font-bold px-1">&amp; 22+ Scheduled Languages</span>
            </div>

            {/* Matching CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => handleAction('register')}
                className="w-full sm:w-auto h-13 sm:h-14 min-h-[52px] px-8 py-3.5 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-2xl border-2 border-[#138808] hover:border-[#006B3C] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
              >
                <span>Register a Complaint</span>
                <ArrowRight className="w-5 h-5 ml-0.5" />
              </button>
              <button
                onClick={() => handleAction('track')}
                className="w-full sm:w-auto h-13 sm:h-14 min-h-[52px] px-8 py-3.5 bg-white/95 hover:bg-slate-50 text-[#102A43] font-bold rounded-2xl border-2 border-slate-300 shadow-sm hover:border-[#006B3C] transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-[#006B3C]" />
                <span>Track Your Complaint</span>
              </button>
            </div>

            {/* Trust and Guarantees Feature Cards */}
            <div className="pt-4 max-w-4xl border-t border-slate-300/80 mx-auto lg:mx-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                {[
                  { label: '100% Free Service', icon: CheckCircle2 },
                  { label: 'Live Ground Tracking', icon: CheckCircle2 },
                  { label: 'Direct Nodal Routing', icon: CheckCircle2 },
                  { label: '24x7 Assistance', icon: CheckCircle2 }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center space-x-2.5 h-12 px-3.5 py-2.5 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#138808]/40 hover:bg-white transition-all"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#138808]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#138808]" />
                      </div>
                      <span className="text-xs sm:text-[13px] text-slate-800 font-bold whitespace-nowrap leading-tight">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION B: ABOUT JAN SAMADHAN (Digital India, Clean India)
          ======================================================== */}
      <section id="about" className="py-16 md:py-24 bg-white border-y border-slate-200">
        <div className="gov-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C] border border-[#138808]/20 mb-3 inline-block">
              Empowering Public Service
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              About JanSamadhan
            </h2>
            <div className="w-16 h-1 bg-[#138808] mx-auto mt-3 rounded-full"></div>
            
            <p className="mt-5 text-sm sm:text-base text-slate-700 leading-relaxed">
              JanSamadhan is an AI-powered national grievance redressal portal built to bridge the gap between Indian citizens and public authorities. Inspired by <strong>Digital India</strong>, <strong>Clean India (Swachh Bharat)</strong>, and transparent civic administration.
            </p>
          </div>

          {/* 6 Key Objectives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-16">
            <div className="p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">1. Accessible Governance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Empowering all citizens, including rural and non-English speaking communities, to easily interact with public administration.
              </p>
            </div>

            <div className="p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">2. Transparent Tracking</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Complete traceability from registration to final resolution, with every department remark logged in a timestamped audit trail.
              </p>
            </div>

            <div className="p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">3. Rapid Processing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Eliminating manual sorting and bureaucratic bottlenecks through instant algorithmic triage and priority assignment.
              </p>
            </div>

            <div className="p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">4. AI-Powered Classification</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Natural Language Processing identifies specific categories, urgency, and the exact responsible nodal office automatically.
              </p>
            </div>

            <div className="p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">5. Multilingual Citizen Voice</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Accepting complaints in Hindi, Hinglish, Bhojpuri, and 22 scheduled languages through text or spoken voice messages.
              </p>
            </div>

            <div className="p-6 bg-[#F5F9F6] rounded-2xl border border-slate-200 hover:border-[#138808] transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] mb-4 group-hover:bg-[#138808] group-hover:text-white transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-2">6. Strict Accountability</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Strict departmental accountability with escalation alerts, inspection remarks, and closure proof required for every complaint.
              </p>
            </div>
          </div>

          {/* Relationship Flow Diagram */}
          <div className="p-6 sm:p-8 bg-[#102A43] text-white rounded-3xl shadow-xl">
            <h3 className="text-center font-bold text-base sm:text-xl text-white mb-6">
              Citizen ↔ JanSamadhan ↔ Government Department Collaboration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-3xl mb-2">👥</div>
                <h4 className="font-extrabold text-[#FF9933] text-base mb-1">1. Citizens of India</h4>
                <p className="text-xs text-slate-300">
                  Report civic issues in any language using text, microphone voice input, or photographic evidence.
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-[#006B3C] to-[#138808] rounded-2xl border border-emerald-400/30 shadow-lg relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9933] text-[#102A43] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Intelligent Core
                </span>
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-extrabold text-white text-base mb-1">2. JanSamadhan Platform</h4>
                <p className="text-xs text-emerald-100">
                  NLP translates, standardizes to English, classifies priority, and automatically assigns complaint to the nodal officer.
                </p>
              </div>

              <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-3xl mb-2">🏛️</div>
                <h4 className="font-extrabold text-[#FF9933] text-base mb-1">3. Government Departments</h4>
                <p className="text-xs text-slate-300">
                  Electricity, Water, PWD, Drainage, and Sanitation officers inspect, update status, and resolve issues transparently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION C: WHY TRUST JAN SAMADHAN?
          ======================================================== */}
      <section id="trust" className="py-16 md:py-24 bg-[#F5F9F6]">
        <div className="gov-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FF9933]/15 text-[#102A43] border border-[#FF9933]/30 mb-3 inline-block">
              Trust &amp; Public Transparency
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Building a More Responsive India
            </h2>
            <div className="w-16 h-1 bg-[#006B3C] mx-auto mt-3 rounded-full"></div>
            <p className="mt-4 text-sm sm:text-base text-slate-600">
              JanSamadhan enforces public accountability, rapid response times, and seamless civic problem resolution for every citizen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">Transparent Tracking</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Every grievance is assigned a unique reference ID. Citizens can inspect live progress, assigned officers, and timestamped actions anytime.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold">
                🛡️
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">Secure Citizen Accounts</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Direct authentication via Google OAuth 2.0 or Indian mobile number with Bcrypt encryption. High security, zero spam.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold">
                🏛️
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">Department-Wise Routing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Complaints are intelligently routed to the relevant department: Electricity, Water Supply, PWD, Drainage, or Municipal Corporation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold">
                🌐
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">Multilingual Accessibility</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Citizens can write or speak in Hindi, Bhojpuri, Marathi, Bengali, Hinglish, etc. The system generates standardized English for officers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold">
                📷
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">Evidence-Based Grievance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Attach live photos, documents, and GPS geo-tags to substantiate your complaint and prevent vague or misdirected reports.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B3C] flex items-center justify-center font-bold">
                🔔
              </div>
              <h3 className="font-bold text-[#102A43] text-base sm:text-lg">Instant Status Updates</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Real-time status changes from Submitted to Under Review, Assigned, In Progress, and Resolved, with official remarks attached.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION D: HOW IT WORKS (Visual 4-Step Workflow)
          ======================================================== */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white border-y border-slate-200">
        <div className="gov-container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#138808]/10 text-[#006B3C] border border-[#138808]/20 mb-3 inline-block">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              How JanSamadhan Works
            </h2>
            <div className="w-16 h-1 bg-[#138808] mx-auto mt-3 rounded-full"></div>
            <p className="mt-4 text-sm sm:text-base text-slate-600">
              From submission to ground resolution in four transparent, automated steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
            {/* Step 1 */}
            <div className="bg-[#F5F9F6] p-6 rounded-2xl border border-slate-200 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#102A43] text-white flex items-center justify-center font-black text-sm">
                  1
                </span>
                <span className="text-[11px] font-bold text-[#FF9933] uppercase">Authentication</span>
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Register or Login</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens create an account or login instantly using Google OAuth 2.0 or their 10-digit Indian mobile number.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F5F9F6] p-6 rounded-2xl border border-slate-200 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#006B3C] text-white flex items-center justify-center font-black text-sm">
                  2
                </span>
                <span className="text-[11px] font-bold text-[#138808] uppercase">Submission</span>
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Submit Complaint</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens report issues by typing in any regional language, speaking via microphone voice input, or attaching photos and GPS location.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#F5F9F6] p-6 rounded-2xl border border-slate-200 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#FF9933] text-[#102A43] flex items-center justify-center font-black text-sm">
                  3
                </span>
                <span className="text-[11px] font-bold text-amber-700 uppercase">AI Processing</span>
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">NLP &amp; Routing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The NLP system detects language, standardizes to formal English, categorizes the grievance, and auto-assigns it to the correct department.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#F5F9F6] p-6 rounded-2xl border border-slate-200 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#138808] text-white flex items-center justify-center font-black text-sm">
                  4
                </span>
                <span className="text-[11px] font-bold text-[#006B3C] uppercase">Resolution</span>
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Track Resolution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens monitor complaint status in real-time, view official inspection notes, and confirm closure with complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION E: MAIN ACTION SECTION (Most Important Section)
          ======================================================== */}
      <section id="action-section" className="py-16 md:py-24 bg-gradient-to-b from-[#F5F9F6] via-white to-[#F5F9F6] relative">
        <div className="gov-container">
          
          {/* Centered Logo & Heading */}
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="flex justify-center mb-1">
              <JanSamadhanLogo size="lg" variant="light" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-[#102A43] tracking-tight">
              Your Problem Deserves Attention.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              Raise a grievance or track an existing one. JanSamadhan makes public service accessible, honest, and swift.
            </p>
          </div>

          {/* TWO LARGE PREMIUM ACTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            
            {/* CARD 1: REGISTER A COMPLAINT */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-300 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#138808]/15 to-transparent rounded-bl-full pointer-events-none"></div>

              <div className="space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#138808]/15 flex items-center justify-center text-[#006B3C] group-hover:scale-105 transition-transform">
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

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

              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => handleAction('register')}
                  className="w-full py-4 px-6 bg-[#138808] hover:bg-[#006B3C] text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
                >
                  <span>Register Complaint</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>

            {/* CARD 2: TRACK YOUR COMPLAINT */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 hover:border-[#102A43] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#102A43]/10 to-transparent rounded-bl-full pointer-events-none"></div>

              <div className="space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#102A43]/10 flex items-center justify-center text-[#102A43] group-hover:scale-105 transition-transform">
                  <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-[#102A43]" />
                </div>

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

              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => handleAction('track')}
                  className="w-full py-4 px-6 bg-[#102A43] hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
                >
                  <MapPin className="w-5 h-5 mr-1 text-[#FF9933]" />
                  <span>Track Your Complaint</span>
                </button>
              </div>
            </div>

          </div>

          <div className="mt-8 text-center text-xs text-slate-500 font-medium">
            🔒 Protected by 256-bit encryption. All actions comply with digital citizen governance privacy guidelines.
          </div>
        </div>
      </section>

      {/* ========================================================
          FOOTER & CONTACT SECTION
          ======================================================== */}
      <footer id="contact" className="mt-auto bg-[#102A43] text-slate-300 text-xs border-t border-slate-800">
        <div className="gov-container py-12">
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
