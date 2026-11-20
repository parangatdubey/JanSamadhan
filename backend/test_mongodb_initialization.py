import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_db, init_db_indexes
from app.main import sync_approved_departments

db = get_db()
init_db_indexes(db)
sync_approved_departments(db)

depts = list(db['departments'].find({'is_active': True}).sort('id', 1))
print(f"Active departments initialized: {len(depts)}")
for d in depts:
    print(f"  ID {d['id']}: {d['name']} | Code: {d['code']} | LoginCode: {d['login_code']}")

print("All Collections:", db.list_collection_names())

