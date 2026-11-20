import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Search,
  ArrowLeft,
  UserPlus,
  Building2,
  ShieldCheck,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Users,
  Trash2,
  Check,
  X
} from 'lucide-react';
import JanSamadhanLogo from '../components/JanSamadhanLogo';
import adminDashboardBg from '../assets/admin_dashboard_bg.jpg';
import {
  fetchDepartments,
  addDepartment,
  deleteDepartment,
  fetchAdminOfficers,
  createOfficer,
  toggleOfficerStatus,
  resetOfficerPassword
} from '../services/api';

export default function AdminDashboard({ user, complaints, onLogout, onNavigateHome }) {
  // Navigation tabs: 'overview' | 'officers' | 'departments'
  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filter for Complaints
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Dynamic Departments
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  // Dynamic Officers
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Small Modern Toast Notification State (Auto-dismisses in 2.5s with smooth transition)
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const toastFadeTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);

    setToast({ message, type });
    requestAnimationFrame(() => {
      setIsToastVisible(true);
    });

    // Auto-dismiss after 2.5 seconds (within 2-3s requirement)
    toastTimerRef.current = setTimeout(() => {
      setIsToastVisible(false);
      toastFadeTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 300);
    }, 2500);
  };

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    setIsToastVisible(false);
    toastFadeTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    };
  }, []);

  // Officer Creation Form State
  const [officerName, setOfficerName] = useState('');
  const [officerUsername, setOfficerUsername] = useState('');
  const [officerDept, setOfficerDept] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerRecoveryEmail, setOfficerRecoveryEmail] = useState('');
  const [showOfficerPw, setShowOfficerPw] = useState(false);
  const [creatingOfficer, setCreatingOfficer] = useState(false);
  const [createdOfficerNotice, setCreatedOfficerNotice] = useState(null);

  // Department Creation Form State
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  // Officer Password Reset Modal State
  const [resetTargetOfficer, setResetTargetOfficer] = useState(null);
  const [newOfficerResetPw, setNewOfficerResetPw] = useState('');
  const [resettingPw, setResettingPw] = useState(false);

  // Load Departments and Officers from database on mount
  const loadData = async () => {
    setLoadingDepts(true);
    setLoadingOfficers(true);
    try {
      const depts = await fetchDepartments();
      if (Array.isArray(depts)) {
        setDepartments(depts);
        if (depts.length > 0 && !officerDept) {
          setOfficerDept(depts[0].name);
        }
      }
    } catch (err) {
      console.warn('Failed to load departments:', err);
    } finally {
      setLoadingDepts(false);
    }

    try {
      const offList = await fetchAdminOfficers();
      if (Array.isArray(offList)) {
        setOfficers(offList);
      }
    } catch (err) {
      console.warn('Failed to load officers:', err);
    } finally {
      setLoadingOfficers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute selected department's login code slug
  const selectedDeptObj = departments.find((d) => d.name === officerDept) || departments[0];
  const selectedDeptLoginCode = selectedDeptObj ? selectedDeptObj.login_code : 'officerelectricity';

  // Computed Dynamic Officer Login ID preview: username@officerdepartmentcode
  const sanitizedUsernamePreview = officerUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const dynamicLoginIdPreview = `${sanitizedUsernamePreview || 'username'}@${selectedDeptLoginCode}`;

  // Helper: Secure password generator
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOfficerPassword(res);
  };

  // Auto-suggest department code when entering department name
  const handleDeptNameChange = (name) => {
    setNewDeptName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter((w) => !['department', 'corporation', 'board', 'cell', 'and', 'of'].includes(w))
      .join('')
      .slice(0, 15);
    setNewDeptCode(slug);
  };

  // Handler: Create Officer Account
  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setCreatedOfficerNotice(null);

    const cleanUsername = officerUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!officerName.trim()) {
      showToast('Please enter the officer full name.', 'error');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      showToast('Officer username must be at least 3 alphanumeric characters.', 'error');
      return;
    }
    if (!officerDept) {
      showToast('Please select a valid department.', 'error');
      return;
    }
    if (!officerPassword || officerPassword.length < 6) {
      showToast('Password must be at least 6 characters in length.', 'error');
      return;
    }

    setCreatingOfficer(true);
    try {
      const created = await createOfficer({
        name: officerName.trim(),
        username: cleanUsername,
        department: officerDept,
        password: officerPassword,
        recoveryEmail: officerRecoveryEmail.trim() || undefined
      });

      setCreatedOfficerNotice({
        name: created.name,
        login_id: created.login_id,
        department: created.department,
        password: officerPassword,
        recovery_email: created.recovery_email || 'Not configured'
      });

      showToast(`${created.name} created successfully!`, 'success');
      // Reset form
      setOfficerName('');
      setOfficerUsername('');
      setOfficerPassword('');
      setOfficerRecoveryEmail('');
      // Reload officers & departments
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create officer account.', 'error');
    } finally {
      setCreatingOfficer(false);
    }
  };

  // Handler: Toggle Officer Active/Inactive
  const handleToggleOfficerStatus = async (officer) => {
    try {
      const targetState = !officer.is_active;
      await toggleOfficerStatus(officer.id, targetState);
      showToast(`${officer.name} ${targetState ? 'activated' : 'deactivated'} successfully!`, 'success');
      setOfficers((prev) =>
        prev.map((o) => (o.id === officer.id ? { ...o, is_active: targetState } : o))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update officer status.', 'error');
    }
  };

  // Handler: Reset Officer Password
  const handleResetOfficerPassword = async (e) => {
    e.preventDefault();
    if (!resetTargetOfficer || newOfficerResetPw.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setResettingPw(true);
    try {
      await resetOfficerPassword(resetTargetOfficer.id, newOfficerResetPw);
      showToast(`Password for ${resetTargetOfficer.name} updated successfully!`, 'success');
      setResetTargetOfficer(null);
      setNewOfficerResetPw('');
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setResettingPw(false);
    }
  };

  // Handler: Add New Department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      showToast('Please enter department name.', 'error');
      return;
    }
    setCreatingDept(true);
    try {
      const created = await addDepartment({
        name: newDeptName.trim(),
        code: newDeptCode.trim() || undefined,
        description: newDeptDesc.trim() || undefined
      });
      showToast(`${created.name} created successfully!`, 'success');
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptDesc('');
      setShowAddDeptModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add department.', 'error');
    } finally {
      setCreatingDept(false);
    }
  };

  // Handler: Delete Department
  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete the department '${dept.name}'?`)) {
      return;
    }
    try {
      await deleteDepartment(dept.id);
      showToast(`${dept.name} deleted successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete department.', 'error');
    }
  };

  // KPI Computations
  const totalComplaints = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const criticalCount = complaints.filter((c) => c.priority === 'Critical' || c.priority === 'High').length;

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesDept = deptFilter === 'ALL' || c.department === deptFilter;
    const matchesSearch =
      (c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.citizen_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.raw_input || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.standardized_english_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div
      className="min-h-screen bg-[#102A43] flex flex-col font-sans selection:bg-[#138808]/20 selection:text-[#006B3C] bg-cover bg-fixed bg-center relative"
      style={{ backgroundImage: `url(${adminDashboardBg})` }}
    >
      {/* Background Readability Mask: Deep navy executive digital command center feel with subtle Ashoka Chakra & circuit motifs */}
      <div className="fixed inset-0 bg-[#0c1f33]/92 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Toast Notification: Small, modern popup with green indicator and smooth fade */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-5 right-5 sm:top-6 sm:right-6 z-[100] max-w-sm sm:max-w-md transform transition-all duration-300 ease-out flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border ${
            isToastVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
          } ${
            toast.type === 'error'
              ? 'bg-white border-red-200 text-slate-800 shadow-red-500/10'
              : 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10'
          }`}
        >
          {toast.type === 'error' ? (
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center flex-shrink-0 relative">
              <Check className="w-4 h-4 text-[#138808] stroke-[2.5]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          )}
          <div className="flex-1 text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
            {toast.message}
          </div>
          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Official Government Header */}
      <header className="sticky top-0 z-50 bg-[#102A43] text-white shadow-md border-b-2 border-[#138808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <JanSamadhanLogo size="sm" variant="dark" onClick={onNavigateHome} />
            <div className="hidden sm:block border-l border-slate-700 pl-3">
              <h1 className="font-bold text-sm leading-none text-white">Central Admin Command Center</h1>
              <span className="text-[11px] text-[#FF9933] font-medium">
                National Grievance Oversight &amp; Audit
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-300 hover:text-white font-medium hidden md:inline-flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Home
            </button>

            <span className="text-xs bg-slate-800/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 font-mono hidden xs:inline-flex items-center space-x-1">
              <span>🛡️</span>
              <span className="font-bold text-white truncate max-w-[90px] sm:max-w-none">{user.name}</span>
              <span className="hidden md:inline text-slate-400">({user.login_id || 'admin@jansamadhanadmin'})</span>
            </span>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'bg-[#102A43] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Master Grievance Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('officers')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'officers'
                ? 'bg-[#102A43] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>Officer Account Management</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
              {officers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'departments'
                ? 'bg-[#102A43] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#138808]" />
            <span>Department Management</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
              {departments.length}
            </span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: SYSTEM OVERVIEW & MASTER COMPLAINTS AUDIT
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#102A43]">
                <span className="text-xs font-bold text-slate-500 uppercase block">Total Complaints</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#102A43] mt-1">{totalComplaints}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#138808]">
                <span className="text-xs font-bold text-slate-500 uppercase block">Resolved</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#006B3C] mt-1">{resolvedCount}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-[#FF9933]">
                <span className="text-xs font-bold text-slate-500 uppercase block">In Triage &amp; Progress</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{inProgressCount}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm border-t-4 border-t-red-500">
                <span className="text-xs font-bold text-slate-500 uppercase block">Critical Priority</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1">{criticalCount}</p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search grievances by ID, citizen, text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-bold">Filter Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                >
                  <option value="ALL">All Departments ({departments.length})</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Master Grievance Audit Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Master Grievance Audit Log (Real-Time Database Records)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Displays standardized English grievances alongside verified native language source.
                  </p>
                </div>
                <span className="text-xs bg-[#102A43] text-white px-3 py-1 rounded-full font-bold">
                  {filteredComplaints.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Citizen</th>
                      <th className="p-3.5">Language</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Assigned Department</th>
                      <th className="p-3.5">Priority</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#006B3C]">{c.id}</td>
                        <td className="p-3.5 font-semibold text-slate-900">
                          {c.citizen_name || "Citizen"}
                          {c.citizen_phone && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              +91 {c.citizen_phone}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {c.detected_language || 'Hindi/Hinglish'}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{c.category}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{c.department}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="px-3 py-1 bg-slate-100 hover:bg-[#102A43] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspect Modal */}
            {selectedComplaint && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#006B3C] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {selectedComplaint.id}
                      </span>
                      <h3 className="text-lg font-black text-[#102A43] mt-2">
                        {selectedComplaint.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-800 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-slate-50 rounded-2xl">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[10px]">Citizen</span>
                      <strong>{selectedComplaint.citizen_name} (+91 {selectedComplaint.citizen_phone || 'N/A'})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[10px]">Location</span>
                      <span>{selectedComplaint.location_address}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[10px]">Department</span>
                      <strong className="text-[#006B3C]">{selectedComplaint.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[10px]">Priority</span>
                      <strong className="text-amber-700">{selectedComplaint.priority} Priority</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-[#006B3C] uppercase tracking-wider block">
                      Standardized English Complaint (AI Generated)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      {selectedComplaint.standardized_english_text || selectedComplaint.formal_description}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Original Citizen Text (Verbatim Source)
                      </span>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        Language: {selectedComplaint.detected_language || 'Hindi/Hinglish'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm italic text-slate-800 font-medium">
                      "{selectedComplaint.original_complaint_text || selectedComplaint.raw_input}"
                    </p>
                  </div>

                  {selectedComplaint.evidence_url && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Photo Evidence Attached</span>
                      <img src={selectedComplaint.evidence_url} alt="Evidence" className="h-36 rounded-xl object-cover" />
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="px-5 py-2.5 bg-[#102A43] text-white text-xs font-bold rounded-xl"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: OFFICER ACCOUNT MANAGEMENT (Requirement 2 & 4)
            ======================================================== */}
        {activeTab === 'officers' && (
          <div className="space-y-8">
            {/* Newly Created Officer Banner */}
            {createdOfficerNotice && (
              <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-3xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#006B3C] font-extrabold text-sm sm:text-base">
                    <CheckCircle2 className="w-5 h-5 text-[#138808]" />
                    <span>Officer Account Credentials</span>
                  </div>
                  <button
                    onClick={() => setCreatedOfficerNotice(null)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-emerald-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block font-sans text-[11px] font-bold">Officer Name</span>
                    <strong className="text-slate-900">{createdOfficerNotice.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[11px] font-bold">Official Login ID</span>
                    <strong className="text-[#006B3C]">{createdOfficerNotice.login_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[11px] font-bold">Assigned Department</span>
                    <strong className="text-slate-900">{createdOfficerNotice.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[11px] font-bold">Configured Password</span>
                    <strong className="text-amber-800">{createdOfficerNotice.password}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Please securely communicate the <strong>Login ID</strong> and <strong>Password</strong> to the officer. They can now authenticate via the Official Login Portal.
                </p>
              </div>
            )}

            {/* Officer Creation Form Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-2xl bg-[#102A43] text-white flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-[#FF9933]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#102A43]">
                    Create New Department Nodal Officer Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    All officer credentials must be configured manually by the Central Administrator.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateOfficer} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Officer Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Officer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* Username (Entered manually by Admin) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Username (Entered Manually) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul"
                      value={officerUsername}
                      onChange={(e) => setOfficerUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none bg-white font-medium"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Lowercase alphanumeric, no spaces. Minimum 3 characters.
                    </span>
                  </div>

                  {/* Department (Selected manually by Admin) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Assigned Department (From Database) *
                    </label>
                    <select
                      value={officerDept}
                      onChange={(e) => setOfficerDept(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none bg-white font-bold"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.login_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recovery Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Recovery Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul.officer@domain.gov.in"
                      value={officerRecoveryEmail}
                      onChange={(e) => setOfficerRecoveryEmail(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* Password (Entered or securely generated by Admin) */}
                  <div className="sm:col-span-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Account Password (Entered or Generated) *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-xs font-extrabold text-[#006B3C] hover:underline flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Generate Secure Password</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showOfficerPw ? 'text' : 'password'}
                        required
                        placeholder="Choose or generate a strong password"
                        value={officerPassword}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOfficerPw(!showOfficerPw)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showOfficerPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC OFFICER LOGIN ID PREVIEW (Requirement 2) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Generated Dynamic Login ID (Formula: username@officerdepartmentcode)
                    </span>
                    <span className="text-base font-black font-mono text-[#006B3C]">
                      {dynamicLoginIdPreview}
                    </span>
                  </div>
                  <span className="text-[11px] px-3 py-1 bg-white border border-slate-300 rounded-xl font-mono text-slate-700">
                    Secure Password Hash Stored
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingOfficer}
                    className="px-6 py-3 bg-[#138808] hover:bg-[#006B3C] disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md transition-all text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{creatingOfficer ? 'Saving to Database...' : 'Create Officer Account'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Officers Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Registered Department Nodal Officers
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    All officer accounts have been created manually by Central Administration.
                  </p>
                </div>
                <span className="text-xs bg-[#102A43] text-white px-3 py-1 rounded-full font-bold">
                  {officers.length} Officers
                </span>
              </div>

              {loadingOfficers ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading officer records...</div>
              ) : officers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No officer accounts created yet. Use the form above to manually create the first officer account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                      <tr>
                        <th className="p-3.5">Officer Name</th>
                        <th className="p-3.5">Username</th>
                        <th className="p-3.5">Generated Login ID</th>
                        <th className="p-3.5">Assigned Department</th>
                        <th className="p-3.5">Recovery Email</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {officers.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{o.name}</td>
                          <td className="p-3.5 font-mono text-slate-600">{o.username || o.name.toLowerCase().split(' ')[0]}</td>
                          <td className="p-3.5 font-mono font-bold text-[#006B3C]">{o.login_id || `${o.username || 'officer'}@officer`}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{o.department || 'Not Assigned'}</td>
                          <td className="p-3.5 text-slate-500">{o.recovery_email || o.email || '—'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              o.is_active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {o.is_active ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setResetTargetOfficer(o);
                                setNewOfficerResetPw('');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                              title="Reset Password"
                            >
                              <Key className="w-3 h-3" />
                              <span>Reset PW</span>
                            </button>
                            <button
                              onClick={() => handleToggleOfficerStatus(o)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1 ${
                                o.is_active
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {o.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              <span>{o.is_active ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Officer Password Reset Modal */}
            {resetTargetOfficer && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h3 className="font-extrabold text-sm text-[#102A43]">
                      Reset Password for {resetTargetOfficer.name}
                    </h3>
                    <button
                      onClick={() => setResetTargetOfficer(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Login ID: <strong className="font-mono text-[#006B3C]">{resetTargetOfficer.login_id}</strong>
                  </p>
                  <form onSubmit={handleResetOfficerPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        New Password (Minimum 6 characters) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newOfficerResetPw}
                        onChange={(e) => setNewOfficerResetPw(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setResetTargetOfficer(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resettingPw}
                        className="px-5 py-2 bg-[#102A43] hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                      >
                        {resettingPw ? 'Saving...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: DEPARTMENT MANAGEMENT (Requirement 3)
            ======================================================== */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-base text-[#102A43]">
                  Department Routing &amp; Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Loaded dynamically from the database. Admin can add departments with auto-generated login codes.
                </p>
              </div>

              <button
                onClick={() => setShowAddDeptModal(true)}
                className="px-4 py-2.5 bg-[#102A43] hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#FF9933]" />
                <span>Add Department</span>
              </button>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const assignedComplaints = complaints.filter(
                  (c) => c.department === dept.name || c.assigned_department === dept.name
                );
                const resolved = assignedComplaints.filter((c) => c.status === 'RESOLVED');
                const deptOfficers = officers.filter((o) => o.department === dept.name);

                return (
                  <div key={dept.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-[#102A43] text-sm leading-snug">
                          {dept.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-50 text-[#006B3C] rounded-full text-[10px] font-bold border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {dept.description || 'Public Grievance Redressal Cell'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">Dept Code:</span>
                        <strong className="text-slate-700">{dept.code}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">Officer Login Code:</span>
                        <strong className="text-[#006B3C] font-bold">{dept.login_code}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Officers</span>
                        <strong className="text-slate-900 text-sm">{deptOfficers.length}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Complaints Lodged</span>
                        <strong className="text-[#006B3C] text-sm">{assignedComplaints.length}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">Master Record</span>
                      {deptOfficers.length === 0 && assignedComplaints.length === 0 && (
                        <button
                          onClick={() => handleDeleteDepartment(dept)}
                          className="inline-flex items-center space-x-1 text-[11px] font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Department Modal */}
            {showAddDeptModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-[#006B3C]" />
                      <h3 className="font-extrabold text-base text-[#102A43]">
                        Add Department
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowAddDeptModal(false)}
                      className="text-slate-400 hover:text-slate-800 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddDepartment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Department Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Public Health & Hospitals"
                        value={newDeptName}
                        onChange={(e) => handleDeptNameChange(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Department Code (Auto-Generated / Editable) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. publichealth"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Officer login domain code: <code>officer{newDeptCode || 'code'}</code>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Department Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Description of jurisdiction and grievance types handled"
                        value={newDeptDesc}
                        onChange={(e) => setNewDeptDesc(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddDeptModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingDept}
                        className="px-5 py-2.5 bg-[#102A43] hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                      >
                        {creatingDept ? 'Saving to Database...' : 'Save Department'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
