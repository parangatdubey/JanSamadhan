import os
import logging
import certifi
from urllib.parse import quote_plus, urlparse
from typing import Optional
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Load environment variables reliably, ALWAYS prioritizing the project root .env
_file_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_file_dir)
_root_dir = os.path.dirname(_backend_dir)

root_env = os.path.join(_root_dir, ".env")
if os.path.exists(root_env):
    load_dotenv(root_env, override=True)

backend_env = os.path.join(_backend_dir, ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=False)

logger = logging.getLogger("jansamadhan.database")

DATABASE_NAME = os.getenv("DATABASE_NAME", "jansamadhan_db").strip() or "jansamadhan_db"
MONGODB_USER = os.getenv("MONGODB_USER", "").strip()
MONGODB_HOST = os.getenv("MONGODB_HOST", "").strip()

def get_connection_url() -> str:
    """
    Dynamically computes the active MongoDB Atlas connection URL from environment variables.
    Handles URL-encoding of special characters in passwords cleanly.
    """
    url = os.getenv("MONGODB_URL", "").strip()
    if not url or "PASTE_YOUR_ATLAS_PASSWORD_HERE" in url:
        pwd = os.getenv("MONGODB_PASSWORD", "").strip()
        user = os.getenv("MONGODB_USER", "").strip()
        host = os.getenv("MONGODB_HOST", "").strip()
        db_name = os.getenv("DATABASE_NAME", "jansamadhan_db").strip() or "jansamadhan_db"
        if pwd and user and host and pwd != "PASTE_YOUR_ATLAS_PASSWORD_HERE":
            encoded_password = quote_plus(pwd)
            url = (
                f"mongodb+srv://{quote_plus(user)}:{encoded_password}@{host}/"
                f"{db_name}?retryWrites=true&w=majority&appName=Cluster0"
            )
    return url

# Safe masked representation for logging (never prints secrets)
def get_masked_mongo_url() -> str:
    url = get_connection_url()
    if not url or "PASTE_YOUR_ATLAS_PASSWORD_HERE" in url:
        user = os.getenv("MONGODB_USER", "db_user").strip() or "db_user"
        host = os.getenv("MONGODB_HOST", "cluster0.mongodb.net").strip() or "cluster0.mongodb.net"
        db_name = os.getenv("DATABASE_NAME", "jansamadhan_db").strip() or "jansamadhan_db"
        return f"mongodb+srv://{user}:****@{host}/{db_name} (Configuration pending in .env)"
    try:
        parsed = urlparse(url)
        netloc = f"{parsed.username or MONGODB_USER or 'db_user'}:****@{parsed.hostname}"
        db_name = parsed.path.lstrip('/') or DATABASE_NAME
        return f"mongodb+srv://{netloc}/{db_name}"
    except Exception:
        return f"mongodb+srv://{MONGODB_USER or 'db_user'}:****@{MONGODB_HOST or 'cluster0.mongodb.net'}/{DATABASE_NAME}"

_mongo_client: Optional[MongoClient] = None

def get_mongo_client() -> MongoClient:
    """
    Returns a singleton MongoClient configured with resilient timeouts.
    """
    global _mongo_client
    if _mongo_client is None:
        url = get_connection_url()
        if not url or "PASTE_YOUR_ATLAS_PASSWORD_HERE" in url:
            raise ConnectionFailure(
                f"MongoDB connection string is unconfigured. Please provide your Atlas password in .env ({get_masked_mongo_url()})"
            )
        _mongo_client = MongoClient(
            url,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            maxPoolSize=50,
            minPoolSize=5
        )
    return _mongo_client

def get_db() -> Database:
    """
    FastAPI dependency that provides the active MongoDB database instance.
    """
    client = get_mongo_client()
    db_name = os.getenv("DATABASE_NAME", "jansamadhan_db").strip() or "jansamadhan_db"
    return client[db_name]

def check_mongo_connection() -> dict:
    """
    Pings the MongoDB server to verify live connectivity and latency.
    """
    global _mongo_client
    db_name = os.getenv("DATABASE_NAME", "jansamadhan_db").strip() or "jansamadhan_db"
    host = os.getenv("MONGODB_HOST", "cluster0.mongodb.net").strip()
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        return {
            "status": "connected",
            "database": db_name,
            "cluster": host,
            "masked_url": get_masked_mongo_url()
        }
    except Exception as e:
        # Reset client on failure so next attempt retries fresh
        _mongo_client = None
        return {
            "status": "disconnected",
            "error": str(e),
            "masked_url": get_masked_mongo_url()
        }

def get_next_sequence_value(db: Database, sequence_name: str) -> int:
    """
    Atomically generates the next integer sequence value (used for stable numeric IDs).
    Automatically guards against colliding with pre-existing seeded integer IDs.
    """
    try:
        max_doc = db[sequence_name].find_one(sort=[("id", -1)])
        max_existing = max_doc["id"] if max_doc and isinstance(max_doc.get("id"), int) else 0
        curr = db["counters"].find_one({"_id": sequence_name})
        curr_seq = curr.get("seq", 0) if curr else 0
        if max_existing > curr_seq:
            db["counters"].update_one(
                {"_id": sequence_name},
                {"$set": {"seq": max_existing}},
                upsert=True
            )
    except Exception:
        pass

    counter = db["counters"].find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return counter["seq"]

def init_db_indexes(db: Database):
    """
    Ensures optimal unique constraints and query indexes on fresh MongoDB collections.
    """
    logger.info("Initializing MongoDB indexes on database: %s", DATABASE_NAME)

    # 1. Users collection indexes
    users = db["users"]
    users.create_index("id", unique=True)
    users.create_index("login_id", unique=True, sparse=True)
    users.create_index("email", unique=True, sparse=True)
    users.create_index("phone", unique=True, sparse=True)
    users.create_index("username", sparse=True)
    users.create_index("role")
    users.create_index("department")
    users.create_index("department_id", sparse=True)

    # 2. Departments collection indexes
    departments = db["departments"]
    departments.create_index("id", unique=True)
    departments.create_index("name", unique=True)
    departments.create_index("code", unique=True)
    departments.create_index("is_active")

    # 3. Complaints collection indexes
    complaints = db["complaints"]
    complaints.create_index("id", unique=True)
    complaints.create_index("department")
    complaints.create_index("assigned_department")
    complaints.create_index("status")
    complaints.create_index("citizen_phone")
    complaints.create_index("citizen_email")
    complaints.create_index("created_at")

    logger.info("MongoDB indexes successfully created/verified.")
