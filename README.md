# श्रमेव (Shramev) — Real-Time Hyperlocal Agricultural Labour Platform

[![Google Cloud Run Ready](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-blue?logo=google-cloud)](https://cloud.google.com/run)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase)](https://firebase.google.com)
[![Gemini API Powered](https://img.shields.io/badge/Gemini%20API-Voice%20Intake%20%26%20AI-8E75B2?logo=google)](https://ai.google.dev/)
[![React 19 & TypeScript](https://img.shields.io/badge/Stack-React%2019%20%2B%20TypeScript%20%2B%20Vite-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> **श्रमेव जयते — Empowering Rural Indian Agriculture with Voice-First Hyperlocal Dispatch.**

**Shramev (श्रमेव)** is an open-source, full-stack, mobile-first agricultural labor dispatch application purpose-built for rural Indian farmers and labor leaders (*Mukhiyas* / *Toli Pramukhs*). It bridges the critical 2–4 km village radius gap during harvest and sowing peaks, enabling instant booking, real-time 3D tractor/scooter tracking, multi-dialect voice requirements intake, and tamper-proof OTP-verified payouts.

---

## 🌾 Project Overview & Architecture

Rural Indian farm economics suffer from acute spot-labor friction: phone call delays, uncertain wages, language literacy barriers, and lack of verified transit tracking. **Shramev** solves this with an Uber/Rapido-inspired workflow designed with zero-literacy visual cues and conversational voice recognition:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Farmer & Labour Mobile Web               │
                  │   Voice Mic / Visual Icons / 3D Canvas / 45° Camera     │
                  └───────────────┬─────────────────────────┬───────────────┘
                                  │                         │
            (Multi-Dialect Audio) │                         │ (Auth & Live Sync)
                                  ▼                         ▼
                  ┌───────────────────────┐       ┌─────────────────────────┐
                  │ Express Server Proxy  │       │   Firebase Firestore    │
                  │  (Node / TypeScript)  │       │  & Firebase Auth (Web)  │
                  └───────────┬───────────┘       └─────────────┬───────────┘
                              │                                 │
                 (Resilient Fallback Ladder)                    │ (Owner-Bound RBAC)
                              ▼                                 ▼
                  ┌───────────────────────┐       ┌─────────────────────────┐
                  │ Google Gemini 3.7/3.1 │       │  firestore.rules Valid  │
                  │ Agricultural Voice AI │       │   /users, /jobs, /radar │
                  └───────────────────────┘       └─────────────────────────┘
```

---

## 🚀 Key Features

### 1. 🎙️ Voice-First Rural AI Intake (Gemini AI)
- Farmers can speak naturally in **Hindi, Bhojpuri, Maithili, Haryanvi, Punjabi, Marathi, Telugu, or English**.
- Example voice commands:
  - *"मुझे कल सुबह 6 बजे गेहूं काटने के लिए 5 मजदूर चाहिए, ₹450 मजदूरी दूंगा"*
  - *"धान रोपाई हेतु 8 लोगों की टोली चाहिए"*
- Gemini AI autonomously structures the unstructured audio into standardized job parameters (Task type, worker count, date/time, and daily wage per head).
- Built with a **3-tier resilient model fallback ladder** (`gemini-3.7-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-flash-latest`).

### 2. 🗺️ 3D Perspective Map & Radar (45° / Chase Cam / 2D)
- Hardware-accelerated 3D WebGL Canvas rendering rural farm plots, tube-wells, village roads, and canal routes.
- **Dynamic India Sun Lighting**: Real-time solar lighting simulation for Afternoon Sun, India Golden Hour Sunset (18:30 IST), and Night Dusk with active headlamps.
- **3D Vehicle Geometry & Turn-Banking**: Realistic 3D Mahindra red tractors, TVS yellow delivery scooters, and animated walking labor avatars.
- **Mobile-Responsive Map Visibility Toggle**: One-click collapsible map view (shrinks to a compact ~125px live radar HUD) to effortlessly view and fill the job post form on smartphones.

### 3. 👥 Dual-Role Hyperlocal Dashboards
- **Farmer Dashboard (किसान)**: Post requirements via voice or visual selector, review nearby labor leaders (*Tolis*), review live ETA distance, and initiate booking.
- **Labour Leader Dashboard (मजदूर मुखिया / टोली)**: Real-time broadcast radar, one-tap instant Accept/Decline, capacity toggle, and automatic OTP verification upon arrival.

### 4. 🔒 Enterprise Security & Verification
- **Zero-Insecure Defaults**: Strict, owner-bound `firestore.rules` preventing unauthorized role escalation or job tampering.
- **Tamper-Proof OTP Handshake**: Secure 4-digit arrival codes and verified cash/UPI payment status tracking.
- **Server-Side Secret Hygiene**: Gemini API keys and sensitive tokens are strictly proxied through server-side `/api/*` endpoints.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Motion |
| **Mapping & 3D** | Custom WebGL / 2.5D Canvas Engine, OSRM Routing Engine, Leaflet / Google Maps API |
| **Backend & Server** | Node.js, Express 4.21, `tsx`, `esbuild` CommonJS bundle (`dist/server.cjs`) |
| **AI & NLP** | Google Gen AI TypeScript SDK (`@google/genai`), Gemini 3.7 Flash & Fallbacks |
| **Database & Auth** | Google Cloud Firestore (NoSQL), Firebase Authentication (Google Sign-In & Federated) |
| **Deployment** | Google Cloud Run, Containerized Docker / Buildpack, Google Cloud Secret Manager |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory (copied from `.env.example`):

```bash
cp .env.example .env
```

### Configuration Keys

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Server-side Gemini API Key for multi-lingual agricultural voice processing. |
| `APP_URL` | **Yes** | Canonical hosting URL (e.g. `http://localhost:3000` or Cloud Run URL). |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Google Maps JavaScript API key (if using external satellite tiles). |
| `VITE_FIREBASE_API_KEY` | **Yes** | Firebase Web App API Key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase Auth domain (e.g., `<project-id>.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | Cloud Firestore / Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase Cloud Storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging ID. |
| `VITE_FIREBASE_APP_ID` | **Yes** | Firebase Web Application Client ID. |

---

## 💻 Local Setup & Development

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/shramev-rural-agri.git
cd shramev-rural-agri

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy template and fill your API keys
cp .env.example .env
```

### 3. Run Local Full-Stack Dev Server
```bash
# Starts Express backend and Vite frontend concurrently on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
# Runs TypeScript checks, compiles Vite frontend and builds single-file backend bundle
npm run build

# Start production server
npm run start
```

---

## 🔐 Firestore Security Rules

Deploy the included `firestore.rules` to enforce strict user data isolation and role boundaries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    match /jobs/{jobId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.farmerId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.farmerId == request.auth.uid ||
        (resource.data.status == "SEARCHING" && request.resource.data.status == "ACCEPTED") ||
        resource.data.assignedLeaderId == request.auth.uid
      );
      allow delete: if isAuthenticated() && resource.data.farmerId == request.auth.uid;
    }

    match /bookings/{bookingId} {
      allow read, write: if isAuthenticated() && (
        resource == null ||
        resource.data.farmerId == request.auth.uid ||
        resource.data.labourLeaderId == request.auth.uid ||
        request.resource.data.farmerId == request.auth.uid ||
        request.resource.data.labourLeaderId == request.auth.uid
      );
    }
  }
}
```

---

## ☁️ Google Cloud Run Deployment Guide

### 1. Enable Required Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  generativelanguage.googleapis.com
```

### 2. Provision Secrets in Secret Manager
```bash
# Create and store your Gemini API Key
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run default service account permission to access the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy Service to Cloud Run
```bash
gcloud run deploy shramev-app \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 4. Apply Verification Label
```bash
gcloud run services update shramev-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region asia-southeast1
```

---

## 📁 Repository Structure

```
├── firebase-blueprint.json       # Canonical Firestore entity schema definition
├── firestore.rules               # Production owner-bound Firestore security rules
├── .env.example                  # Sanitized environment configuration template
├── .gitignore                    # Strict exclusion rules for .env*, credentials, and keys
├── metadata.json                 # Platform capabilities & frame permissions
├── package.json                  # Full-stack dependencies and unified build scripts
├── server.ts                     # Express backend proxy with Gemini fallback ladder
├── vite.config.ts                # Tailwind CSS & React build configuration
├── src/
│   ├── components/
│   │   ├── InteractiveMap.tsx    # 3D WebGL Canvas, 45° Camera, vehicle models & toggle
│   │   ├── LabourDashboard.tsx   # Labour Leader job broadcast & dispatch cockpit
│   │   ├── VoiceAssistantModal.tsx # Multi-lingual rural voice intake modal
│   │   ├── FarmerPostJobForm.tsx # Responsive farmer job posting workflow
│   │   ├── BookingTracker.tsx    # Live booking & arrival OTP verification HUD
│   │   ├── JobHistory.tsx        # Historical job audits & payment vouchers
│   │   ├── AuthModal.tsx         # Google / Federated SMS phone auth
│   │   └── InAppCallModal.tsx    # Direct in-app simulated cellular call bridge
│   ├── firebase.ts               # Firebase SDK client initialization (Env & JSON fallback)
│   ├── types.ts                  # Shared TypeScript schemas & enums
│   ├── App.tsx                   # Master orchestration, state sync & farmer dashboard
│   └── main.tsx                  # Client entrypoint
└── README.md                     # Complete deployment & architecture guide
```

---

## 🛡️ Pre-Push Security Check & Secret Scanning Guide

Before performing `git push origin main`, run this local verification checklist to guarantee zero credential leakage:

### 1. Verify Ignored Secret Files
Confirm that your local `.env` and credential files are untracked:
```bash
# Check that no .env files are staged in git
git status

# Verify that .env is recognized as ignored
git status --ignored | grep .env
```

### 2. Search for Hardcoded API Keys & Tokens
Run a repository-wide grep scan for common API key signatures:
```bash
# Scan for Google / Firebase API Key strings
git diff HEAD | grep -E "(AIzaSy[0-9A-Za-z_-]{33})"

# Scan for generic private keys or hardcoded secret variables
git diff HEAD | grep -iE "(api_key|secret_key|private_key|password)\s*[:=]\s*['\"][^'\"]{10,}['\"]"
```

### 3. Optional: Run Automated Secret Scanners
```bash
# If using Gitleaks (https://github.com/gitleaks/gitleaks)
gitleaks detect --verbose

# Or using TruffleHog (https://github.com/trufflesecurity/trufflehog)
trufflehog git file://. --since-commit HEAD
```

### 4. Perform Clean Git Push
```bash
git add .
git commit -m "feat: complete Shramev agricultural dispatch platform with secure architecture"
git push origin main
```

---

## 🧪 Verification & Test Walkthrough

Follow these manual steps to test all critical workflows:

1. **Voice Input Simulation**:
   - Tap the **"🎤 बोलकर काम दर्ज करें (Voice AI)"** button.
   - Select one of the rapid preset dialect queries (e.g., *"5 मजदूर गेहूं कटाई ₹450"*).
   - Verify Gemini AI parses and fills the job details instantly.
2. **Interactive 3D Map & Camera**:
   - In the Farmer tab, pan across the 3D village map.
   - Switch camera angles between **45° 3D**, **फॉलो (Chase Cam)**, **60°**, and **2D**.
   - Change sun lighting to **सूर्यास्त (Sunset)** and observe real-time shadows and amber lighting.
3. **Map Collapse / Mobile Responsiveness**:
   - Tap **"मैप छिपाएं / Form देखें"** in the top-left of the map.
   - Verify the map contracts smoothly into an active status pill, bringing the job creation form into clear view.
   - Tap **"🗺️ मैप बड़ा करें"** to restore the 3D viewport.
4. **Live Job Dispatch & Acceptance**:
   - Submit a job. Switch to the **"मजदूर टोली"** tab.
   - Tap **"स्वीकार करें (Accept)"** on the incoming request.
   - Verify active route tracking displays live ETA and 3D vehicle transit progress.

---

## 📄 License

Distributed under the **MIT License**. Created with ❤️ for Indian Agriculture and Rural Communities.
