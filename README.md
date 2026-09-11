# Inspectra Pro — Smart Asset Inspection, Defect Tracking & Compliance Monitoring System
### Enterprise Infrastructure Compliance & Fraud Prevention Architecture

![Inspection System Banner](https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=1200&h=300&fit=crop)

---

## 1. Executive Summary

**Inspectra Pro** is an enterprise-grade, digital field inspection, fraud prevention, and compliance monitoring platform engineered for national critical infrastructure (transit networks, solar power plants, water utilities, commercial high-rises, and highways).

The platform enforces **GPS Geofencing Anti-Fraud validation** to guarantee that audits occur on-site, pairs field observations with **modular Computer Vision defect detection**, tracks corrective remediation workflows, and generates **statutory audit reports in printable PDF and CSV formats**.

---

## 2. Complete Project Architecture

```
                          ┌────────────────────────────────────────────────────────┐
                          │                Client Layer (Multi-Platform)           │
                          │                                                        │
                          │  ┌───────────────────────┐  ┌────────────────────────┐  │
                          │  │ Web Admin Dashboard   │  │ Mobile Inspector App   │  │
                          │  │ (React + Vite + Leaflet│  │ (Flutter Codebase &     │  │
                          │  │  + Charts + PDF/CSV)  │  │  Interactive Simulator) │  │
                          │  └───────────┬───────────┘  └───────────┬────────────┘  │
                          └──────────────┼──────────────────────────┼──────────────┘
                                         │                          │
                                         │ RESTful APIs / JSON / JWT│
                                         ▼                          ▼
                          ┌────────────────────────────────────────────────────────┐
                          │               Node.js / Express API Gateway            │
                          │                                                        │
                          │  • Authentication (JWT + RBAC: Admin, Director,        │
                          │    Supervisor, Inspector)                              │
                          │  • Geofencing & GPS Haversine Engine                   │
                          │  • Non-Repudiation Audit Trail Logger                  │
                          │  • Evidence Upload & Storage Manager (Multer)          │
                          │  • Printable PDF & CSV Report Generator                │
                          │  • Modular AI Adapters (Computer Vision & Predictive)  │
                          └──────────────────────────┬─────────────────────────────┘
                                                     │
                                                     ▼
                          ┌────────────────────────────────────────────────────────┐
                          │                    Database Layer                      │
                          │                                                        │
                          │  • Dual DB Compatibility:                              │
                          │    - Embedded SQLite Persistent Store (Zero-Setup)     │
                          │    - PostgreSQL Production DDL Migration Scripts       │
                          │  • 13 Normalized Tables with Constraints & Indexes     │
                          │  • Pre-seeded SIH Demo Data (5 Inspectors, 5 Sites,   │
                          │    10 Inspections, Defects, Corrective Actions)        │
                          └────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Recommended & Implemented Technology | Description |
|---|---|---|
| **Mobile App** | **Flutter / Android** (`mobile-flutter/`) + **Interactive Web Simulator** | High-performance mobile app for field inspectors with offline caching, GPS locking, camera capture, and digital signatures. |
| **Backend API** | **Node.js + Express** (`backend/`) | Modular REST API with JWT security, RBAC middleware, Multer storage, and Haversine geofencing calculations. |
| **Database** | **PostgreSQL** (`database/postgres_schema.sql`) + **SQLite Engine** | Dual database engine: auto-seeding persistent SQLite for instant demo execution without external database dependencies, plus production PostgreSQL DDL. |
| **Web Dashboard**| **React.js + Vite** (`frontend/`) | Sleek dark-mode glassmorphic interface with real-time KPI metrics, Defect Kanban, and Inspection Dossier modals. |
| **Geospatial Maps**| **Leaflet & OpenStreetMap** | Real-time map rendering 5 infrastructure sites with circular geofence perimeters and live inspector telemetry pins. |
| **AI Modules** | **Modular AI Services** (`backend/src/services/aiService.js`) | Optional Computer Vision defect classification, predictive failure forecasting, and dynamic audit frequency recommendations. |

---

## 4. Pre-Seeded Realistic Infrastructure Demo Dataset

The application comes pre-loaded with realistic national infrastructure data:

### 5 Authorized Field Inspectors
1. **Rajesh Sharma** (`INSP-CIV-001`) — Civil & Structural Engineering • *On-Site at Delhi Metro*
2. **Priya Patel** (`INSP-ELE-002`) — Electrical Grids & Sub-Stations • *On-Site at Bhadla Solar*
3. **Amit Kumar** (`INSP-ENV-003`) — Water Systems & Environmental Safety • *Available in Bhopal*
4. **Sneha Reddy** (`INSP-MEC-004`) — HVAC & Fire Suppression • *On-Site at Bengaluru Tech Park*
5. **Vikram Singh** (`INSP-ROA-005`) — Highways & Heavy Bridges • *Available in Nagpur*

### 5 Strategic Infrastructure Sites
1. **Delhi Metro Central Terminal (Phase 2)** (`DEL-MET-02`) — 650m Geofence • New Delhi
2. **Bhadla Solar Power Ultra Park (Sector 4)** (`RAJ-SOL-04`) — 1200m Geofence • Rajasthan
3. **Smart City Water Treatment Plant** (`BHO-WTP-01`) — 500m Geofence • Bhopal, MP
4. **Cyber Innovation Tech Park (Block C)** (`BLR-TEC-03`) — 450m Geofence • Bengaluru, Karnataka
5. **National Highway NH-44 Overpass Bridge** (`NAG-NH-044`) — 800m Geofence • Nagpur, Maharashtra

### 10 Historical & Active Inspections
- **Completed (Passed)**: Delhi Metro quarterly inspection (92.5%), Bhadla Solar transformer audit (98.0%), Nagpur lighting check (95.0%).
- **Flagged / Defective**: NH-44 Pier P-14 concrete spalling (64.0%), Tech Park fire exit obstruction (84.0%).
- **Rejected (Fraud Protection)**: Tech Park basement sump inspection rejected because GPS telemetry was 1.45km outside the geofence perimeter!

---

## 5. Security & Role-Based Access Control (RBAC)

All accounts share the default demo password: `Password123!`

| Role | Demo Email | Permissions |
|---|---|---|
| **ADMIN** | `admin@inspection.gov.in` | Full system access, site creation, user management, immutable audit logs. |
| **DIRECTOR** | `director@inspection.gov.in` | Executive KPIs, compliance oversight, statutory report generation. |
| **SUPERVISOR** | `supervisor@inspection.gov.in` | Inspection approval/rejection, corrective action verification, remarks. |
| **INSPECTOR** | `rajesh.sharma@inspection.gov.in`| Field checklists, photo capture, GPS verification, defect logging. |

---

## 6. Complete REST API Catalog

| Method | Endpoint | Description | Auth Required | Roles |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Issues signed JWT token | None | All |
| `GET` | `/api/auth/me` | Fetches active profile & role | Bearer JWT | All |
| `GET` | `/api/sites` | List all 5 sites with geofences | Bearer JWT | All |
| `GET` | `/api/users/inspectors` | List 5 inspectors with live GPS | Bearer JWT | All |
| `GET` | `/api/inspections` | Query audits with filters & scores | Bearer JWT | All |
| `GET` | `/api/inspections/:id` | Full inspection dossier & checklist | Bearer JWT | All |
| `POST` | `/api/inspections/submit` | Submit audit with geofence check | Bearer JWT | Inspector/Admin |
| `PUT` | `/api/inspections/:id/status`| Approve/Reject/Flag audit | Bearer JWT | Supervisor/Admin/Director |
| `GET` | `/api/defects` | Query defects by severity | Bearer JWT | All |
| `PUT` | `/api/defects/:id/status` | Advance defect lifecycle | Bearer JWT | All |
| `GET` | `/api/corrective-actions` | List remediation workflows | Bearer JWT | All |
| `PUT` | `/api/corrective-actions/:id/verify`| Supervisor sign-off with proof | Bearer JWT | Supervisor/Admin |
| `POST` | `/api/gps/log` | Mobile telemetry breadcrumb | Bearer JWT | Inspector |
| `POST` | `/api/gps/verify-geofence` | Validate coordinates vs site origin | Bearer JWT | All |
| `GET` | `/api/reports/pdf/:id` | Printable compliance PDF report | Bearer JWT | All |
| `GET` | `/api/reports/export/csv` | Stream CSV ledger for audits/defects| Bearer JWT | All |
| `GET` | `/api/reports/compliance` | Statutory compliance summary | Bearer JWT | All |
| `GET` | `/api/audit-logs` | Immutable security audit ledger | Bearer JWT | Admin/Director |
| `POST` | `/api/ai/detect-defects` | Modular CV defect classification | Bearer JWT | All |
| `POST` | `/api/ai/predictive-maintenance`| Forecast asset failure risk | Bearer JWT | All |
| `POST` | `/api/ai/frequency-recommendations`| Dynamic audit interval optimizer | Bearer JWT | All |

---

## 7. Setup & Execution Instructions

### Prerequisites
- Node.js (v18+)
- (Optional) Flutter SDK 3.19+ for native Android build
- (Optional) Docker & Docker Compose

### Option A: Running with Node.js (Quick Local Start)

```bash
# 1. Start the Backend API Server
cd backend
npm install
node src/server.js
# Backend will start on http://localhost:5000 and auto-seed the database

# 2. In a new terminal, start the Web Dashboard
cd frontend
npm install
npm run dev
# Dashboard will start on http://localhost:3000 (or http://localhost:5173)
```

### Option B: Running with Docker Compose

```bash
docker-compose up --build
```
- Web Admin Dashboard: `http://localhost:3000`
- REST API Server: `http://localhost:5000`

---

## 8. Mobile Application Testing (For Judges & Evaluators)

1. **Embedded Interactive Simulator**: Open the Web Dashboard and click **"Mobile Inspector Sim"** in the top right navbar. This opens an interactive smartphone container featuring all **12 mobile screens** (Splash, Login, Dashboard, Site Selection, Geofence Lock, Checklist, Camera AI Scanner, Defect Logging, Digital Signature Summary, and Offline Queue).
2. **Native Flutter Codebase**: Located in `mobile-flutter/`. To compile for Android:
   ```bash
   cd mobile-flutter
   flutter pub get
   flutter run
   ```

---

## 9. Smart India Hackathon Demo Script

1. **Login as Admin**: Use the one-click demo button **System Admin** on the login page.
2. **Inspect Command Center**: Review KPI cards, 90.0% geofence accuracy, and the Defect Severity breakdown.
3. **Explore Live Map**: Click **"Live Map & GPS"** on the sidebar to view all 5 national sites with cyan circular geofence perimeters and green inspector markers.
4. **Inspect Fraud Protection**: Click on **"Inspections"** and view inspection `insp-rec-09` (Tech Park Sump) — notice how it was automatically **FLAGGED / REJECTED** because the GPS coordinates were 1.45km outside the site geofence!
5. **Review AI Defect Analysis**: Open `insp-rec-02` (NH-44 Overpass Pier 14), click **"Dossier"** to view concrete spalling photos and AI bounding box tags (`CONCRETE_SPALLING`, 94.2% confidence).
6. **Generate Official PDF**: Click **"Official PDF Report"** to view and print the compliance report.
7. **Test Mobile Inspector**: Click **"Mobile Inspector Sim"** in the navbar to test field GPS verification, pass/fail checklists, and digital signature submission.
