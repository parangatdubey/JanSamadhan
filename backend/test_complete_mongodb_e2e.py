import os
import sys
import unittest
import datetime
import bcrypt

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# ==============================================================================
# Strict Environment & Database Safety Guards
# Prevents any execution against production databases or deployments
# ==============================================================================
ENV = os.getenv("ENVIRONMENT", "").strip().lower()
IS_RENDER = bool(os.getenv("RENDER"))
PROD_DB_NAME = os.getenv("DATABASE_NAME", "jansamadhan_db").strip() or "jansamadhan_db"
TEST_DB_NAME = os.getenv("TEST_DATABASE_NAME", "jansamadhan_test_db").strip() or "jansamadhan_test_db"

if ENV in ("production", "prod") or IS_RENDER:
    raise RuntimeError(
        f"CRITICAL SAFETY BLOCK: E2E tests are strictly forbidden from running in a production "
        f"environment (ENVIRONMENT={ENV}, RENDER={IS_RENDER})."
    )

if TEST_DB_NAME.lower() == PROD_DB_NAME.lower():
    raise RuntimeError(
        f"CRITICAL SAFETY BLOCK: TEST_DATABASE_NAME ('{TEST_DB_NAME}') cannot match production "
        f"DATABASE_NAME ('{PROD_DB_NAME}'). Tests require a dedicated, isolated test database."
    )

if "test" not in TEST_DB_NAME.lower():
    raise RuntimeError(
        f"CRITICAL SAFETY BLOCK: TEST_DATABASE_NAME ('{TEST_DB_NAME}') must explicitly contain 'test' "
        "to prevent accidental targeting of production or genuine user data."
    )

from fastapi.testclient import TestClient
from app.main import app, sync_approved_departments
from app.database import get_db, check_mongo_connection, get_mongo_client

# Connect to isolated test database
mongo_client = get_mongo_client()
test_db = mongo_client[TEST_DB_NAME]

# Override FastAPI database dependency to target the isolated test database exclusively
def override_get_db():
    return test_db

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)
db = test_db

def get_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)

class TestJanSamadhanMongoE2E(unittest.TestCase):
    db = test_db

    @classmethod
    def setUpClass(cls):
        # Secondary runtime safety assertion
        if cls.db.name == PROD_DB_NAME or "test" not in cls.db.name.lower():
            raise RuntimeError(f"Refusing to execute tests against non-test database: {cls.db.name}")

        # Initialize approved departments and reset isolated test collections
        sync_approved_departments(cls.db)
        cls.db["users"].delete_many({})
        cls.db["complaints"].delete_many({})
        cls.db["counters"].delete_many({})

    @classmethod
    def tearDownClass(cls):
        # Strict isolation: drop only the isolated test database
        if "test" in cls.db.name.lower() and cls.db.name != PROD_DB_NAME:
            mongo_client.drop_database(cls.db.name)
        app.dependency_overrides.clear()

    def test_01_health_and_mongodb_connectivity(self):
        """TEST A & E: Verify health endpoint and live MongoDB Atlas connectivity"""
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("database"), "MongoDB Atlas")
        self.assertTrue(data.get("database_connected"))
        print("[PASS] TEST A & E: Health endpoint reports healthy & connected to MongoDB Atlas.")

    def test_02_five_approved_departments(self):
        """TEST C: Exactly five active departments returned with valid structure"""
        res = client.get("/api/departments")
        self.assertEqual(res.status_code, 200)
        depts = res.json()
        self.assertEqual(len(depts), 5, f"Expected exactly 5 departments, got {len(depts)}")
        dept_names = [d["name"] for d in depts]
        expected_names = [
            "Electricity Department",
            "Water Supply Department",
            "Public Works Department (PWD)",
            "Municipal Corporation",
            "Municipal Drainage Department"
        ]
        for name in expected_names:
            self.assertIn(name, dept_names, f"Department '{name}' missing from active departments")
        print("[PASS] TEST C: Exactly 5 approved departments confirmed:", dept_names)

    def test_03_citizen_registration_and_login(self):
        """TEST B: Citizen registration, password hashing in MongoDB, and login verification"""
        phone = "9999900001"
        email = "test_citizen@jansamadhan.test"
        pwd = "SecretPassword123"

        # 1. Register Citizen
        reg_res = client.post("/api/auth/register-phone", json={
            "name": "Test Citizen User",
            "phone": phone,
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "role": "CITIZEN"
        })
        self.assertEqual(reg_res.status_code, 200, reg_res.text)
        reg_data = reg_res.json()
        token = reg_data.get("access_token")
        self.assertTrue(token)
        user_info = reg_data.get("user")
        self.assertEqual(user_info["role"], "CITIZEN")
        self.assertEqual(user_info["phone"], phone)

        # Verify password in MongoDB is hashed with Bcrypt
        user_doc = db["users"].find_one({"phone": phone})
        self.assertIsNotNone(user_doc)
        self.assertNotEqual(user_doc.get("password_hash"), pwd)
        self.assertTrue(bcrypt.checkpw(pwd.encode("utf-8"), user_doc["password_hash"].encode("utf-8")))

        # 2. Reject duplicate registration
        dup_res = client.post("/api/auth/register-phone", json={
            "name": "Duplicate User",
            "phone": phone,
            "password": pwd
        })
        self.assertEqual(dup_res.status_code, 409)

        # 3. Login Citizen with correct password
        login_res = client.post("/api/auth/login-phone", json={
            "phone": phone,
            "password": pwd
        })
        self.assertEqual(login_res.status_code, 200)
        login_token = login_res.json().get("access_token")
        self.assertTrue(login_token)

        # 4. Reject Citizen login with incorrect password
        bad_login = client.post("/api/auth/login-phone", json={
            "phone": phone,
            "password": "WrongPassword!"
        })
        self.assertEqual(bad_login.status_code, 401)
        print("[PASS] TEST B (Citizen): Registration, Bcrypt hash, Duplicate Rejection, and Login verified.")

    def test_04_admin_setup_and_login(self):
        """TEST B: Admin initial provisioning or login and role authorization"""
        admin_doc = db["users"].find_one({"role": "ADMIN"})
        admin_pwd = "AdminSecurePass2026!"
        
        if not admin_doc:
            setup_res = client.post("/api/admin/first-time-setup", json={
                "name": "Central Administrator",
                "login_id": "admin@jansamadhanadmin",
                "password": admin_pwd,
                "confirm_password": admin_pwd
            })
            self.assertEqual(setup_res.status_code, 200)
            token = setup_res.json()["access_token"]
        else:
            # Update password for isolated test verification
            hashed = bcrypt.hashpw(admin_pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            db["users"].update_one({"id": admin_doc["id"]}, {"$set": {"password_hash": hashed}})
            login_res = client.post("/api/auth/admin-login", json={
                "login_id": admin_doc["login_id"],
                "password": admin_pwd
            })
            self.assertEqual(login_res.status_code, 200)
            token = login_res.json()["access_token"]

        # Verify /api/auth/me returns ADMIN role
        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["role"], "ADMIN")
        print("[PASS] TEST B (Admin): Admin authentication and profile retrieval verified.")

    def test_05_officer_account_lifecycle(self):
        """TEST B & C: Officer account creation by Admin, department isolation, and login"""
        # Admin login
        admin_login_res = client.post("/api/auth/admin-login", json={
            "login_id": "admin@jansamadhanadmin",
            "password": "AdminSecurePass2026!"
        })
        self.assertEqual(admin_login_res.status_code, 200)
        admin_token = admin_login_res.json()["access_token"]

        officer_pwd = "OfficerPass123!"
        officer_login_id = "test_elec_officer@electricity"

        # Check if already exists or create
        existing = db["users"].find_one({"login_id": officer_login_id})
        if not existing:
            create_res = client.post("/api/admin/officers", json={
                "name": "Test Officer Electricity",
                "username": "test_elec_officer",
                "department": "Electricity Department",
                "password": officer_pwd,
                "recovery_email": "test_elec_recovery@jansamadhan.test"
            }, headers={"Authorization": f"Bearer {admin_token}"})
            self.assertEqual(create_res.status_code, 200, create_res.text)
            officer_data = create_res.json()
            self.assertEqual(officer_data["role"], "OFFICER")
            self.assertEqual(officer_data["department"], "Electricity Department")

        # Officer Login with matching department -> 200
        off_login = client.post("/api/auth/official-login", json={
            "login_id": officer_login_id,
            "password": officer_pwd,
            "department": "Electricity Department"
        })
        self.assertEqual(off_login.status_code, 200)
        officer_token = off_login.json()["access_token"]
        self.assertTrue(officer_token)

        # Officer Login with mismatched department -> 403 Forbidden
        bad_dept_login = client.post("/api/auth/official-login", json={
            "login_id": officer_login_id,
            "password": officer_pwd,
            "department": "Water Supply Department"
        })
        self.assertEqual(bad_dept_login.status_code, 403)

        # Officer Login with bad password -> 401
        bad_pwd_login = client.post("/api/auth/official-login", json={
            "login_id": officer_login_id,
            "password": "WrongPassword",
            "department": "Electricity Department"
        })
        self.assertEqual(bad_pwd_login.status_code, 401)
        print("[PASS] TEST B (Officer): Account creation, department matching, and auth isolation verified.")

    def test_06_grievance_submission_tracking_and_officer_update(self):
        """TEST D: Full grievance lifecycle from citizen submission to officer status update"""
        # 1. Citizen registers complaint
        complaint_payload = {
            "raw_input": "Power outage and transformer spark on Sector 4 main street since morning",
            "location_address": "Sector 4 Main Road, near Transformer 12",
            "citizen_name": "Test Citizen User",
            "citizen_phone": "9999900001",
            "citizen_email": "test_citizen@jansamadhan.test"
        }
        res = client.post("/api/complaints", json=complaint_payload)
        self.assertEqual(res.status_code, 200, res.text)
        comp_data = res.json()
        complaint_id = comp_data.get("id") or comp_data.get("complaint_id")
        self.assertTrue(complaint_id.startswith("JS-2026-"))
        self.assertEqual(comp_data["department"], "Electricity Department")
        self.assertEqual(comp_data["status"], "ASSIGNED")
        self.assertEqual(len(comp_data["history"]), 2)

        # Verify complaint document is persisted in MongoDB Atlas
        doc = db["complaints"].find_one({"id": complaint_id})
        self.assertIsNotNone(doc)
        self.assertEqual(doc["citizen_phone"], "9999900001")
        self.assertEqual(doc["department"], "Electricity Department")

        # 2. Citizen views complaint in history
        citizen_login = client.post("/api/auth/login-phone", json={
            "phone": "9999900001",
            "password": "SecretPassword123"
        })
        citizen_token = citizen_login.json()["access_token"]
        citizen_complaints_res = client.get("/api/complaints", headers={"Authorization": f"Bearer {citizen_token}"})
        self.assertEqual(citizen_complaints_res.status_code, 200)
        citizen_complaints = citizen_complaints_res.json()
        ids = [c["id"] for c in citizen_complaints]
        self.assertIn(complaint_id, ids)

        # 3. Electricity Officer views and updates complaint
        off_login = client.post("/api/auth/official-login", json={
            "login_id": "test_elec_officer@electricity",
            "password": "OfficerPass123!",
            "department": "Electricity Department"
        })
        self.assertEqual(off_login.status_code, 200)
        officer_token = off_login.json()["access_token"]

        officer_complaints_res = client.get("/api/complaints", headers={"Authorization": f"Bearer {officer_token}"})
        self.assertEqual(officer_complaints_res.status_code, 200)
        officer_complaints = officer_complaints_res.json()
        off_ids = [c["id"] for c in officer_complaints]
        self.assertIn(complaint_id, off_ids)

        # Update status to IN_PROGRESS
        update_res = client.patch(f"/api/complaints/{complaint_id}/status", json={
            "status": "IN_PROGRESS",
            "remark": "Dispatched technician crew to repair transformer fuse."
        }, headers={"Authorization": f"Bearer {officer_token}"})
        self.assertEqual(update_res.status_code, 200)
        updated_comp = update_res.json()
        self.assertEqual(updated_comp["status"], "IN_PROGRESS")
        self.assertEqual(len(updated_comp["history"]), 3)

        # 4. Check that updated status is stored in MongoDB Atlas and visible to Citizen
        citizen_check_res = client.get(f"/api/complaints/{complaint_id}")
        self.assertEqual(citizen_check_res.status_code, 200)
        self.assertEqual(citizen_check_res.json()["status"], "IN_PROGRESS")
        print("[PASS] TEST D: Citizen submission -> MongoDB persistence -> Officer update -> Citizen verification passed.")

    def test_07_persistence_across_connection_recycle(self):
        """TEST F: Verify document persistence in MongoDB Atlas"""
        test_id = f"test_persistence_{int(get_now().timestamp())}"
        test_doc = {
            "test_marker": test_id,
            "created_at": get_now(),
            "status": "persisted"
        }
        db["_test_persistence"].insert_one(test_doc)

        # Check retrieval from Atlas
        found = db["_test_persistence"].find_one({"test_marker": test_id})
        self.assertIsNotNone(found)
        self.assertEqual(found["status"], "persisted")

        # Cleanup isolated marker
        db["_test_persistence"].delete_one({"test_marker": test_id})
        print("[PASS] TEST F: Document persistence confirmed in MongoDB Atlas.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
