# HMIS — Hospital Management Information System
### Digital Appointment Scheduling & Automated Voice Reminder System

---

## Problem Statement

The current dental/hospital appointment process relies on **paper-based scheduling and manual reminder calls**, making appointment management time-consuming and heavily dependent on clinic staff.

After an appointment is recorded, staff must manually contact patients **one day before** the appointment. This leads to:

- ❌ **Missed reminders** — staff may forget or run out of time
- ❌ **Inconsistent follow-up** — no standardised retry process
- ❌ **Communication barriers** — no support for patient's preferred language
- ❌ **No visibility** — no way to see reminder status at a glance

---

## Our Solution

**HMIS** is a digital appointment scheduling system that:

1. **Manages appointment slots** — staff can book, view, and delete appointments through a clean mobile-first interface
2. **Triggers automated voice reminders** — one day before each scheduled appointment, a voice call is automatically placed to the patient
3. **Supports multilingual reminders** — reminders are made in the patient's preferred language (English, Spanish, Mandarin, Portuguese, Hindi)
4. **Tracks reminder status in real-time** — every appointment shows its current state (Scheduled → Calling → Delivered / Retrying / Failed)
5. **Handles retries automatically** — if a call fails, the system retries up to a configurable number of times with configurable gaps
6. **Exception handling** — failed reminders are flagged for manual staff follow-up before end of day

---

## Features

### 📅 Schedule
- View appointments by day (today + next 4 days, dynamically generated)
- Add new appointments with patient name, phone, time slot, treatment, and preferred language
- Delete appointments with immediate Firestore sync
- Real-time data — survives page refresh

### 🔔 Reminders
- Monitor all voice reminders in one view
- Filter by status: All / Delivered / Retrying / Failed
- Tap any reminder to see full call attempt log

### 👥 Patients
- Unique patient directory built from appointment data
- Shows phone number and preferred reminder language per patient

### ⚙️ Settings
- Toggle automatic voice reminders on/off
- Configure retry attempts (1–5)
- Configure gap between retries (10–120 min)
- Set fallback language for patients with no preference
- Staff sign-in / sign-out

### 🔐 Authentication
- Firebase Auth — email/password + Google Sign-In
- Password reset via email link
- Staff-only access to the system

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   HMIS Web App                          │
│              (TanStack Start + React)                   │
├──────────────┬──────────────────┬───────────────────────┤
│  Schedule    │   Reminders      │   Patients / Settings  │
│  (index.tsx) │ (reminders/*.tsx)│  (patients/settings)   │
└──────────────┴──────────────────┴───────────────────────┘
        │                │
        ▼                ▼
┌───────────────────────────────┐
│         Firebase              │
│  ┌────────────┐  ┌─────────┐  │
│  │ Firestore  │  │  Auth   │  │
│  │ /appts     │  │ Email + │  │
│  │ real-time  │  │ Google  │  │
│  └────────────┘  └─────────┘  │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│        CI/CD Pipeline         │
│  VS Code → Git Push           │
│  → GitHub Actions (build)     │
│  → Netlify (deploy)           │
│  Live in ~30 seconds          │
└───────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React, SSR) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Hosting | Netlify (Serverless Functions) |
| CI/CD | GitHub Actions |
| Build | Vite + Nitro (netlify preset) |

---

## Reminder Status Flow

```
Appointment Booked
      │
      ▼
  SCHEDULED ──(1 day before)──▶ CALLING
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                DELIVERED       NO ANSWER        FAILED
                (answered +    (retries left)  (max retries
                confirmed)          │           reached)
                                    ▼               │
                                RETRYING      Staff Follow-up
                                    │
                              (retry after gap)
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Firebase project with Firestore + Auth enabled

### Setup

```sh
git clone https://github.com/rakshithamuniraj5-lgtm/HMIS-project.git
cd HMIS-project
npm install
```

Copy the example env file and fill in your Firebase credentials:

```sh
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

```sh
npm run dev
```

---

## Deployment

This project deploys automatically via **GitHub Actions** on every push to `main`:

```
git push origin main
  → GitHub Actions: npm ci + npm run build (NITRO_PRESET=netlify)
  → Firebase env vars injected from GitHub Secrets
  → Netlify deploys dist/ + .netlify/functions-internal/
  → Live in ~30 seconds
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify site ID |
| `VITE_FIREBASE_*` | All 6 Firebase config values |

---

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx          # App shell, fonts, global meta
│   ├── index.tsx           # Schedule page (main screen)
│   ├── reminders.index.tsx # All reminders monitor
│   ├── reminders.$id.tsx   # Reminder detail + retry
│   ├── patients.tsx        # Patient directory
│   ├── settings.tsx        # System settings + sign out
│   ├── auth.tsx            # Sign in / Sign up / Forgot password
│   └── reset-password.tsx  # Email link password reset
├── lib/
│   ├── firebase.ts         # Firebase app initialisation
│   ├── clinic-store.ts     # Firestore real-time state store
│   ├── auth-service.ts     # Auth functions (sign in/up/out)
│   └── staff-profile.ts    # Per-user settings in Firestore
└── components/
    ├── PhoneShell.tsx       # Mobile UI shell + nav tabs
    └── ui/                  # Radix UI component library
```

---

## Built with

- [TanStack Start](https://tanstack.com/start) — Full-stack React framework
- [Firebase](https://firebase.google.com) — Realtime database + auth
- [Tailwind CSS](https://tailwindcss.com) — Utility-first styling
- [Netlify](https://netlify.com) — Hosting with serverless functions
- [GitHub Actions](https://github.com/features/actions) — CI/CD pipeline
