const API_BASE_URL = typeof window !== 'undefined'
  ? (import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : '')
  : (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL ? process.env.VITE_API_BASE_URL : '');

/**
 * Intelligently extracts human-readable error messages from HTTP error responses
 * Handles FastAPI string details, Pydantic validation error lists, proxy errors, and HTTP status codes
 */
async function parseErrorResponse(res, fallbackMessage) {
  try {
    const contentType = res.headers ? res.headers.get('content-type') : '';
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (data) {
        if (typeof data.detail === 'string' && data.detail.trim()) {
          return data.detail;
        }
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          const first = data.detail[0];
          const field = Array.isArray(first.loc) && first.loc.length > 1 ? first.loc[first.loc.length - 1] : '';
          const cleanField = field ? field.charAt(0).toUpperCase() + field.slice(1) + ': ' : '';
          return `${cleanField}${first.msg || 'Invalid input provided.'}`;
        }
        if (typeof data.message === 'string' && data.message.trim()) {
          return data.message;
        }
        if (typeof data.error === 'string' && data.error.trim()) {
          return data.error;
        }
      }
    } else {
      const text = await res.text();
      if (text && (text.includes('ECONNREFUSED') || text.includes('connect ECONNREFUSED'))) {
        return 'Cannot connect to the JanSamadhan server. Please check your network connection and try again.';
      }
    }
  } catch (_) {}

  if (res.status === 409) return 'An account with these details is already registered. Please log in.';
  if (res.status === 401) return 'Authentication failed. Please check your credentials.';
  if (res.status === 403) return 'Access restricted. You do not have permission to perform this action.';
  if (res.status === 400) return 'Invalid details submitted. Please verify the entered information.';
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return 'JanSamadhan backend service is temporarily unreachable. Please try again in a few moments.';
  }
  if (res.status >= 500) {
    return 'A server error occurred while processing your request. Please try again.';
  }

  return fallbackMessage || 'An unexpected error occurred. Please try again.';
}

/**
 * Retrieve current JWT access token from localStorage
 */
export function getAuthToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('js_token') : null;
}

/**
 * Returns JSON headers with JWT Bearer Authorization attached
 */
export function getAuthHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Helper to check if backend server is responsive
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' }).catch(() => null);
    if (!res || !res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy' || data.database_connected === true || data.status === 'online';
  } catch (err) {
    console.warn("Backend not reachable at", API_BASE_URL, err.message);
    return false;
  }
}

/**
 * Validates JWT token against backend /api/auth/me and returns authenticated user profile
 */
export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      logoutUser();
      return null;
    }
    const user = await res.json();
    localStorage.setItem('js_user', JSON.stringify(user));
    return user;
  } catch (err) {
    console.warn("Failed to validate JWT token:", err.message);
    return null;
  }
}

/**
 * Clears JWT session
 */
export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('js_token');
    localStorage.removeItem('js_user');
  }
}

/**
 * Register with Phone Number & Password (Bcrypt hashed)
 */
export async function registerWithPhone({ name, phone, password, confirmPassword, confirm_password, email, role = 'CITIZEN', department }) {
  try {
    const resolvedConfirm = confirmPassword || confirm_password || password;
    const res = await fetch(`${API_BASE_URL}/api/auth/register-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        email: email || undefined,
        password,
        confirm_password: resolvedConfirm,
        role,
        department
      })
    });

    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res, "Registration failed. Please check your details.");
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('js_token', data.access_token);
      localStorage.setItem('js_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message && err.message.toLowerCase().includes('fetch')) {
      throw new Error("Cannot connect to JanSamadhan server. Please check your internet connection or try again shortly.");
    }
    throw err;
  }
}

/**
 * Login with Phone Number & Password
 */
export async function loginWithPhone({ phone, password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });

    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res, "Login failed. Incorrect mobile number or password.");
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('js_token', data.access_token);
      localStorage.setItem('js_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message && err.message.toLowerCase().includes('fetch')) {
      throw new Error("Cannot connect to JanSamadhan server. Please check your internet connection or try again shortly.");
    }
    throw err;
  }
}

/**
 * Check if the Administrator account has been provisioned
 */
export async function getAdminSetupStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/setup-status`);
    if (!res.ok) {
      return { is_configured: true, admin_count: 1 };
    }
    return await res.json();
  } catch (err) {
    return { is_configured: true, admin_count: 1 };
  }
}

/**
 * Perform First-Time Admin Account Setup
 */
export async function firstTimeAdminSetup({ name, loginId, password, confirmPassword }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/first-time-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || 'Central Administrator',
        login_id: loginId || 'admin@jansamadhanadmin',
        password,
        confirm_password: confirmPassword
      })
    });

    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res, "Admin account setup failed.");
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('js_token', data.access_token);
      localStorage.setItem('js_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message && err.message.toLowerCase().includes('fetch')) {
      throw new Error("Cannot connect to JanSamadhan server. Please check your internet connection or try again shortly.");
    }
    throw err;
  }
}

/**
 * Dedicated Admin Login for Central Administrators
 * Route: /admin/login
 * Target Login ID: admin@jansamadhanadmin
 */
export async function loginAdmin({ loginId, password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: loginId, password })
    });

    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res, "Admin authentication failed. Please verify your Login ID and password.");
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.user.role !== 'ADMIN') {
      logoutUser();
      throw new Error("Access restricted. This portal is exclusively for Central Administrators.");
    }

    if (data.access_token) {
      localStorage.setItem('js_token', data.access_token);
      localStorage.setItem('js_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message && err.message.toLowerCase().includes('fetch')) {
      throw new Error("Cannot connect to JanSamadhan server. Please check your internet connection or try again shortly.");
    }
    throw err;
  }
}

/**
 * Dedicated Officer Login for Department Nodal Officers
 * Login ID format: username@officerdepartmentcode (e.g. rahul@officerelectricity)
 */
export async function loginOfficer({ loginId, password, department, departmentId }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/official-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login_id: loginId,
        password,
        department: department || undefined,
        department_id: departmentId ? Number(departmentId) : undefined
      })
    });

    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res, "Officer authentication failed. Please check your credentials.");
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.user.role !== 'OFFICER' && data.user.role !== 'ADMIN') {
      logoutUser();
      throw new Error("Access restricted. This login interface is for Department Nodal Officers.");
    }

    if (data.access_token) {
      localStorage.setItem('js_token', data.access_token);
      localStorage.setItem('js_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message && err.message.toLowerCase().includes('fetch')) {
      throw new Error("Cannot connect to JanSamadhan server. Please check your internet connection or try again shortly.");
    }
    throw err;
  }
}

/**
 * Official Login for Admin and Officers
 * - Admin Login ID: admin@jansamadhanadmin
 * - Officer Login ID: username@officerdepartmentcode (e.g. rahul@officerelectricity)
 */
export async function loginOfficial({ loginId, password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/official-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: loginId, password })
    });

    if (!res.ok) {
      const errorMsg = await parseErrorResponse(res, "Official authentication failed. Please verify your Login ID and password.");
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('js_token', data.access_token);
      localStorage.setItem('js_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message && err.message.toLowerCase().includes('fetch')) {
      throw new Error("Cannot connect to JanSamadhan server. Please check your internet connection or try again shortly.");
    }
    throw err;
  }
}

/**
 * Fetch all departments from backend
 */
export async function fetchDepartments() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/departments`, {
      headers: getAuthHeaders()
    }).catch(() => null);

    if (!res || !res.ok) throw new Error((res && `HTTP error ${res.status}`) || "Unable to connect to backend server");
    const data = await res.json();
    if (Array.isArray(data)) {
      if (data.length > 0) {
        try {
          localStorage.setItem('js_departments_cache', JSON.stringify(data));
        } catch (_) {}
      }
      return data;
    }
    return [];
  } catch (err) {
    console.warn("fetchDepartments error:", err.message);
    try {
      const cached = localStorage.getItem('js_departments_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    throw err;
  }
}

/**
 * Admin: Add new department
 */
export async function addDepartment({ name, code, description }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, code, description })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create department.");
  }
  return await res.json();
}

/**
 * Admin: Delete department
 */
export async function deleteDepartment(deptId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/departments/${deptId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete department.");
  }
  return await res.json();
}

/**
 * Admin: Fetch all officers
 */
export async function fetchAdminOfficers() {
  const res = await fetch(`${API_BASE_URL}/api/admin/officers`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch officers.");
  }
  return await res.json();
}

/**
 * Admin: Create a new officer account
 */
export async function createOfficer({ name, username, department, password, recoveryEmail }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/officers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name,
      username,
      department,
      password,
      recovery_email: recoveryEmail || undefined
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create officer account.");
  }
  return await res.json();
}

/**
 * Admin: Toggle officer active/inactive status
 */
export async function toggleOfficerStatus(officerId, isActive) {
  const res = await fetch(`${API_BASE_URL}/api/admin/officers/${officerId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update officer status.");
  }
  return await res.json();
}

/**
 * Admin: Reset officer password
 */
export async function resetOfficerPassword(officerId, newPassword) {
  const res = await fetch(`${API_BASE_URL}/api/admin/officers/${officerId}/reset-password`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ new_password: newPassword })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reset officer password.");
  }
  return await res.json();
}

/**
 * Real Google OAuth 2.0 Identity Token Verification
 */
export async function loginWithGoogle({ credential, role = 'CITIZEN', department }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, role, department })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Google authentication failed. Please try again.");
  }

  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('js_token', data.access_token);
    localStorage.setItem('js_user', JSON.stringify(data.user));
  }
  return data;
}

/**
 * Reset Password
 */
export async function resetPassword({ phone, newPassword }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, new_password: newPassword })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reset password.");
  }
  return await res.json();
}

/**
 * 1-Click Demo Login is permanently disabled.
 */
export async function mobileLogin() {
  throw new Error("Demo login is permanently disabled. Please use official registration or login.");
}

/**
 * Fetch all complaints from FastAPI backend (JWT authorized)
 */
export async function fetchComplaints() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/complaints`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Could not fetch complaints:", err.message);
    return [];
  }
}

/**
 * AI Multilingual Grievance Classification
 */
export async function classifyComplaint(raw_input, selected_language = null) {
  const res = await fetch(`${API_BASE_URL}/api/ai/classify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ raw_input, selected_language })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "AI Classification request failed. Please check backend connection.");
  }
  return await res.json();
}

/**
 * Transcribes recorded speech audio through FastAPI /api/complaints/transcribe
 * Accepts WAV/WebM blob and language hint; returns transcribed text and detected language
 */
export async function transcribeComplaintAudio(audioBlob, language = 'auto') {
  const formData = new FormData();
  const filename = audioBlob.type && audioBlob.type.includes('wav') ? 'grievance.wav' : 'grievance.webm';
  formData.append('file', audioBlob, filename);
  if (language) {
    formData.append('language', language);
  }

  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/complaints/transcribe`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Audio transcription failed. Please speak clearly into the microphone.");
  }

  return await res.json();
}

/**
 * Submit a new grievance complaint with Multilingual NLP preservation
 */
export async function submitComplaint(payload) {
  const res = await fetch(`${API_BASE_URL}/api/complaints`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errMsg = await parseErrorResponse(res, "Failed to register complaint.");
    throw new Error(errMsg);
  }
  return await res.json();
}

/**
 * Update complaint status (Officers / Admins)
 */
export async function updateComplaintStatus(complaintId, status, remark) {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, remark })
  });
  if (!res.ok) {
    const errMsg = await parseErrorResponse(res, "Status update failed.");
    throw new Error(errMsg);
  }
  return await res.json();
}

/**
 * Upload image / evidence file
 */
export async function uploadEvidenceFile(file) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) throw new Error("Upload failed. Ensure backend server is running.");
  const data = await res.json();
  return `${API_BASE_URL}${data.url}`;
}

// Named Aliases
export const submitComplaintToBackend = submitComplaint;
export const fetchAllComplaints = fetchComplaints;
