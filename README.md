# JanSamadhan (जनसमाधान)
### National Public Grievance Redressal System
*Inspired by Digital India, Clean India (Swachh Bharat), and Prosperous India*

---

## 🏛️ Overview

**JanSamadhan** is a modern, enterprise-grade public grievance redressal platform engineered for Indian digital governance. It bridges the gap between citizens and municipal authorities by combining multilingual natural language processing, intelligent auto-routing, and transparent end-to-end tracking.

### Key Pillars
- **Inclusivity & Multilingual Access**: Citizens can register grievances in Hindi, English, and regional dialects (such as Bhojpuri) using text or voice input.
- **Automated AI Routing & Triage**: The system normalizes colloquial complaints, predicts priority (Low, Medium, High, Critical), extracts locations, and routes them to the correct nodal department.
- **Three-Tier Role-Based Architecture**:
  1. **Citizen Portal**: Mobile number registration, voice/text complaint filing, image evidence upload, and live tracking.
  2. **Officer Portal**: Department-scoped workflow, priority triage, engineer dispatching, and status updates (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`).
  3. **Central Administrator Portal**: Oversight across all departments, nodal officer provisioning, system health monitoring, and security management.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, HTML5 Audio Recording API |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic v2, PyMongo, Python-Jose (JWT), Bcrypt |
| **Database** | MongoDB Atlas (Cloud Cluster) with TLS/SSL CA verification (`certifi`), unique indexes, and atomic sequence counters |
| **AI / NLP Pipeline** | Scikit-learn, SpeechRecognition, Deep Translator, Multilingual Keyword Engine |
| **Hosting Target** | **Backend**: Render (FastAPI Web Service) <br> **Frontend**: Vercel (SPA with dynamic API base URL) |

---

## 📂 Project Architecture

```
JanSamadhan/
├── backend/
│   ├── app/
│   │   ├── ai_service.py       # Multilingual translation, classification & speech processing
│   │   ├── database.py         # MongoDB Atlas client, connection health, index seeding
│   │   ├── main.py             # FastAPI REST endpoints, auth, CORS, hardened upload
│   │   └── models.py           # Pydantic data schemas & validation models
│   ├── uploads/                # Local evidence storage (persisted via S3/Cloudinary in prod)
│   ├── requirements.txt        # Production Python dependencies (includes certifi)
│   └── .env.example            # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, Modals, AudioRecorder)
│   │   ├── pages/              # Portal pages (Home, Citizen, Officer, Admin, About, Services)
│   │   ├── services/           # API integration layer with environment-driven baseURL
│   │   └── utils/              # Client-side helpers and audio processing utilities
│   ├── vercel.json             # Vercel SPA routing configuration
│   ├── package.json            # Node.js dependencies
│   └── .env.example            # Frontend environment template
├── .env.example                # Unified global environment variable template
├── .gitignore                  # Production Git ignore rules
└── README.md                   # Project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Python**: Version 3.10, 3.11, or 3.12
- **Node.js**: Version 18.x or 20.x
- **MongoDB Atlas**: An active MongoDB Atlas cluster (free M0 or dedicated)

### 2. Environment Configuration
Copy the template file to `.env` in the root (or `backend/.env`):
```bash
cp .env.example .env
```
Fill in your MongoDB Atlas credentials:
```env
DATABASE_NAME=jansamadhan_db
MONGODB_USER=your_atlas_user
MONGODB_HOST=your_cluster.mongodb.net
MONGODB_PASSWORD=your_atlas_password
SECRET_KEY=generate_a_random_secret_key_here
PORT=8000
HOST=127.0.0.1
```

### 3. Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .\.venv\Scripts\activate

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```
4. Verify backend health:
   Navigate to `http://127.0.0.1:8000/api/health` or `http://127.0.0.1:8000/docs` (Swagger UI).

### 4. Frontend Setup
1. Open a new terminal in the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment Guide

### Deploying the Backend on Render

1. **Create Web Service**:
   - Link your GitHub repository on [Render](https://render.com).
   - Select **Web Service**.
2. **Build & Startup Commands**:
   - **Environment**: `Python 3`
   - **Root Directory**: `backend` (or run from root with build command below)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   Add the following in Render's **Environment** tab:
   - `DATABASE_NAME`: `jansamadhan_db`
   - `MONGODB_USER`: `<your-db-username>`
   - `MONGODB_HOST`: `<your-cluster-host>.mongodb.net`
   - `MONGODB_PASSWORD`: `<your-db-password>`
   - `SECRET_KEY`: `<generate-using-openssl-rand-hex-32>`
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app`

---

### Deploying the Frontend on Vercel

1. **Import Project**:
   - Connect your GitHub repository to [Vercel](https://vercel.com).
2. **Framework & Root Directory**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com` (Your Render backend URL without trailing slash)
4. **Deploy**:
   - Vercel automatically builds using `npm run build` and deploys to global edge CDN.
   - The included `frontend/vercel.json` ensures client-side routes (e.g. `/officer/login`) resolve cleanly to `/index.html`.

---

## 🔒 Security & Architecture Considerations

### 1. MongoDB Atlas Network Access (IP Whitelist vs. 0.0.0.0/0)
- **Render Dynamic IP Nature**: Like most modern PaaS providers (Heroku, AWS Lambda, Render free/starter tiers), Render uses dynamically allocated outbound IP addresses.
- **Options**:
  - **Option A (Standard for PaaS / Render)**: Add `0.0.0.0/0` (Allow access from anywhere) in MongoDB Atlas Network Access. In this model, security relies strictly on:
    1. Strong database credentials with SCRAM-SHA-256 authentication.
    2. Least privilege role permissions in Atlas.
    3. TLS/SSL encrypted connection enforced via `certifi` root CA bundle.
  - **Option B (Static Egress Proxy)**: Use a static proxy service (such as QuotaGuard Static or Fixie) to channel outbound traffic from Render through a fixed IP that can be whitelisted in Atlas.
  - **Option C (VPC Peering)**: For enterprise deployments on AWS/GCP, configure MongoDB Atlas VPC Peering to keep traffic entirely off the public internet.

### 2. Persistent Evidence Storage (Render Ephemeral Disks)
- **Render Container Behavior**: Standard web services on Render have ephemeral disk storage. Any files saved to `backend/uploads/` will be reset upon service redeploy or container restart.
- **Production Storage Solution**:
  - For long-term production, integrate an S3-compatible cloud object store:
    - **AWS S3** / **Google Cloud Storage** / **Cloudflare R2**
    - **Cloudinary** (ideal for optimized image transformation & delivery)
  - The hardened `/api/upload` endpoint is designed so that swapping local disk writing for an S3/Cloudinary upload stream requires only a modular client adapter.

### 3. File Upload Hardening
The `/api/upload` endpoint includes enterprise-grade guardrails:
- **Strict Extension Whitelist**: Only `.png`, `.jpg`, `.jpeg`, and `.webp` files are accepted.
- **MIME Type Validation**: Rejects mismatched headers.
- **Magic Bytes Verification**: Inspects leading file signature bytes (e.g. `\x89PNG` or `\xff\xd8\xff`) to block executable scripts disguised as images.
- **10 MB File Limit**: File streams are validated on the fly; files exceeding 10 MB are rejected and aborted immediately.
- **Path Traversal Protection**: Uses cryptographic random UUIDs for all stored filenames.

---

## 👥 Approved System Roles & Seed Accounts

| Role | Portal URL | Identifier Format / Access |
|---|---|---|
| **Central Administrator** | `/admin/login` | Official Login ID: `admin@jansamadhanadmin` |
| **Electricity Nodal Officer** | `/officer/login` | Official Login ID: `abc@electricity` |
| **Water Supply Nodal Officer** | `/officer/login` | Official Login ID: `abc@watersupply` |
| **Public Works Nodal Officer** | `/officer/login` | Official Login ID: `abc@pwd` |
| **Municipal Corporation Officer** | `/officer/login` | Official Login ID: `abc@municipalcorporation` |
| **Municipal Drainage Officer** | `/officer/login` | Official Login ID: `abc@municipaldrainage` |
| **Citizens** | `/citizen/login` | 10-digit Indian Mobile Number + Password |

---

## 📜 License
JanSamadhan is released under the **MIT License**.

