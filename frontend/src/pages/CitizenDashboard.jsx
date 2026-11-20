import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Mic,
  MicOff,
  PlusCircle,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  LogOut,
  FileText,
  Camera,
  Navigation,
  X,
  Volume2,
  Languages,
  ArrowLeft,
  Search,
  StopCircle,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  AlertCircle,
  Check,
  Menu
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import citizenDashboardBg from '../assets/citizen_dashboard_bg.jpg';
import {
  classifyComplaint,
  submitComplaintToBackend,
  fetchAllComplaints,
  uploadEvidenceFile,
  transcribeComplaintAudio
} from '../services/api';
import { AudioRecorder } from '../utils/audioRecorder';

// Fix Leaflet default marker icon path issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Map Click Handler component
function LocationMarker({ position, setPosition, setLocationAddress }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition({ lat, lng });
      const coordStr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Pinned on Map)`;
      setLocationAddress(coordStr);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
          const city = addr.city || addr.town || addr.county || addr.state_district || '';
          const state = addr.state || '';
          const readable = [street, city, state].filter(Boolean).join(', ');
          if (readable) {
            setLocationAddress(`${readable} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);
          }
        }
      } catch (err) {
        // Fallback to coordStr
      }
    },
  });

  return position === null ? null : <Marker position={[position.lat, position.lng]} />;
}

// Pan map when position changes
function MapCenterSync({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
    }
  }, [position, map]);
  return null;
}

// Supported Indian Languages (Scheduled + Prominent Regional)
const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Language', speechLang: 'hi-IN', badge: 'Auto' },
  { code: 'hi', name: 'Hindi (हिंदी)', speechLang: 'hi-IN', badge: 'हिंदी' },
  { code: 'en', name: 'English', speechLang: 'en-IN', badge: 'English' },
  { code: 'hinglish', name: 'Hinglish (Hindi in Roman script)', speechLang: 'hi-IN', badge: 'Hinglish' },
  { code: 'bho', name: 'Bhojpuri (भोजपुरी)', speechLang: 'hi-IN', badge: 'भोजपुरी' },
  { code: 'bn', name: 'Bengali (বাংলা)', speechLang: 'bn-IN', badge: 'বাংলা' },
  { code: 'mr', name: 'Marathi (मराठी)', speechLang: 'mr-IN', badge: 'मराठी' },
  { code: 'te', name: 'Telugu (తెలుగు)', speechLang: 'te-IN', badge: 'తెలుగు' },
  { code: 'ta', name: 'Tamil (தமிழ்)', speechLang: 'ta-IN', badge: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', speechLang: 'gu-IN', badge: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', speechLang: 'pa-IN', badge: 'ਪੰਜਾਬੀ' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', speechLang: 'kn-IN', badge: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam (മലയാളം)', speechLang: 'ml-IN', badge: 'മലയാളം' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', speechLang: 'or-IN', badge: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu (اردو)', speechLang: 'ur-IN', badge: 'اردو' },
  { code: 'as', name: 'Assamese (অসমীয়া)', speechLang: 'bn-IN', badge: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili (मैथिली)', speechLang: 'hi-IN', badge: 'मैथिली' },
  { code: 'ne', name: 'Nepali (नेपाली)', speechLang: 'ne-NP', badge: 'नेपाली' },
  { code: 'hr', name: 'Haryanvi (हरियाणवी)', speechLang: 'hi-IN', badge: 'हरियाणवी' },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)', speechLang: 'hi-IN', badge: 'संस्कृतम्' },
  { code: 'ks', name: 'Kashmiri (کٲشُر)', speechLang: 'ur-IN', badge: 'کٲشُر' },
  { code: 'kok', name: 'Konkani (कोंकणी)', speechLang: 'mr-IN', badge: 'कोंकणी' },
  { code: 'mni', name: 'Manipuri (মণিপুরী)', speechLang: 'bn-IN', badge: 'মণিপুরী' },
];

const SAMPLE_PROMPTS = [
  { lang: 'Hindi', text: 'हमारे इलाके में पिछले पांच दिनों से पानी नहीं आ रहा है।' },
  { lang: 'Hinglish', text: 'Hamare area mein 4 din se naali ka paani road par jama hai aur bahut badbu aa rahi hai.' },
  { lang: 'Bhojpuri', text: 'हमार इलाका में पाँच दिन से पानी नइखे आवत, बहुत परेशानी बा।' },
  { lang: 'English', text: 'Streetlights on the main sector road have been out of order for 3 nights, posing a safety risk.' },
  { lang: 'Bengali', text: 'আমাদের এলাকায় গত তিন দিন ধরে বিদ্যুৎ নেই, রাস্তা অন্ধকার।' },
  { lang: 'Marathi', text: 'कॉलनीच्या गेटजवळ कचऱ्याचा ढीग साचला आहे, दुर्गंधी येत आहे.' },
];

export default function CitizenDashboard({
  user,
  initialTab = 'new-complaint',
  complaints: propComplaints = [],
  onAddComplaint,
  onLogout,
  onNavigateHome
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'new-complaint' or 'my-complaints'
  const [complaints, setComplaints] = useState(propComplaints || []);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Registration Form States
  const [selectedLang, setSelectedLang] = useState('auto');
  const [rawInput, setRawInput] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [position, setPosition] = useState({ lat: 28.6139, lng: 77.2090 }); // Default New Delhi coordinates
  
  // Voice Recording States
  // 'idle' | 'recording' | 'paused' | 'processing' | 'captured'
  const [voiceState, setVoiceState] = useState('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [detectedVoiceLang, setDetectedVoiceLang] = useState('');

  // Evidence States
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);

  // AI Pipeline States
  const [isLocating, setIsLocating] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Refs
  const recorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Sync initial tab if prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load complaints from backend
  const loadComplaints = async () => {
    try {
      const data = await fetchAllComplaints();
      if (Array.isArray(data) && data.length > 0) {
        setComplaints(data);
      }
    } catch (err) {
      console.error("Error loading complaints", err);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    if (propComplaints && propComplaints.length > 0) {
      setComplaints(propComplaints);
    }
  }, [propComplaints]);

  useEffect(() => {
    if (!selectedComplaint && complaints && complaints.length > 0) {
      setSelectedComplaint(complaints[0]);
    }
  }, [complaints, selectedComplaint]);

  // Clean up timers & speech recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========================================================
  // VOICE RECORDING & MULTILINGUAL SPEECH-TO-TEXT PIPELINE
  // ========================================================
  const startRecording = async () => {
    setVoiceError('');
    setVoiceNotice('');
    setDetectedVoiceLang('');
    setRecordingSeconds(0);

    // 1. Initialize Hardware AudioRecorder (16kHz Mono PCM WAV)
    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    try {
      await recorder.start();
      setVoiceState('recording');
      setRecordingSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("AudioRecorder start error:", err);
      setVoiceError(err.message || "Failed to access microphone. Please check permissions.");
      setVoiceState('idle');
      return;
    }

    // 2. Parallel Web Speech Recognition (for instant live interim feedback if supported)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
    const speechCode = currentLangObj.speechLang;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = speechCode;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setRawInput(transcript);
          }
        };

        recognition.onerror = (e) => {
          console.warn("Web Speech API notice:", e.error);
        };

        recognition.start();
      } catch (err) {
        console.warn("Web Speech API initialization notice:", err);
      }
    }
  };

  const pauseRecording = () => {
    if (recorderRef.current && voiceState === 'recording') {
      recorderRef.current.pause();
      setVoiceState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (recorderRef.current && voiceState === 'paused') {
      recorderRef.current.resume();
      setVoiceState('recording');
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVoiceState('processing');

    // 1. Stop parallel SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // 2. Stop audio recorder and extract 16kHz WAV Blob
    let wavBlob = null;
    if (recorderRef.current) {
      try {
        wavBlob = await recorderRef.current.stop();
        setAudioBlob(wavBlob);
        const url = URL.createObjectURL(wavBlob);
        setAudioBlobUrl(url);
      } catch (err) {
        console.warn("Audio recording stop error:", err);
        setVoiceError(err.message || "Failed to process audio recording.");
        setVoiceState('idle');
        return;
      }
    }

    if (!wavBlob) {
      setVoiceState('idle');
      return;
    }

    // 3. Send audio to backend FastAPI /api/complaints/transcribe
    try {
      const transcribeResult = await transcribeComplaintAudio(wavBlob, selectedLang);
      if (transcribeResult && transcribeResult.text) {
        setRawInput(transcribeResult.text);
        setDetectedVoiceLang(transcribeResult.detected_language || 'Hindi');
        setVoiceNotice('Your voice has been captured successfully.');
        // Trigger AI NLP classification preview automatically
        handleAnalyzeText(transcribeResult.text);
      }
      setVoiceState('captured');
    } catch (err) {
      console.warn("Backend transcription notice:", err);
      // If browser SpeechRecognition already gathered text, keep it!
      if (rawInput && rawInput.trim().length > 0) {
        setVoiceState('captured');
        setVoiceNotice('Your voice has been captured successfully.');
        handleAnalyzeText(rawInput);
      } else {
        setVoiceError(err.message || "Could not transcribe audio. Please speak clearly into the microphone.");
        setVoiceState('captured');
      }
    }
  };

  const deleteRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlob(null);
    setAudioBlobUrl(null);
    setVoiceState('idle');
    setRecordingSeconds(0);
    setVoiceError('');
    setVoiceNotice('');
  };

  const deleteTranscription = () => {
    deleteRecording();
    setRawInput('');
    setAiPreview(null);
    setDetectedVoiceLang('');
  };

  const recordAgain = () => {
    deleteRecording();
    startRecording();
  };

  // ========================================================
  // GPS Geolocation (High Accuracy HTML5)
  // ========================================================
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);
        setPosition({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
            const city = addr.city || addr.town || addr.county || addr.state_district || '';
            const state = addr.state || '';
            const pincode = addr.postcode || '';
            const readable = [street, city, state, pincode].filter(Boolean).join(', ');

            if (readable) {
              setLocationAddress(`${readable} (GPS Tagged ±${accuracy}m)`);
            } else {
              setLocationAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Tagged ±${accuracy}m)`);
            }
          }
        } catch {
          setLocationAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Tagged ±${accuracy}m)`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        alert("Unable to fetch GPS location. Please allow location permissions in your browser or click on the map to pin.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ========================================================
  // AI Grievance Multilingual NLP Classification
  // ========================================================
  const handleAnalyzeText = async (customText = null) => {
    const textToAnalyze = typeof customText === 'string' ? customText : rawInput;
    if (!textToAnalyze || !textToAnalyze.trim()) return;

    setIsClassifying(true);
    try {
      const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);
      const langParam = selectedLangObj && selectedLangObj.code !== 'auto' ? selectedLangObj.name : null;

      const analysis = await classifyComplaint(textToAnalyze, langParam);
      setAiPreview(analysis);
    } catch (err) {
      console.warn("AI Classification error:", err);
      // Real backend response required; set null preview if failed
      setAiPreview(null);
    } finally {
      setIsClassifying(false);
    }
  };

  // ========================================================
  // File / Camera Upload
  // ========================================================
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Check 10MB size limit
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please choose a smaller file.");
        return;
      }
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  // ========================================================
  // Submit Grievance
  // ========================================================
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!rawInput.trim()) {
      alert("Kripya apni samasya type karein ya microphone se bole.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalEvidenceUrl = evidencePreview;

      // Upload file to FastAPI backend
      if (evidenceFile) {
        finalEvidenceUrl = await uploadEvidenceFile(evidenceFile);
      }

      // Ensure AI analysis is ready
      const analysis = aiPreview || (await classifyComplaint(rawInput));

      const payload = {
        raw_input: rawInput.trim(),
        original_complaint_text: rawInput.trim(),
        standardized_english_text: analysis?.standardized_english || analysis?.formal_description || rawInput.trim(),
        detected_language: analysis?.detected_language || "Hindi/Hinglish",
        location_address: locationAddress.trim() || `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)} (Pinned on Map)`,
        latitude: position.lat,
        longitude: position.lng,
        citizen_name: user?.name || "Citizen",
        citizen_phone: user?.phone || "9876543210",
        citizen_email: user?.email || (user?.phone && user.phone.includes('@') ? user.phone.replace(/^email:/, '') : undefined),
        evidence_url: finalEvidenceUrl,
        category: analysis?.category || "General Grievance",
        sub_category: analysis?.sub_category || "Civic Complaint",
        priority: analysis?.priority || "Medium",
        department: analysis?.department || "Municipal Corporation"
      };

      const savedComplaint = await submitComplaintToBackend(payload);

      setSubmissionSuccess(savedComplaint);

      if (onAddComplaint) {
        onAddComplaint(savedComplaint);
      }
      setComplaints((prev) => [savedComplaint, ...prev]);

      // Reset form
      setRawInput('');
      setLocationAddress('');
      setAiPreview(null);
      setEvidenceFile(null);
      setEvidencePreview(null);
      setAudioBlobUrl(null);
      setVoiceNotice('');
      setSelectedComplaint(savedComplaint);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission error: " + (err.message || "Failed to connect to backend server."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st) => {
    const badgeMap = {
      SUBMITTED: "bg-slate-100 text-slate-800 border-slate-300",
      UNDER_REVIEW: "bg-purple-100 text-purple-900 border-purple-200",
      ASSIGNED: "bg-blue-100 text-blue-900 border-blue-200",
      IN_PROGRESS: "bg-amber-100 text-amber-900 border-amber-200",
      RESOLVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
      REJECTED: "bg-red-100 text-red-900 border-red-200"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeMap[st] || badgeMap.SUBMITTED}`}>
        {(st || 'SUBMITTED').replace('_', ' ')}
      </span>
    );
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      (c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.raw_input || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.standardized_english_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className="min-h-screen bg-[#F5F9F6] flex flex-col font-sans selection:bg-[#138808]/20 selection:text-[#006B3C] bg-cover bg-fixed bg-center relative"
      style={{ backgroundImage: `url(${citizenDashboardBg})` }}
    >
      {/* Background Readability Mask: Ensures 100% WCAG contrast while preserving Swachh Bharat clean city backdrop */}
      <div className="fixed inset-0 bg-[#F5F9F6]/94 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#102A43] text-white shadow-md border-b-2 border-[#138808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <JanSamadhanLogo size="sm" variant="dark" onClick={onNavigateHome} />
            <div className="hidden sm:block border-l border-slate-700 pl-3">
              <span className="text-xs text-[#FF9933] font-bold uppercase tracking-wider block">Citizen Portal</span>
              <span className="text-[11px] text-slate-300">Grievance Registration &amp; Audit Console</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-300 hover:text-white font-medium hidden md:inline-flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Home
            </button>

            <div className="text-right">
              <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-none">{user?.name || "Citizen"}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden xs:block">
                {user?.phone ? `+91 ${user.phone}` : (user?.email || "Verified Citizen")}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="px-2.5 sm:px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-200/80">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('new-complaint');
                setSubmissionSuccess(null);
              }}
              className={`px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'new-complaint'
                  ? 'bg-[#138808] text-white shadow-md'
                  : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span>Register New Complaint</span>
            </button>

            <button
              onClick={() => setActiveTab('my-complaints')}
              className={`px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'my-complaints'
                  ? 'bg-[#102A43] text-white shadow-md'
                  : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>Track Complaints ({complaints.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 font-medium bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            🏛️ Standardized Redressal SLA: <strong className="text-[#006B3C]">24 to 72 Hours</strong>
          </div>
        </div>

        {/* TAB 1: REGISTER COMPLAINT */}
        {activeTab === 'new-complaint' && (
          <div className="space-y-8">
            
            {/* Submission Success Modal / Alert */}
            {submissionSuccess && (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#138808] text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-[#006B3C]">
                        Grievance Registered Successfully!
                      </h3>
                      <p className="text-xs text-slate-600">
                        Complaint ID: <strong className="font-mono text-slate-900">{submissionSuccess.id}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('my-complaints')}
                    className="px-4 py-2 bg-[#006B3C] hover:bg-[#138808] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    View Status &amp; Track →
                  </button>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-xs text-slate-700 space-y-1">
                  <p><strong>Auto-Assigned Department:</strong> {submissionSuccess.department}</p>
                  <p><strong>Predicted Priority:</strong> <span className="font-bold text-amber-700">{submissionSuccess.priority}</span></p>
                  <p><strong>Standardized English Summary:</strong> {submissionSuccess.standardized_english_text || submissionSuccess.formal_description}</p>
                </div>
              </div>
            )}

            {/* Registration Form Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-lg border border-slate-200">
              
              {/* SECTION A: VOICE-BASED GRIEVANCE REGISTRATION BANNER & INTERACTION CONSOLE */}
              <div className="mb-8 p-6 sm:p-8 bg-gradient-to-br from-[#F5F9F6] via-emerald-50/40 to-slate-50 rounded-3xl border-2 border-[#138808]/30 shadow-sm relative overflow-hidden">
                <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-100/90 text-[#006B3C] text-xs font-bold mb-1">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Multilingual Voice Grievance Redressal</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight">
                    Speak Your Problem. We Will Listen.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Register your complaint in your preferred language using your voice.
                  </p>
                </div>

                {/* Language Selection Row */}
                <div className="max-w-md mx-auto mb-6 flex items-center justify-center space-x-2">
                  <Languages className="w-4 h-4 text-[#006B3C] flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Preferred Language:</span>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="px-3 py-1.5 bg-white text-xs font-bold border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Microphone Error Alert (Granular browser feedback) */}
                {voiceError && (
                  <div className="max-w-lg mx-auto mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center justify-between text-xs text-red-800 font-semibold shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <span>{voiceError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoiceError('')}
                      className="ml-2 text-red-900 font-bold hover:opacity-80 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* MAIN MICROPHONE CONSOLE */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  {/* STATE 1: Before Recording (IDLE) */}
                  {voiceState === 'idle' && (
                    <div className="flex flex-col items-center space-y-3">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-24 h-24 rounded-full bg-[#138808] hover:bg-[#006B3C] text-white shadow-xl hover:shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 border-4 border-emerald-100 ring-4 ring-emerald-500/20"
                        title="Click to start recording"
                      >
                        <Mic className="w-10 h-10" />
                      </button>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        Tap the microphone to start speaking.
                      </p>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-5 py-2.5 bg-[#FF9933] hover:bg-amber-600 text-[#102A43] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>REGISTER THROUGH VOICE</span>
                      </button>
                    </div>
                  )}

                  {/* STATE 2: Recording in Progress */}
                  {voiceState === 'recording' && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 border-4 border-red-200 animate-pulse ring-8 ring-red-400/30"
                          title="Click to stop recording"
                        >
                          <Mic className="w-10 h-10" />
                        </button>
                        <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping pointer-events-none"></span>
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold text-red-600 animate-pulse">
                        Listening... Your complaint is being recorded.
                      </p>
                      <div className="flex items-center space-x-2 text-red-700 font-mono text-sm font-bold bg-red-100/90 px-3.5 py-1 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                        <span>00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                      </div>

                      {/* Controls: Stop, Pause, Cancel */}
                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>Stop Recording</span>
                        </button>
                        <button
                          type="button"
                          onClick={pauseRecording}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </button>
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STATE 3: Paused */}
                  {voiceState === 'paused' && (
                    <div className="flex flex-col items-center space-y-3">
                      <button
                        type="button"
                        onClick={resumeRecording}
                        className="w-24 h-24 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all border-4 border-amber-200"
                      >
                        <Play className="w-10 h-10 ml-1" />
                      </button>
                      <p className="text-xs sm:text-sm font-bold text-amber-800">
                        Recording paused ({recordingSeconds}s). Click resume to continue speaking.
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={resumeRecording}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                        >
                          <Play className="w-4 h-4" />
                          <span>Resume</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>Stop &amp; Transcribe</span>
                        </button>
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STATE 4: Transcribing / AI Processing */}
                  {voiceState === 'processing' && (
                    <div className="flex flex-col items-center space-y-3 py-4">
                      <div className="w-12 h-12 border-4 border-[#138808] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-[#006B3C]">
                        Transcribing your speech with AI engine...
                      </p>
                      <p className="text-xs text-slate-500">
                        Analyzing audio track and detecting language...
                      </p>
                    </div>
                  )}

                  {/* STATE 5: Voice Captured Successfully */}
                  {voiceState === 'captured' && (
                    <div className="flex flex-col items-center space-y-3 w-full max-w-lg">
                      {/* Success notification */}
                      <div className="w-full py-2.5 px-3.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-center text-xs font-extrabold text-[#006B3C] flex items-center justify-center space-x-2 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#138808]" />
                        <span>Your voice has been captured successfully.</span>
                      </div>

                      {/* Audio playback */}
                      {audioBlobUrl && (
                        <div className="w-full p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-700 flex items-center whitespace-nowrap">
                            <Volume2 className="w-4 h-4 mr-1 text-[#006B3C]" />
                            Audio Playback:
                          </span>
                          <audio controls src={audioBlobUrl} className="h-8 w-full max-w-xs" />
                        </div>
                      )}

                      {/* Record Again & Delete buttons */}
                      <div className="flex items-center space-x-3 pt-1">
                        <button
                          type="button"
                          onClick={recordAgain}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Record Again</span>
                        </button>
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Audio</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sample native complaint chips for quick testing */}
                <div className="mt-6 pt-5 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                    💡 Or test instant complaints in native languages:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SAMPLE_PROMPTS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRawInput(sample.text);
                          setDetectedVoiceLang(sample.lang);
                          handleAnalyzeText(sample.text);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#006B3C] text-xs rounded-xl font-medium border border-slate-200 shadow-sm transition-colors text-left cursor-pointer"
                      >
                        <span className="font-bold text-[#006B3C] mr-1">[{sample.lang}]</span>
                        "{sample.text.length > 40 ? sample.text.substring(0, 40) + '...' : sample.text}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION B: TRANSCRIPTION PREVIEW & EDITING (YOUR DETECTED COMPLAINT) */}
              {(rawInput || voiceState === 'captured') && (
                <div className="mb-8 p-6 bg-white rounded-3xl border-2 border-emerald-300 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#006B3C]" />
                        <h4 className="text-sm font-black text-[#102A43] uppercase tracking-wide">
                          YOUR DETECTED COMPLAINT
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Please review your complaint before submitting.
                      </p>
                    </div>

                    {/* Language Badge */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-500">Detected Language:</span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-[#006B3C] text-xs font-bold rounded-lg border border-emerald-200">
                        {detectedVoiceLang || (aiPreview?.detected_language) || "Auto-Detected"}
                      </span>
                    </div>
                  </div>

                  {/* Transcribed Text Editable Area */}
                  <div>
                    <textarea
                      rows={4}
                      value={rawInput}
                      onChange={(e) => {
                        setRawInput(e.target.value);
                        if (aiPreview) setAiPreview(null);
                      }}
                      onBlur={() => {
                        if (rawInput.trim().length > 5) {
                          handleAnalyzeText(rawInput);
                        }
                      }}
                      placeholder="Transcribed complaint will appear here. You can edit the text directly..."
                      className="w-full p-4 bg-slate-50/60 hover:bg-white focus:bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none leading-relaxed transition-colors"
                    />
                  </div>

                  {/* Action Bar for Transcription Review */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={recordAgain}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Record Again</span>
                      </button>
                      <button
                        type="button"
                        onClick={deleteTranscription}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {/* CONFIRM & SUBMIT COMPLAINT BUTTON */}
                    <button
                      type="button"
                      onClick={handleSubmitComplaint}
                      disabled={isSubmitting || !rawInput.trim()}
                      className="px-6 py-3 bg-[#138808] hover:bg-[#006B3C] text-white font-black text-xs sm:text-sm uppercase tracking-wide rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{isSubmitting ? 'Submitting to NLP Engine...' : 'CONFIRM & SUBMIT COMPLAINT'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form for Location, Photos, and Details */}
              <form onSubmit={handleSubmitComplaint} className="space-y-6">
                
                {/* Manual Text Edit Field (Visible if not reviewing voice or for manual typers) */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                      <span>Complaint Description (Manual Text or Voice Transcribed) *</span>
                    </label>

                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3 py-1.5 bg-[#FF9933] hover:bg-amber-600 text-[#102A43] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Speak with Mic</span>
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={rawInput}
                    onChange={(e) => {
                      setRawInput(e.target.value);
                      if (aiPreview) setAiPreview(null);
                    }}
                    onBlur={() => {
                      if (rawInput.trim().length > 10) {
                        handleAnalyzeText();
                      }
                    }}
                    placeholder="Describe your grievance in Hindi, Hinglish, Bhojpuri, Marathi, Bengali, or English... (e.g. 'हमारे इलाके में 4 दिन से नाली का पानी सड़क पर जमा है और बहुत बदबू आ रही है')"
                    className="w-full p-4 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none leading-relaxed"
                  />

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[11px] text-slate-500">
                      JanSamadhan preserves your original native wording while generating standardized English for government authorities.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAnalyzeText()}
                      disabled={isClassifying || !rawInput.trim()}
                      className="text-xs font-bold text-[#006B3C] hover:underline flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isClassifying ? 'Analyzing NLP...' : 'Preview AI Routing'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Classification & Standardization Preview Panel */}
                {aiPreview && (
                  <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-blue-50/50 rounded-2xl border-2 border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#006B3C]" />
                        <span className="text-xs font-black text-[#102A43] uppercase tracking-wide">
                          AI Multilingual NLP Redressal Preview
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-[#138808] text-white text-[10px] font-bold rounded-full">
                        Confidence {Math.round((aiPreview.confidence || 0.95) * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Detected Native Language:</span>
                        <strong className="text-[#102A43] font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                          {aiPreview.detected_language || 'Hindi / Hinglish'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Predicted Priority:</span>
                        <strong className={`font-bold text-sm px-2 py-0.5 rounded border inline-block mt-0.5 ${
                          aiPreview.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {aiPreview.priority} Priority
                        </strong>
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-slate-500 block">Standardized English Complaint:</span>
                        <p className="mt-1 p-3 bg-white rounded-xl border border-slate-200 text-slate-800 font-medium leading-relaxed">
                          "{aiPreview.standardized_english || aiPreview.formal_description}"
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Assigned Category:</span>
                        <strong className="text-slate-900">{aiPreview.category} ({aiPreview.sub_category})</strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Routing Department:</span>
                        <strong className="text-[#006B3C] font-extrabold">{aiPreview.department}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* METHOD 3: Photo / Evidence Attachment */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-[#006B3C]" />
                      <span>Supporting Evidence (Photo / Document)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Max size: 10MB</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleImageChange}
                      className="text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#102A43] file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />

                    {evidencePreview && (
                      <div className="relative inline-block border-2 border-emerald-300 rounded-xl overflow-hidden shadow-sm">
                        <img src={evidencePreview} alt="Evidence preview" className="h-16 w-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setEvidenceFile(null);
                            setEvidencePreview(null);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Selection & Map */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-[#006B3C]" />
                      <span>Incident Location &amp; Pin On Map *</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      disabled={isLocating}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#006B3C] text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Locating GPS...' : 'Use My Live GPS'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Enter street, colony, sector, or landmark (or click directly on map)"
                    className="w-full px-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />

                  {/* Leaflet Map */}
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative z-10">
                    <MapContainer
                      center={[position.lat, position.lng]}
                      zoom={14}
                      scrollWheelZoom={false}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapCenterSync position={position} />
                      <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        setLocationAddress={setLocationAddress}
                      />
                    </MapContainer>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    📍 Click anywhere on the map to accurately pin the problem location.
                  </p>
                </div>

                {/* Submit Grievance Button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting || !rawInput.trim()}
                    className="w-full py-4 bg-[#138808] hover:bg-[#006B3C] disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all text-base flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing AI NLP &amp; Registering Complaint...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Submit Official Grievance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: TRACK MY COMPLAINTS */}
        {activeTab === 'my-complaints' && (
          <div className="space-y-6">
            
            {/* KPI Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#102A43]">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Complaints</span>
                <p className="text-2xl sm:text-3xl font-black text-[#102A43] mt-1">{complaints.length}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#FF9933]">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">In Progress</span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                  {complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length}
                </p>
              </div>
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#138808]">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Resolved</span>
                <p className="text-2xl sm:text-3xl font-black text-[#006B3C] mt-1">
                  {complaints.filter((c) => c.status === 'RESOLVED').length}
                </p>
              </div>
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm border-t-4 border-t-red-500">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">High / Critical</span>
                <p className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
                  {complaints.filter((c) => c.priority === 'High' || c.priority === 'Critical').length}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by ID, keyword, or language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#102A43] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Complaints Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Complaint Cards List */}
              <div className="lg:col-span-5 space-y-3">
                {filteredComplaints.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
                    <FileText className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-semibold text-sm">No complaints found matching criteria.</p>
                    <button
                      onClick={() => setActiveTab('new-complaint')}
                      className="px-4 py-2 bg-[#138808] text-white text-xs font-bold rounded-xl"
                    >
                      Register First Complaint
                    </button>
                  </div>
                ) : (
                  filteredComplaints.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedComplaint(item)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        selectedComplaint?.id === item.id
                          ? 'bg-white border-[#006B3C] shadow-md ring-2 ring-[#006B3C]/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-xs text-[#006B3C]">{item.id}</span>
                        {getStatusBadge(item.status)}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                      
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {item.standardized_english_text || item.formal_description || item.raw_input}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          🌐 {item.detected_language || 'Hindi/Hinglish'}
                        </span>
                        <span className="font-bold text-slate-700">{item.department}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Detailed Complaint View & Audit Timeline */}
              <div className="lg:col-span-7">
                {selectedComplaint ? (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
                    {/* Mobile Back to List Button */}
                    <div className="lg:hidden pb-2 border-b border-slate-100 flex justify-between items-center">
                      <button
                        onClick={() => setSelectedComplaint(null)}
                        className="text-xs text-[#006B3C] font-bold hover:underline flex items-center space-x-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to All Complaints</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">Viewing Details</span>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-[#006B3C] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            {selectedComplaint.id}
                          </span>
                          <span className="text-xs text-slate-500">{selectedComplaint.created_at}</span>
                        </div>
                        <h3 className="text-xl font-black text-[#102A43] mt-2">
                          {selectedComplaint.title}
                        </h3>
                      </div>
                      <div>{getStatusBadge(selectedComplaint.status)}</div>
                    </div>

                    {/* Department & Priority Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                        <strong className="text-slate-900">{selectedComplaint.category}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Department</span>
                        <strong className="text-[#006B3C]">{selectedComplaint.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Priority</span>
                        <strong className="text-amber-700">{selectedComplaint.priority}</strong>
                      </div>
                    </div>

                    {/* Standardized English Summary (Prominent) */}
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                      <span className="text-[11px] font-bold text-[#006B3C] uppercase tracking-wider block">
                        Standardized Official Grievance Summary (English)
                      </span>
                      <p className="text-sm text-slate-800 font-medium leading-relaxed">
                        {selectedComplaint.standardized_english_text || selectedComplaint.formal_description}
                      </p>
                    </div>

                    {/* Original Citizen Input (Preserved for Transparency) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Original Citizen Submission (Un-altered)
                        </span>
                        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                          Language: {selectedComplaint.detected_language || 'Hindi/Hinglish'}
                        </span>
                      </div>
                      <p className="text-sm italic font-medium text-slate-800 pt-1">
                        "{selectedComplaint.original_complaint_text || selectedComplaint.raw_input}"
                      </p>
                    </div>

                    {/* Location & Evidence */}
                    <div className="space-y-3">
                      <p className="text-xs text-slate-700 font-medium flex items-center">
                        <MapPin className="w-4 h-4 text-[#006B3C] mr-1.5 flex-shrink-0" />
                        <span><strong>Location:</strong> {selectedComplaint.location_address}</span>
                      </p>

                      {selectedComplaint.evidence_url && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">Photo Evidence Attached</span>
                          <img
                            src={selectedComplaint.evidence_url}
                            alt="Complaint evidence"
                            className="h-44 w-auto rounded-xl object-cover border border-slate-200 shadow-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Real-time Status Audit Trail */}
                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-extrabold text-sm text-[#102A43] mb-4 flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-[#006B3C]" />
                        <span>Official Redressal Timeline &amp; Remarks</span>
                      </h4>

                      <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {(selectedComplaint.history || []).map((h, idx) => (
                          <div key={idx} className="relative pl-8 text-xs">
                            <span className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-[#138808] border-2 border-white shadow-sm"></span>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">{h.status}</span>
                              <span className="text-slate-400 font-mono text-[11px]">{h.time}</span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">
                              {h.remark || "Status updated by grievance authority."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400">
                    Select a complaint on the left to inspect its detailed redressal timeline.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}