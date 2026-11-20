import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict

# ==========================================
# Pydantic Schemas (Request / Response)
# MongoDB-backed JanSamadhan Architecture
# ==========================================

class PhoneRegisterRequest(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    confirm_password: Optional[str] = None
    confirmPassword: Optional[str] = None
    role: Optional[str] = "CITIZEN"
    department: Optional[str] = None


class PhoneLoginRequest(BaseModel):
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    password: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token / GIS credential
    role: Optional[str] = "CITIZEN"
    department: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    new_password: str


class MobileAuthRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = "Citizen"
    role: Optional[str] = "CITIZEN"
    department: Optional[str] = None


class UserRegisterRequest(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "CITIZEN"
    department: Optional[str] = None


class OfficialLoginRequest(BaseModel):
    login_id: str
    password: str
    department: Optional[str] = None
    department_id: Optional[int] = None


class AdminSetupRequest(BaseModel):
    name: Optional[str] = "Central Administrator"
    login_id: Optional[str] = "admin@jansamadhanadmin"
    password: str
    confirm_password: Optional[str] = None


class AdminSetupStatusResponse(BaseModel):
    is_configured: bool
    admin_count: int


class OfficerCreateRequest(BaseModel):
    name: str
    username: str
    department: str
    password: str
    recovery_email: Optional[str] = None


class OfficerStatusUpdateRequest(BaseModel):
    is_active: bool


class OfficerPasswordResetRequest(BaseModel):
    new_password: str


class DepartmentCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: Optional[str] = None
    login_code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = True
    officer_count: Optional[int] = 0
    complaint_count: Optional[int] = 0


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    full_name: Optional[str] = None
    username: Optional[str] = None
    login_id: Optional[str] = None
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    recovery_email: Optional[str] = None
    auth_provider: Optional[str] = "phone"
    google_id: Optional[str] = None
    role: str
    department: Optional[str] = None
    department_id: Optional[int] = None
    must_change_password: Optional[bool] = False
    is_active: Optional[bool] = True
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AIClassificationRequest(BaseModel):
    raw_input: str
    selected_language: Optional[str] = None


class AIClassificationResponse(BaseModel):
    original_text: str
    detected_language: str
    standardized_english: str
    category: str
    sub_category: str
    priority: str
    predicted_priority: Optional[str] = None
    department: str
    assigned_department: Optional[str] = None
    formal_description: str
    confidence: float


class HistoryItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: str
    time: str
    remark: Optional[str] = None


class ComplaintCreateRequest(BaseModel):
    raw_input: str
    original_complaint_text: Optional[str] = None
    standardized_english_text: Optional[str] = None
    detected_language: Optional[str] = None
    location_address: Optional[str] = "Ward 12, Sector 4 Main Road"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    citizen_name: Optional[str] = "Citizen"
    citizen_phone: Optional[str] = None
    citizen_email: Optional[str] = None
    user_phone: Optional[str] = None
    evidence_url: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = None
    department: Optional[str] = None


class ComplaintStatusUpdateRequest(BaseModel):
    status: str
    remark: Optional[str] = "Status updated by authority."


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    raw_input: str
    original_complaint_text: Optional[str] = None
    standardized_english_text: Optional[str] = None
    detected_language: Optional[str] = "Hindi/Hinglish"
    formal_description: str
    category: str
    sub_category: str
    priority: str
    predicted_priority: Optional[str] = None
    department: str
    assigned_department: Optional[str] = None
    status: str
    location_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    citizen_name: str
    citizen_phone: Optional[str] = None
    citizen_email: Optional[str] = None
    evidence_url: Optional[str] = None
    processing_timestamp: Optional[str] = None
    created_at: str
    history: List[HistoryItemSchema] = []
