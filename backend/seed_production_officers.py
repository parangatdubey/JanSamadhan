import os
import sys
import datetime
import bcrypt

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# ==============================================================================
# Credential Validation (Enforces independent environment variables)
# Must run upfront before establishing any database connection
# ==============================================================================
default_officer_password = os.getenv("DEFAULT_OFFICER_PASSWORD", "").strip()
if not default_officer_password:
    print("[ERROR] DEFAULT_OFFICER_PASSWORD must be configured in environment variables to seed officer accounts.")
    sys.exit(1)

default_admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "").strip()
if not default_admin_username:
    print("[ERROR] DEFAULT_ADMIN_USERNAME must be configured in environment variables to seed the Central Administrator.")
    sys.exit(1)

default_admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "").strip()
if not default_admin_password:
    print("[ERROR] DEFAULT_ADMIN_PASSWORD must be configured in environment variables to seed the Central Administrator.")
    sys.exit(1)

from app.database import get_db, get_next_sequence_value

db = get_db()

OFFICERS = [
    {
        "name": "Electricity Redressal Officer",
        "username": "abc",
        "login_id": "abc@electricity",
        "department": "Electricity Department",
        "dept_code": "electricity",
        "email": "abc.electricity@jansamadhan.gov.in"
    },
    {
        "name": "Water Supply Redressal Officer",
        "username": "abc",
        "login_id": "abc@watersupply",
        "department": "Water Supply Department",
        "dept_code": "watersupply",
        "email": "abc.watersupply@jansamadhan.gov.in"
    },
    {
        "name": "Public Works Redressal Officer",
        "username": "abc",
        "login_id": "abc@pwd",
        "department": "Public Works Department (PWD)",
        "dept_code": "pwd",
        "email": "abc.pwd@jansamadhan.gov.in"
    },
    {
        "name": "Municipal Corporation Officer",
        "username": "abc",
        "login_id": "abc@municipalcorporation",
        "department": "Municipal Corporation",
        "dept_code": "municipalcorporation",
        "email": "abc.municipalcorporation@jansamadhan.gov.in"
    },
    {
        "name": "Municipal Drainage Redressal Officer",
        "username": "abc",
        "login_id": "abc@municipaldrainage",
        "department": "Municipal Drainage Department",
        "dept_code": "municipaldrainage",
        "email": "abc.municipaldrainage@jansamadhan.gov.in"
    }
]

officer_hashed_pw = bcrypt.hashpw(default_officer_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
admin_hashed_pw = bcrypt.hashpw(default_admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
now = datetime.datetime.now(datetime.timezone.utc)

print("Provisioning 5 Real Government Department Officers in MongoDB Atlas...")
for off in OFFICERS:
    dept = db["departments"].find_one({"name": off["department"]})
    dept_id = dept["id"] if dept else None

    existing = db["users"].find_one({"login_id": off["login_id"]})
    if existing:
        db["users"].update_one(
            {"login_id": off["login_id"]},
            {"$set": {
                "role": "OFFICER",
                "department": off["department"],
                "department_id": dept_id,
                "is_active": True,
                "updated_at": now
            }}
        )
        print(f"  [UPDATED] {off['login_id']} (ID: {existing['id']}) -> Dept: {off['department']} (DeptID: {dept_id})")
    else:
        user_id = get_next_sequence_value(db, "users")
        doc = {
            "id": user_id,
            "name": off["name"],
            "full_name": off["name"],
            "username": off["login_id"],
            "login_id": off["login_id"],
            "email": off["email"],
            "department": off["department"],
            "department_id": dept_id,
            "password_hash": officer_hashed_pw,
            "role": "OFFICER",
            "auth_provider": "official",
            "must_change_password": True,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        db["users"].insert_one(doc)
        print(f"  [CREATED] {off['login_id']} (ID: {user_id}) -> Dept: {off['department']} (DeptID: {dept_id})")

# Ensure Central Administrator account exists
admin_user = db["users"].find_one({"login_id": default_admin_username})

if not admin_user:
    admin_id = get_next_sequence_value(db, "users")
    db["users"].insert_one({
        "id": admin_id,
        "name": "Central Administrator",
        "full_name": "Central Administrator",
        "login_id": default_admin_username,
        "email": default_admin_username,
        "password_hash": admin_hashed_pw,
        "role": "ADMIN",
        "auth_provider": "official",
        "is_active": True,
        "created_at": now,
        "updated_at": now
    })
    print(f"  [CREATED] Central Admin: {default_admin_username} (ID: {admin_id})")
else:
    print(f"  [EXISTS] Central Admin: {default_admin_username} (ID: {admin_user['id']})")

print("All Officer and Administrator accounts synchronized in MongoDB Atlas.")

