# TwinCare – Personal Health Digital Twin

A hackathon-ready full-stack health app that models your body systems, tracks lab reports and check-ins, and uses AI to give grounded, safe health insights.

## Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on v24)
- npm 10+

### 2. Install dependencies
```bash
cd twincare
npm install
```

### 3. Configure environment
```bash
# Copy the example and fill in your values
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-to-a-long-random-string"
ANTHROPIC_API_KEY="sk-ant-..."        # Required for AI assistant and lab extraction
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> The app works without `ANTHROPIC_API_KEY` – you just won't have AI extraction or the assistant.

### 4. Set up the database
```bash
npm run db:push     # Creates SQLite tables from schema
```

### 5. Seed demo data
```bash
npm run seed
```

This creates a demo account with 90 days of realistic health data:
- **Email:** `demo@twincare.health`  
- **Password:** `demo1234`

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## What Works (All 6 Phases)

### Phase 1 – Profile & Baseline
- Onboarding with optional name, age, sex, height, weight, blood group, conditions, medicines, allergies
- Family profiles (multiple profiles per account, profile switcher in sidebar)
- Emergency card page with QR code
- Consent screen at registration, export and delete data in Settings

### Phase 2 – Body Twin Dashboard
- Interactive SVG body diagram with 9 clickable, color-coded systems
- Rules engine (pure TypeScript, no LLM) maps lab values, conditions, check-ins to Normal / Mild / Needs attention
- "Why this status?" explainability panel for every system
- Actionable tips per system
- Trend detection (rising HR + falling sleep, etc.)

### Phase 3 – Lab Reports
- Upload PDF or image lab report
- Claude AI extracts values into an editable table (testName, value, unit, flag)
- Flags against age/sex reference ranges (High / Low / Normal / Borderline)
- Trend chart per test using Recharts
- Saving a report immediately updates the twin

### Phase 4 – Daily Check-in & Early Warnings
- 30-second check-in: sleep, mood, energy, water, symptoms, HR, BP, blood sugar
- Trend detection over 7-14 days (linear regression slope)
- Medicine tracker with active/inactive toggle
- Seeded demo with 20-year-old + mild anemia + declining sleep over 3 months

### Phase 5 – AI Assistant
- Chat interface grounded in the user's profile + lab values + check-ins + medicine info
- Red-flag detection BEFORE the LLM: emergency keywords → "Seek urgent care" with 112/108 numbers
- Self-harm keywords → supportive response with iCall/Vandrevala helplines
- Medicine info lookup from local JSON fallback + openFDA
- English and Hindi language toggle
- "Information, not a diagnosis" disclaimer on every response

### Phase 6 – Standout Features
- **What-if Simulator**: 6 scenarios (poor sleep, quit smoking, exercise, etc.) projected onto the body diagram
- **Doctor Summary**: printable one-page summary with conditions, meds, flagged systems, abnormal labs
- **Emergency Card**: color-coded card with QR code and India emergency numbers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite + Prisma v5 |
| Charts | Recharts |
| Body diagram | Inline SVG (custom) |
| LLM | Anthropic Claude 3.5 Haiku |
| PDF extraction | pdf-parse |
| Auth | bcryptjs + JWT (httpOnly cookie) |
| QR Code | qrcode |

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/login,register        # Auth pages
│   ├── (app)/dashboard              # Body twin
│   ├── (app)/reports                # Lab reports
│   ├── (app)/check-in               # Daily check-in
│   ├── (app)/medicines              # Medicine tracker
│   ├── (app)/assistant              # AI chat
│   ├── (app)/what-if                # What-if simulator
│   ├── (app)/doctor-summary         # Printable summary
│   ├── (app)/emergency-card         # Emergency card
│   ├── (app)/settings               # Profile & data
│   └── api/                         # All API routes
├── components/
│   ├── body/BodyDiagram.tsx          # SVG body diagram
│   ├── layout/Sidebar.tsx            # App navigation
│   └── AuthProvider.tsx              # Auth context
├── config/
│   ├── baselines.json               # Lab reference ranges
│   └── medicines.json               # 30 common medicines
├── lib/
│   ├── prisma.ts                    # Prisma singleton
│   ├── auth.ts                      # JWT + bcrypt helpers
│   ├── rulesEngine.ts               # Body system rules (no LLM)
│   └── useAuth.ts                   # Auth context type
└── types/index.ts                   # Shared TypeScript types
```

---

## Key Config Files

- **`src/config/baselines.json`** – All normal reference ranges for lab tests (editable)
- **`src/config/medicines.json`** – 30+ medicines with interactions, systems, warnings
- **`src/lib/rulesEngine.ts`** – All mapping rules from health data to system status

---

## Useful Scripts

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run seed         # Seed demo data
npm run db:push      # Sync schema to SQLite
npm run db:studio    # Open Prisma Studio GUI
```

---

## Limitations & Roadmap

### Current Limitations
- **No real-time wearable sync** – vitals are entered manually; Fitbit/Apple Health integration is future work
- **LLM responses are non-deterministic** – same question may give different answers
- **Image lab reports** – sent to Claude as a text description, not as a vision call (Haiku doesn't support vision in this integration); use PDF for best results
- **No email/magic link auth** – password-only for now
- **No push reminders** – medicine reminders are displayed in-app only, not as OS notifications
- **Single-user SQLite** – not production-scale; switch to PostgreSQL + connection pooling for multi-user deployment
- **What-if projections** – based on population research averages, not personalized ML models

### Roadmap
1. Apple Health / Google Fit / Fitbit API integration
2. Push notifications for medicine reminders (PWA service worker)
3. Vision-based lab report extraction (Claude 3 Opus or GPT-4V)
4. Time-limited shareable doctor links (token with expiry)
5. Future risk projection with per-user baseline trends
6. Punjabi language support (i18n framework)
7. PostgreSQL + multi-user production deployment guide
8. FHIR/HL7 export format for healthcare system integration
9. Family history risk scoring
10. Offline mode with IndexedDB sync

---

## Privacy & Security

- Passwords are bcrypt-hashed (12 rounds)
- JWT stored in httpOnly cookie (not accessible to JavaScript)
- Raw health data is never logged in production
- "Delete all my data" permanently removes the user record (cascades to all data)
- "Export my data" gives a full JSON export
- No third-party analytics or tracking
