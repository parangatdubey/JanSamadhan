import React, { useState } from 'react';
import {
  LogOut,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  FileCheck
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import officerDashboardBg from '../assets/officer_dashboard_bg.jpg';

export default function OfficerDashboard({ user, complaints, onUpdateStatus, onLogout, onNavigateHome }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkInputs, setRemarkInputs] = useState({});

  const filtered = complaints.filter((c) => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch =
      (c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.raw_input || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.standardized_english_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (complaintId, newStatus) => {
    const remark = remarkInputs[complaintId] || `Official status updated to ${newStatus.replace('_', ' ')} by ${user.name}`;
    onUpdateStatus(complaintId, newStatus, remark);
    setRemarkInputs({ ...remarkInputs, [complaintId]: '' });
  };

  return (
    <div
      className="min-h-screen bg-[#F5F9F6] flex flex-col font-sans selection:bg-[#138808]/20 selection:text-[#006B3C] bg-cover bg-fixed bg-center relative"
      style={{ backgroundImage: `url(${officerDashboardBg})` }}
    >
      {/* Background Readability Mask */}
      <div className="fixed inset-0 bg-[#F5F9F6]/94 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Officer Header */}
      <header className="sticky top-0 z-50 bg-[#102A43] text-white shadow-md border-b-2 border-[#138808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <JanSamadhanLogo size="sm" variant="dark" onClick={onNavigateHome} />
            <div className="hidden sm:block border-l border-slate-700 pl-3">
              <h1 className="font-bold text-sm leading-none text-white">Officer Command Center</h1>
              <span className="text-[11px] text-[#FF9933] font-medium">
                {user.department || "Department Nodal Redressal Console"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-300 hover:text-white font-medium hidden md:inline-flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Home
            </button>

            <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5">
              <span>👮</span>
              <span className="font-bold text-white truncate max-w-[130px] sm:max-w-none">{user.name}</span>
              <span className="hidden sm:inline text-slate-400">({user.login_id || user.department})</span>
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

      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#102A43]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Total Assigned</span>
              <Layers className="w-4 h-4 text-[#102A43]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#102A43]">{complaints.length}</p>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#FF9933]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Action</span>
              <Clock className="w-4 h-4 text-[#FF9933]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">
              {complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#138808]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-[#138808]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#006B3C]">
              {complaints.filter((c) => c.status === 'RESOLVED').length}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-red-500">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">High / Critical</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-red-600">
              {complaints.filter((c) => c.priority === 'High' || c.priority === 'Critical').length}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search assigned grievances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none bg-white font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
            {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#102A43] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Queue */}
        <div className="space-y-5">
          {filtered.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-md p-10 rounded-3xl border border-slate-200 text-center text-slate-500 shadow-sm">
              <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold">No assigned complaints matching the selected filter.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-md space-y-4 hover:border-slate-300 transition-all">
                
                {/* Complaint Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#006B3C] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        {item.id}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border shadow-2xs ${
                        item.priority === 'Critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Priority: {item.priority}
                      </span>
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700">
                        {item.department}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Lodged: {item.created_at}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#102A43] mt-2">{item.title}</h3>
                    
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>👤 Citizen: <strong>{item.citizen_name}</strong></span>
                      {item.citizen_phone && <span>📞 Phone: <strong>+91 {item.citizen_phone}</strong></span>}
                      <span>📍 Location: <strong>{item.location_address}</strong></span>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full self-start md:self-center border shadow-2xs ${
                    item.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : item.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : item.status === 'REJECTED'
                      ? 'bg-red-100 text-red-900 border-red-200'
                      : 'bg-blue-100 text-blue-900 border-blue-200'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Complaint Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Standardized English Summary */}
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold uppercase text-[#006B3C] tracking-wider">
                        Standardized Official Grievance (English)
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                        Primary Inspection Text
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      {item.standardized_english_text || item.formal_description}
                    </p>
                  </div>

                  {/* Citizen Original Submission */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        Original Citizen Input (Verbatim)
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-slate-700 border border-slate-200 shadow-2xs">
                        Language: {item.detected_language || 'Regional'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm italic text-slate-800 font-medium leading-relaxed">
                      "{item.original_complaint_text || item.raw_input}"
                    </p>
                  </div>
                </div>

                {/* Evidence Attachment (if present) */}
                {item.evidence_url && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-3">
                    <img
                      src={item.evidence_url}
                      alt="Complaint evidence"
                      className="h-16 w-24 rounded-xl object-cover border border-slate-300 shadow-2xs"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Citizen Photographic Evidence</span>
                      <a
                        href={item.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#006B3C] hover:underline font-semibold"
                      >
                        View Full Image in New Tab ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* Officer Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Enter inspection remark, team dispatch note, or resolution justification..."
                    value={remarkInputs[item.id] || ''}
                    onChange={(e) => setRemarkInputs({ ...remarkInputs, [item.id]: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#006B3C]"
                  />

                  <div className="grid grid-cols-3 sm:flex gap-2">
                    <button
                      onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                      className="px-3 sm:px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer text-center"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'RESOLVED')}
                      className="px-3 sm:px-4 py-2.5 bg-[#138808] hover:bg-[#006B3C] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer text-center"
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'REJECTED')}
                      className="px-2.5 sm:px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
