import os
import shutil
import uuid
import datetime
import requests
import json
import re
import subprocess
import bcrypt
from pathlib import Path
from typing import List, Optional, Union

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError, DuplicateKeyError
from jose import jwt, JWTError

from .database import (
    get_db,
    check_mongo_connection,
    init_db_indexes,
    get_next_sequence_value,
    get_masked_mongo_url,
    DATABASE_NAME
)
from .models import (
    PhoneRegisterRequest,
    PhoneLoginRequest,
    GoogleAuthRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MobileAuthRequest,
    UserRegisterRequest,
    OfficialLoginRequest,
    AdminSetupRequest,
    AdminSetupStatusResponse,
    OfficerCreateRequest,
    OfficerStatusUpdateRequest,
    OfficerPasswordResetRequest,
    DepartmentCreateRequest,
    DepartmentResponse,
    TokenResponse,
    UserResponse,
    AIClassificationRequest,
    AIClassificationResponse,
    ComplaintCreateRequest,
    ComplaintStatusUpdateRequest,
    ComplaintResponse,
    HistoryItemSchema
)
from .ai_service import classify_complaint, analyze_complaint, transcribe_audio_bytes

# Secret key for JWT (Must be set in production via environment variable)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-in-production")
ALGORITHM = "HS256"

# Warn if using insecure default secret key in production
if os.getenv("ENVIRONMENT", "").lower() == "production" or os.getenv("RENDER"):
    if SECRET_KEY == "dev-insecure-secret-key-change-in-production":
        import warnings
        warnings.warn(
            "SECURITY WARNING: Using default development SECRET_KEY in production! "
            "Generate a strong random 256-bit key via 'openssl rand -hex 32' and set it in your environment variables."
        )

app = FastAPI(
    title="JanSamadhan Grievance Redressal API",
    description="FastAPI backend for citizen grievance registration, Google OAuth & Phone authentication, multilingual AI NLP processing, and MongoDB Atlas storage.",
    version="3.0.0"
)

# Dynamic Environment-based CORS Configuration
DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

env_allowed = os.getenv("ALLOWED_ORIGINS", "").strip()
allowed_origins = list(DEFAULT_CORS_ORIGINS)
if env_allowed:
    for origin in env_allowed.split(","):
        clean_origin = origin.strip()
        if clean_origin and clean_origin not in allowed_origins:
            allowed_origins.append(clean_origin)

origin_regex = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Global Exception Handlers for Database Errors
@app.exception_handler(ServerSelectionTimeoutError)
async def mongo_timeout_handler(request: Request, exc: ServerSelectionTimeoutError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "MongoDB Atlas connection timed out. Network access may be blocked. Please ensure your current IP address is added to MongoDB Atlas Network Access (IP Access List) at cloud.mongodb.com."
        }
    )

@app.exception_handler(PyMongoError)
async def pymongo_error_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": f"Database operation failed: {str(exc)}"
        }
    )

# Security Bearer
jwt_bearer = HTTPBearer(auto_error=False)

def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)
APPROVED_DEPARTMENTS = [
    {
        "id": 1,
        "name": "Electricity Department",
        "code": "electricity",
        "login_code": "electricity",
        "description": "Power outages, grid disruptions, transformer repairs, and street lighting.",
        "is_active": True
    },
    {
        "id": 2,
        "name": "Water Supply Department",
        "code": "watersupply",
        "login_code": "watersupply",
        "description": "Potable water distribution, pipeline leakages, low pressure, and water contamination.",
        "is_active": True
    },
    {
        "id": 3,
        "name": "Public Works Department (PWD)",
        "code": "pwd",
        "login_code": "pwd",
        "description": "Road maintenance, pothole repairs, bridges, flyovers, and public infrastructure.",
        "is_active": True
    },
    {
        "id": 4,
        "name": "Municipal Corporation",
        "code": "municipalcorporation",
        "login_code": "municipalcorporation",
        "description": "Urban municipal governance, building regulations, civic amenities, and licensing.",
        "is_active": True
    },
    {
        "id": 5,
        "name": "Municipal Drainage Department",
        "code": "municipaldrainage",
        "login_code": "municipaldrainage",
        "description": "Stormwater drains, sewage overflow, waterlogging, and flood control maintenance.",
        "is_active": True
    }
]


# ========================================================
# Helper Functions
# ========================================================

def sync_approved_departments(db: Database):
    """
    Initializes and synchronizes the 5 active departments in MongoDB.
    Safely deactivates or removes non-approved departments.
    """
    approved_names = [d["name"].lower() for d in APPROVED_DEPARTMENTS]
    dept_col = db["departments"]

    for d in APPROVED_DEPARTMENTS:
        dept_col.update_one(
            {"name": d["name"]},
            {"$set": {
                "id": d["id"],
                "name": d["name"],
                "code": d["code"],
                "login_code": d["login_code"],
                "description": d["description"],
                "is_active": True,
                "updated_at": get_utc_now()
            }},
            upsert=True
        )

    # Deactivate any other departments
    dept_col.update_many(
        {"name": {"$nin": [d["name"] for d in APPROVED_DEPARTMENTS]}},
        {"$set": {"is_active": False}}
    )


def generate_jwt_token(user: dict) -> str:
    now_utc = get_utc_now()
    token_data = {
        "sub": str(user.get("id")),
        "email": user.get("email"),
        "login_id": user.get("login_id"),
        "phone": user.get("phone"),
        "role": user.get("role", "CITIZEN"),
        "department": user.get("department"),
        "name": user.get("name"),
        "iat": now_utc,
        "exp": now_utc + datetime.timedelta(days=7)
    }
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)


def to_user_response(user: dict) -> UserResponse:
    if not user:
        return None
    raw_phone = user.get("phone")
    clean_phone = raw_phone if raw_phone and not str(raw_phone).startswith("google:") and not str(raw_phone).startswith("email:") else None
    derived_login_id = user.get("login_id")
    if not derived_login_id and user.get("role") == "ADMIN":
        derived_login_id = "admin@jansamadhanadmin"

    return UserResponse(
        id=int(user.get("id", 0)),
        name=user.get("name") or "",
        full_name=user.get("full_name") or user.get("name") or "",
        username=user.get("username"),
        login_id=derived_login_id,
        phone=clean_phone,
        mobile_number=clean_phone,
        email=user.get("email"),
        recovery_email=user.get("recovery_email") or (user.get("email") if user.get("email") and "@" in str(user.get("email")) and not str(user.get("email")).endswith("admin") else None),
        auth_provider=user.get("auth_provider", "phone"),
        google_id=user.get("google_id"),
        role=user.get("role", "CITIZEN"),
        department=user.get("department"),
        department_id=user.get("department_id"),
        must_change_password=bool(user.get("must_change_password", False)),
        is_active=bool(user.get("is_active", True)),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at")
    )


def format_complaint(c: dict) -> dict:
    created = c.get("created_at")
    if isinstance(created, datetime.datetime):
        created_str = created.strftime("%d %b %Y, %I:%M %p")
    else:
        created_str = str(created) if created else ""

    proc = c.get("processing_timestamp")
    if isinstance(proc, datetime.datetime):
        proc_str = proc.strftime("%d %b %Y, %I:%M %p")
    else:
        proc_str = str(proc) if proc else ""

    history_list = c.get("history") or []
    formatted_history = []
    for h in history_list:
        formatted_history.append({
            "status": h.get("status", ""),
            "time": h.get("time", ""),
            "remark": h.get("remark", "")
        })

    return {
        "id": c.get("id", ""),
        "title": c.get("title", ""),
        "raw_input": c.get("raw_input", ""),
        "original_complaint_text": c.get("original_complaint_text") or c.get("raw_input", ""),
        "standardized_english_text": c.get("standardized_english_text") or c.get("raw_input", ""),
        "detected_language": c.get("detected_language", "Hindi/Hinglish"),
        "formal_description": c.get("formal_description", ""),
        "category": c.get("category", ""),
        "sub_category": c.get("sub_category", ""),
        "priority": c.get("priority", "Medium"),
        "predicted_priority": c.get("predicted_priority") or c.get("priority", "Medium"),
        "department": c.get("department", ""),
        "assigned_department": c.get("assigned_department") or c.get("department", ""),
        "status": c.get("status", "ASSIGNED"),
        "location_address": c.get("location_address", "Ward 12, Sector 4 Main Road"),
        "latitude": c.get("latitude"),
        "longitude": c.get("longitude"),
        "citizen_name": c.get("citizen_name", "Citizen"),
        "citizen_phone": c.get("citizen_phone"),
        "citizen_email": c.get("citizen_email"),
        "evidence_url": c.get("evidence_url"),
        "processing_timestamp": proc_str,
        "created_at": created_str,
        "history": formatted_history
    }


def send_complaint_email_via_nodemailer(recipient: str, name: str, complaint_dict: dict) -> dict:
    mailer_script = Path(__file__).resolve().parent.parent / "mailer" / "send_mail.js"
    if not mailer_script.exists():
        return {"success": False, "error": "send_mail.js not found"}
    try:
        node_bin = shutil.which("node") or "node"
        payload_json = json.dumps({
            "to": recipient,
            "type": "complaint",
            "name": name,
            "complaint": complaint_dict
        })
        proc = subprocess.run(
            [node_bin, str(mailer_script), payload_json],
            capture_output=True,
            text=True,
            timeout=15
        )
        stdout = proc.stdout.strip()
        for line in stdout.splitlines():
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                return json.loads(line)
        return {"success": proc.returncode == 0, "output": stdout}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========================================================
# Application Lifecycle & Events
# ========================================================

@app.on_event("startup")
def on_startup():
    """
    Initializes MongoDB collections, indexes, and synchronizes the 5 active departments.
    """
    conn_info = check_mongo_connection()
    if conn_info["status"] == "connected":
        try:
            db = get_db()
            init_db_indexes(db)
            sync_approved_departments(db)
            print(f"[Startup] Successfully connected to MongoDB Atlas ({conn_info['database']}). Indexes and departments synced.")
        except Exception as e:
            print(f"[Startup Warning] Error during MongoDB initialization: {e}")
    else:
        print(f"[Startup Notice] MongoDB Atlas is currently offline or awaiting password: {conn_info.get('masked_url')}")


# ========================================================
# Root & Health Check
# ========================================================

@app.get("/")
def root():
    return {
        "app": "JanSamadhan Grievance Redressal API",
        "status": "online",
        "database": "MongoDB Atlas",
        "version": "3.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    conn = check_mongo_connection()
    is_connected = conn["status"] == "connected"
    return {
        "status": "healthy" if is_connected else "degraded",
        "database": "MongoDB Atlas",
        "database_connected": is_connected,
        "database_name": DATABASE_NAME,
        "connection_details": conn.get("masked_url"),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


# ========================================================
# Security & Current User Dependencies
# ========================================================

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(jwt_bearer),
    db: Database = Depends(get_db)
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required. Missing Bearer JWT token.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid JWT token payload.")
        
        user = db["users"].find_one({"id": int(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="User account has been deactivated.")
        return user
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired JWT token: {str(e)}")


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(jwt_bearer),
    db: Database = Depends(get_db)
) -> Optional[dict]:
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return db["users"].find_one({"id": int(user_id)})
    except Exception:
        pass
    return None


def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(jwt_bearer),
    db: Database = Depends(get_db)
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in as Central Administrator.")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid session token.")
        user = db["users"].find_one({"id": int(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Admin user account not found.")
        if user.get("role") != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden. Administrative privileges required.")
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Admin account is currently deactivated.")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")


# ========================================================
# Authentication Endpoints
# ========================================================

@app.post("/api/auth/register", response_model=TokenResponse)
@app.post("/api/auth/register-phone", response_model=TokenResponse)
def register_user(payload: PhoneRegisterRequest, db: Database = Depends(get_db)):
    """
    Citizen Phone Number & Account Registration with Bcrypt password hashing.
    Restricted strictly to Citizens. Official accounts must be created by Admin.
    """
    if payload.role and payload.role.upper() in ["OFFICER", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Public registration of Officer or Admin accounts is strictly prohibited. Official accounts must be created by Central Administration."
        )

    raw_name = (payload.name or payload.full_name or "").strip()
    raw_phone = (payload.phone or payload.mobile_number or "").strip()
    raw_password = (payload.password or "").strip()
    raw_email = (payload.email or "").strip().lower() or None
    raw_confirm = (payload.confirm_password or payload.confirmPassword or "").strip()

    if not raw_name or not raw_phone or not raw_password:
        raise HTTPException(
            status_code=400,
            detail="Please provide your full legal name, mobile number, and password."
        )

    digits = "".join([c for c in raw_phone if c.isdigit()])
    if len(digits) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit Indian mobile number.")
    phone = digits[-10:]

    if len(raw_name) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full legal name (minimum 2 characters).")

    if len(raw_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters in length.")

    if raw_confirm and raw_confirm != raw_password:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    # Check whether the mobile number already exists in MongoDB
    if db["users"].find_one({"phone": phone}):
        raise HTTPException(
            status_code=409,
            detail=f"An account with mobile number +91 {phone} already exists. Please login."
        )

    if raw_email:
        if "@" not in raw_email or "." not in raw_email:
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        if db["users"].find_one({"email": raw_email}):
            raise HTTPException(
                status_code=409,
                detail=f"An account with email '{raw_email}' already exists. Please login."
            )

    hashed_pw = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = get_next_sequence_value(db, "users")

    now = get_utc_now()
    user_doc = {
        "id": user_id,
        "name": raw_name,
        "full_name": raw_name,
        "phone": phone,
        "email": raw_email,
        "password_hash": hashed_pw,
        "auth_provider": "phone",
        "role": "CITIZEN",
        "department": None,
        "department_id": None,
        "must_change_password": False,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    # Filter out None values so sparse unique indexes in MongoDB (email_1, login_id_1) do not collide on null
    user_doc = {k: v for k, v in user_doc.items() if v is not None}

    try:
        db["users"].insert_one(user_doc)
    except DuplicateKeyError as e:
        raise HTTPException(
            status_code=409,
            detail="An account with this phone number or email is already registered. Please sign in."
        )

    token = generate_jwt_token(user_doc)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(user_doc)
    )


@app.post("/api/auth/login", response_model=TokenResponse)
@app.post("/api/auth/login-phone", response_model=TokenResponse)
def login_user(payload: PhoneLoginRequest, db: Database = Depends(get_db)):
    """
    Citizen Phone/Password Login verifying Bcrypt hash against MongoDB.
    """
    raw_phone = (payload.phone or payload.mobile_number or "").strip()
    raw_password = (payload.password or "").strip()

    if not raw_phone or not raw_password:
        raise HTTPException(status_code=400, detail="Please provide your mobile number and password.")

    digits = "".join([c for c in raw_phone if c.isdigit()])
    phone_clean = digits[-10:] if len(digits) >= 10 else raw_phone

    user = db["users"].find_one({
        "$or": [
            {"phone": phone_clean},
            {"email": raw_phone.lower()},
            {"login_id": raw_phone.lower()}
        ]
    })

    if not user:
        raise HTTPException(status_code=401, detail="Invalid mobile number or password.")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact support.")

    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Password is not configured for this account.")

    try:
        is_valid = bcrypt.checkpw(raw_password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    except Exception:
        is_valid = False

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid mobile number or password.")

    token = generate_jwt_token(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(user)
    )


@app.post("/api/auth/official-login", response_model=TokenResponse)
def official_login(payload: OfficialLoginRequest, db: Database = Depends(get_db)):
    """
    Officer and Admin Authentication with Department Verification.
    Verifies credentials strictly against MongoDB with Bcrypt.
    """
    raw_login = (payload.login_id or "").strip().lower()
    raw_password = (payload.password or "").strip()
    selected_dept = (payload.department or "").strip()
    selected_dept_id = payload.department_id

    if not raw_login or not raw_password:
        raise HTTPException(status_code=400, detail="Please enter your login ID and password.")

    dept_obj = None
    if selected_dept_id:
        dept_obj = db["departments"].find_one({"id": selected_dept_id})
        if dept_obj and not selected_dept:
            selected_dept = dept_obj["name"]
    elif selected_dept:
        dept_obj = db["departments"].find_one({"name": {"$regex": f"^{re.escape(selected_dept)}$", "$options": "i"}})

    candidates = [raw_login]
    if "@" not in raw_login and dept_obj and dept_obj.get("login_code"):
        candidates.append(f"{raw_login}@{dept_obj['login_code'].lower()}")

    user_query = {
        "$or": [
            {"login_id": {"$in": candidates}},
            {"email": {"$in": candidates}},
            {"username": {"$in": candidates}},
            {"username": raw_login}
        ]
    }

    if dept_obj:
        user = db["users"].find_one({
            "$and": [
                user_query,
                {"$or": [
                    {"department_id": dept_obj.get("id")},
                    {"department": dept_obj.get("name")}
                ]}
            ]
        }) or db["users"].find_one(user_query)
    else:
        user = db["users"].find_one(user_query)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid login ID or password.")

    if user.get("role") not in ["ADMIN", "OFFICER"]:
        raise HTTPException(status_code=403, detail="Unauthorized. Only Admin and Officer accounts may access this portal.")

    if user.get("role") == "OFFICER":
        if not selected_dept and not selected_dept_id:
            raise HTTPException(
                status_code=400,
                detail="Department selection is mandatory for Officer login. Please choose your assigned department."
            )
        if dept_obj and not dept_obj.get("is_active", True):
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: The department '{dept_obj.get('name')}' is currently inactive."
            )
        officer_dept = user.get("department", "")
        if dept_obj and officer_dept and officer_dept.strip().lower() != dept_obj.get("name", "").strip().lower():
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Your officer account is assigned to '{officer_dept}', not '{dept_obj.get('name')}'. Please select your assigned department."
            )
        elif selected_dept and officer_dept and officer_dept.strip().lower() != selected_dept.lower():
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Your officer account is assigned to '{officer_dept}', not '{selected_dept}'. Please select your assigned department."
            )

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This official account has been deactivated by the Central Administrator.")

    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Account credentials not configured. Please contact the Central Administrator.")

    try:
        is_valid = bcrypt.checkpw(raw_password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    except Exception:
        is_valid = False

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid login ID or password.")

    token = generate_jwt_token(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(user)
    )


@app.get("/api/admin/setup-status", response_model=AdminSetupStatusResponse)
def get_admin_setup_status(db: Database = Depends(get_db)):
    """
    Publicly check whether an Administrator account has been provisioned.
    """
    admin_count = db["users"].count_documents({"role": "ADMIN"})
    return AdminSetupStatusResponse(
        is_configured=admin_count > 0,
        admin_count=admin_count
    )


@app.post("/api/admin/first-time-setup", response_model=TokenResponse)
def first_time_admin_setup(payload: AdminSetupRequest, db: Database = Depends(get_db)):
    """
    Secure One-Time First Admin Provisioning in MongoDB:
    Only permitted if NO Admin account exists.
    """
    existing_admin_count = db["users"].count_documents({"role": "ADMIN"})
    if existing_admin_count > 0:
        raise HTTPException(
            status_code=403,
            detail="Admin account is already configured. First-time setup is permanently locked."
        )

    raw_login_id = (payload.login_id or "admin@jansamadhanadmin").strip().lower()
    raw_password = (payload.password or "").strip()
    full_name = (payload.name or "Central Administrator").strip()

    if len(raw_password) < 6:
        raise HTTPException(status_code=400, detail="Admin password must be at least 6 characters in length.")

    if payload.confirm_password and payload.confirm_password.strip() != raw_password:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    if db["users"].find_one({"$or": [{"login_id": raw_login_id}, {"email": raw_login_id}]}):
        raise HTTPException(status_code=409, detail=f"An account with identifier '{raw_login_id}' already exists.")

    hashed_pw = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = get_next_sequence_value(db, "users")
    now = get_utc_now()

    admin_doc = {
        "id": user_id,
        "name": full_name,
        "full_name": full_name,
        "login_id": raw_login_id,
        "email": raw_login_id,
        "password_hash": hashed_pw,
        "role": "ADMIN",
        "auth_provider": "official",
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    db["users"].insert_one(admin_doc)

    token = generate_jwt_token(admin_doc)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(admin_doc)
    )


@app.post("/api/auth/admin-login", response_model=TokenResponse)
@app.post("/api/admin/login", response_model=TokenResponse, include_in_schema=False)
def admin_login(payload: OfficialLoginRequest, db: Database = Depends(get_db)):
    """
    Dedicated Central Admin Authentication.
    """
    login_id = (payload.login_id or "").strip().lower()
    raw_password = (payload.password or "").strip()

    if not login_id or not raw_password:
        raise HTTPException(status_code=400, detail="Please enter your Admin Login ID and password.")

    user = db["users"].find_one({"$or": [{"login_id": login_id}, {"email": login_id}]})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Admin Login ID or password.")

    if user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Access denied. Only Central Administrators may access this portal.")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Administrator account is deactivated.")

    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Admin password not configured.")

    try:
        is_valid = bcrypt.checkpw(raw_password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    except Exception:
        is_valid = False

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid Admin Login ID or password.")

    token = generate_jwt_token(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(user)
    )


@app.post("/api/auth/google", response_model=TokenResponse)
def google_oauth_login(payload: GoogleAuthRequest, db: Database = Depends(get_db)):
    """
    Google OAuth 2.0 / GIS Token Authentication with MongoDB persistence.
    """
    token_str = payload.credential.strip()
    if not token_str:
        raise HTTPException(status_code=400, detail="Missing Google credential token.")

    email = None
    name = "Citizen"
    google_id = None

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        id_info = id_token.verify_oauth2_token(token_str, google_requests.Request())
        email = id_info.get("email")
        name = id_info.get("name", "Citizen")
        google_id = id_info.get("sub")
    except Exception:
        # Fallback to tokeninfo endpoint
        try:
            resp = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token_str}", timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                email = data.get("email")
                name = data.get("name", "Citizen")
                google_id = data.get("sub")
        except Exception:
            pass

    if not email:
        raise HTTPException(status_code=401, detail="Google token verification failed.")

    email = email.lower().strip()
    user = db["users"].find_one({"$or": [{"email": email}, {"google_id": google_id}]})

    now = get_utc_now()
    if not user:
        user_id = get_next_sequence_value(db, "users")
        user = {
            "id": user_id,
            "name": name,
            "full_name": name,
            "email": email,
            "google_id": google_id,
            "auth_provider": "google",
            "role": "CITIZEN",
            "department": None,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        db["users"].insert_one(user)
    else:
        db["users"].update_one(
            {"id": user["id"]},
            {"$set": {"google_id": google_id, "updated_at": now}}
        )

    token = generate_jwt_token(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(user)
    )


@app.post("/api/auth/logout")
def logout_user():
    return {"status": "success", "message": "Logged out successfully."}


@app.post("/api/auth/forgot-password")
def forgot_password_reset(payload: ResetPasswordRequest, db: Database = Depends(get_db)):
    raw_phone = (payload.phone or payload.mobile_number or "").strip()
    new_password = payload.new_password.strip()

    if not raw_phone or not new_password:
        raise HTTPException(status_code=400, detail="Mobile number and new password are required.")

    digits = "".join([c for c in raw_phone if c.isdigit()])
    phone = digits[-10:] if len(digits) >= 10 else raw_phone

    user = db["users"].find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=404, detail="No citizen account found with this mobile number.")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters in length.")

    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db["users"].update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hashed, "updated_at": get_utc_now()}}
    )
    return {"status": "success", "message": f"Password for +91 {phone} reset successfully."}


@app.post("/api/auth/mobile-login")
def quick_demo_login():
    raise HTTPException(
        status_code=403,
        detail="Demo login has been permanently disabled. Please register or log in using your official credentials."
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return to_user_response(current_user)


@app.post("/api/auth/change-password")
def change_user_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match.")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    
    current_hash = current_user.get("password_hash")
    if not current_hash or not bcrypt.checkpw(payload.old_password.encode("utf-8"), current_hash.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    
    new_hash = bcrypt.hashpw(payload.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db["users"].update_one(
        {"id": current_user["id"]},
        {"$set": {
            "password_hash": new_hash,
            "must_change_password": False,
            "updated_at": get_utc_now()
        }}
    )
    return {"status": "success", "message": "Password changed successfully."}


# ========================================================
# ADMIN: Officer Management Endpoints
# ========================================================

@app.get("/api/admin/officers", response_model=List[UserResponse])
def get_all_officers(admin: dict = Depends(require_admin), db: Database = Depends(get_db)):
    officers = list(db["users"].find({"role": "OFFICER"}).sort("created_at", -1))
    return [to_user_response(o) for o in officers]


@app.post("/api/admin/officers", response_model=UserResponse)
def create_officer_account(
    payload: OfficerCreateRequest,
    admin: dict = Depends(require_admin),
    db: Database = Depends(get_db)
):
    full_name = payload.name.strip()
    raw_username = payload.username.strip().lower()
    raw_dept = payload.department.strip()
    raw_password = payload.password.strip()
    recovery_email = (payload.recovery_email or "").strip().lower() or None

    if not full_name or len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Please enter the officer's full legal name.")

    username = re.sub(r"[^a-z0-9_]", "", raw_username)
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 alphanumeric characters.")

    if len(raw_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters in length.")

    dept = db["departments"].find_one({"name": raw_dept})
    if not dept:
        raise HTTPException(status_code=400, detail=f"Department '{raw_dept}' does not exist.")

    dept_code = dept.get("login_code") or dept.get("code") or "officer"
    generated_login_id = f"{username}@{dept_code}"

    if db["users"].find_one({"$or": [{"login_id": generated_login_id}, {"email": generated_login_id}]}):
        raise HTTPException(status_code=409, detail=f"An account with Login ID '{generated_login_id}' already exists.")

    if recovery_email and db["users"].find_one({"email": recovery_email}):
        raise HTTPException(status_code=409, detail=f"An account with email '{recovery_email}' already exists.")

    hashed_pw = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = get_next_sequence_value(db, "users")
    now = get_utc_now()

    officer_doc = {
        "id": user_id,
        "name": full_name,
        "full_name": full_name,
        "username": username,
        "login_id": generated_login_id,
        "department": dept["name"],
        "department_id": dept.get("id"),
        "recovery_email": recovery_email,
        "email": recovery_email or generated_login_id,
        "password_hash": hashed_pw,
        "role": "OFFICER",
        "auth_provider": "official",
        "must_change_password": True,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    db["users"].insert_one(officer_doc)
    return to_user_response(officer_doc)


@app.patch("/api/admin/officers/{officer_id}/status")
def update_officer_status(
    officer_id: int,
    payload: OfficerStatusUpdateRequest,
    admin: dict = Depends(require_admin),
    db: Database = Depends(get_db)
):
    officer = db["users"].find_one({"id": officer_id, "role": "OFFICER"})
    if not officer:
        raise HTTPException(status_code=404, detail="Officer account not found.")

    db["users"].update_one(
        {"id": officer_id},
        {"$set": {"is_active": payload.is_active, "updated_at": get_utc_now()}}
    )
    return {
        "status": "success",
        "message": f"Officer account '{officer.get('login_id')}' has been {'activated' if payload.is_active else 'deactivated'}."
    }


@app.patch("/api/admin/officers/{officer_id}/reset-password")
def reset_officer_password(
    officer_id: int,
    payload: OfficerPasswordResetRequest,
    admin: dict = Depends(require_admin),
    db: Database = Depends(get_db)
):
    officer = db["users"].find_one({"id": officer_id, "role": "OFFICER"})
    if not officer:
        raise HTTPException(status_code=404, detail="Officer account not found.")

    new_pw = payload.new_password.strip()
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters in length.")

    hashed_pw = bcrypt.hashpw(new_pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db["users"].update_one(
        {"id": officer_id},
        {"$set": {
            "password_hash": hashed_pw,
            "must_change_password": True,
            "updated_at": get_utc_now()
        }}
    )
    return {
        "status": "success",
        "message": f"Password for officer '{officer.get('login_id')}' has been reset successfully."
    }


# ========================================================
# AI Classification & Transcription
# ========================================================

@app.post("/api/ai/classify", response_model=AIClassificationResponse)
def classify_text(payload: AIClassificationRequest):
    result = classify_complaint(payload.raw_input, payload.selected_language)
    return AIClassificationResponse(
        original_text=payload.raw_input,
        detected_language=result["detected_language"],
        standardized_english=result["standardized_english"],
        category=result["category"],
        sub_category=result["sub_category"],
        priority=result["priority"],
        predicted_priority=result["priority"],
        department=result["department"],
        assigned_department=result["department"],
        formal_description=result["formal_description"],
        confidence=result.get("confidence", 0.95)
    )


@app.post("/api/complaints/transcribe")
async def transcribe_complaint_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        res = transcribe_audio_bytes(audio_bytes, file.filename or "audio.wav")
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio transcription error: {str(e)}")


# ========================================================
# Grievance / Complaint Endpoints (MongoDB)
# ========================================================

@app.get("/api/complaints")
def get_complaints(
    department: Optional[str] = None,
    citizen_phone: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: Database = Depends(get_db)
):
    query = {}

    if current_user:
        role = current_user.get("role")
        if role == "CITIZEN":
            clean_phone = current_user.get("phone")
            email = current_user.get("email")
            citizen_filters = []
            if clean_phone:
                citizen_filters.append({"citizen_phone": clean_phone})
            if email:
                citizen_filters.append({"citizen_email": email})
            if citizen_filters:
                query["$or"] = citizen_filters
        elif role == "OFFICER":
            officer_dept = current_user.get("department")
            if not officer_dept:
                return []
            query["$or"] = [
                {"department": officer_dept},
                {"assigned_department": officer_dept}
            ]
            department = None

    if department:
        query["$or"] = [
            {"department": department},
            {"assigned_department": department}
        ]
    if citizen_phone:
        query["citizen_phone"] = citizen_phone
    if status:
        query["status"] = status

    complaints_cursor = db["complaints"].find(query).sort("created_at", -1)
    return [format_complaint(c) for c in complaints_cursor]


@app.post("/api/complaints")
def create_complaint(payload: ComplaintCreateRequest, db: Database = Depends(get_db)):
    ai_result = classify_complaint(payload.raw_input, payload.detected_language)

    category = payload.category or ai_result["category"]
    sub_category = payload.sub_category or ai_result["sub_category"]
    priority = payload.priority or ai_result["priority"]
    department = payload.department or ai_result["department"]
    formal_description = ai_result["formal_description"]
    standardized_english_text = payload.standardized_english_text or ai_result["standardized_english"]
    detected_language = ai_result["detected_language"]
    original_complaint_text = payload.original_complaint_text or payload.raw_input

    seq_id = get_next_sequence_value(db, "complaints")
    complaint_id = f"JS-2026-{100 + seq_id}"

    title = f"{category} - {sub_category}"
    now_dt = get_utc_now()
    now_str = now_dt.strftime("%d %b %Y, %I:%M %p")

    citizen_phone = payload.citizen_phone or payload.user_phone

    h1 = {"status": "SUBMITTED", "time": now_str, "remark": f"Complaint registered in {detected_language}."}
    h2 = {"status": "ASSIGNED", "time": now_str, "remark": f"AI standardized to English, classified as {category} ({priority} Priority), and auto-routed to {department}."}

    complaint_doc = {
        "id": complaint_id,
        "title": title,
        "raw_input": payload.raw_input,
        "original_complaint_text": original_complaint_text,
        "standardized_english_text": standardized_english_text,
        "detected_language": detected_language,
        "formal_description": formal_description,
        "category": category,
        "sub_category": sub_category,
        "priority": priority,
        "predicted_priority": priority,
        "department": department,
        "assigned_department": department,
        "status": "ASSIGNED",
        "location_address": payload.location_address or "Ward 12, Sector 4 Main Road",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "citizen_name": payload.citizen_name or "Citizen",
        "citizen_phone": citizen_phone,
        "citizen_email": payload.citizen_email,
        "evidence_url": payload.evidence_url,
        "processing_timestamp": now_dt,
        "created_at": now_dt,
        "history": [h1, h2]
    }

    db["complaints"].insert_one(complaint_doc)

    res = format_complaint(complaint_doc)
    res["message"] = "Complaint registered successfully"
    res["complaint_id"] = complaint_id
    res["ai_analysis"] = ai_result

    if payload.citizen_email:
        send_complaint_email_via_nodemailer(payload.citizen_email, payload.citizen_name or "Citizen", res)

    return res


@app.get("/api/complaints/{complaint_id}")
def get_complaint_by_id(complaint_id: str, db: Database = Depends(get_db)):
    complaint = db["complaints"].find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    return format_complaint(complaint)


@app.patch("/api/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdateRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: Database = Depends(get_db)
):
    complaint = db["complaints"].find_one({"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user and current_user.get("role") == "OFFICER":
        officer_dept = current_user.get("department")
        if complaint.get("department") != officer_dept and complaint.get("assigned_department") != officer_dept:
            raise HTTPException(
                status_code=403,
                detail=f"Unauthorized. You can only update grievances routed to your assigned department ('{officer_dept}')."
            )

    now_str = get_utc_now().strftime("%d %b %Y, %I:%M %p")
    history_entry = {
        "status": payload.status,
        "time": now_str,
        "remark": payload.remark or f"Status changed to {payload.status}"
    }

    db["complaints"].update_one(
        {"id": complaint_id},
        {
            "$set": {"status": payload.status, "updated_at": get_utc_now()},
            "$push": {"history": history_entry}
        }
    )

    updated_complaint = db["complaints"].find_one({"id": complaint_id})
    return format_complaint(updated_complaint)


# ========================================================
# File Upload Endpoint (Security Hardened)
# ========================================================

ALLOWED_UPLOAD_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_UPLOAD_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB maximum upload limit

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. Validate file presence
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was provided for upload."
        )

    # 2. Strict extension whitelist validation
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Only image files (.png, .jpg, .jpeg, .webp) are permitted."
        )

    # 3. MIME type validation
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    if content_type not in ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file MIME type '{content_type}'. Permitted types are: image/png, image/jpeg, image/webp."
        )

    # 4. Stream file to disk in chunks, enforcing 10MB limit and magic bytes validation
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOADS_DIR, unique_filename)

    total_bytes = 0
    first_chunk = True

    try:
        with open(filepath, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)  # 1 MB chunk
                if not chunk:
                    break

                # Inspect magic header bytes on the first chunk
                if first_chunk:
                    first_chunk = False
                    is_valid_magic = False
                    if ext in {".jpg", ".jpeg"} and chunk.startswith(b"\xff\xd8\xff"):
                        is_valid_magic = True
                    elif ext == ".png" and chunk.startswith(b"\x89PNG\r\n\x1a\n"):
                        is_valid_magic = True
                    elif ext == ".webp" and chunk.startswith(b"RIFF") and len(chunk) >= 12 and chunk[8:12] == b"WEBP":
                        is_valid_magic = True

                    if not is_valid_magic:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Uploaded file header does not match genuine image data. Upload rejected."
                        )

                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File size exceeds the 10 MB maximum upload limit."
                    )
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        raise
    except Exception as e:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while saving the file: {str(e)}"
        )

    return {
        "filename": unique_filename,
        "url": f"/uploads/{unique_filename}",
        "size_bytes": total_bytes
    }


# ========================================================
# Department Management Endpoints (MongoDB)
# ========================================================

@app.get("/api/departments")
def get_departments(active_only: bool = True, db: Database = Depends(get_db)):
    """
    Returns departments stored in MongoDB Atlas (restricted to the 5 approved active departments).
    """
    query = {"is_active": True} if active_only else {}
    departments = list(db["departments"].find(query).sort("id", 1))

    results = []
    for d in departments:
        name = d.get("name")
        officer_count = db["users"].count_documents({"role": "OFFICER", "department": name})
        complaint_count = db["complaints"].count_documents({"$or": [{"department": name}, {"assigned_department": name}]})

        results.append({
            "id": d.get("id"),
            "name": name,
            "code": d.get("code"),
            "login_code": d.get("login_code") or d.get("code"),
            "description": d.get("description"),
            "is_active": bool(d.get("is_active", True)),
            "officer_count": officer_count,
            "complaint_count": complaint_count
        })
    return results


@app.post("/api/admin/departments")
def add_new_department(
    payload: DepartmentCreateRequest,
    admin: dict = Depends(require_admin),
    db: Database = Depends(get_db)
):
    dept_name = payload.name.strip()
    if len(dept_name) < 3:
        raise HTTPException(status_code=400, detail="Department name must be at least 3 characters.")

    if db["departments"].find_one({"name": {"$regex": f"^{re.escape(dept_name)}$", "$options": "i"}}):
        raise HTTPException(status_code=400, detail=f"Department '{dept_name}' already exists.")

    dept_id = get_next_sequence_value(db, "departments")
    dept_code = (payload.code or "").strip().lower() or f"dept{dept_id}"

    new_dept = {
        "id": dept_id,
        "name": dept_name,
        "code": dept_code,
        "login_code": dept_code,
        "description": payload.description or f"{dept_name} Grievance Redressal Cell",
        "is_active": True,
        "created_at": get_utc_now()
    }
    db["departments"].insert_one(new_dept)
    return {
        "id": new_dept["id"],
        "name": new_dept["name"],
        "code": new_dept["code"],
        "login_code": new_dept["login_code"],
        "description": new_dept["description"],
        "officer_count": 0,
        "complaint_count": 0
    }


@app.delete("/api/admin/departments/{dept_id}")
def delete_department(
    dept_id: int,
    admin: dict = Depends(require_admin),
    db: Database = Depends(get_db)
):
    dept = db["departments"].find_one({"id": dept_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    name = dept.get("name")
    officer_count = db["users"].count_documents({"role": "OFFICER", "department": name})
    if officer_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete department '{name}' because {officer_count} officer(s) are assigned to it.")

    complaint_count = db["complaints"].count_documents({"$or": [{"department": name}, {"assigned_department": name}]})
    if complaint_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete department '{name}' because {complaint_count} complaint(s) are associated with it.")

    db["departments"].delete_one({"id": dept_id})
    return {"success": True, "message": f"Department '{name}' has been successfully removed."}


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
