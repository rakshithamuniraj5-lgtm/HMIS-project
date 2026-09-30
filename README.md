# HMIS — Hospital & Dental Appointment Management System
### Digital Appointment Scheduling with Automated Multilingual Voice Reminders (Kannada, Hindi, English)

[![Live App](https://img.shields.io/badge/Live%20App-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://lokapurdentalclinic.netlify.app/)
[![Database](https://img.shields.io/badge/Database-Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Voice](https://img.shields.io/badge/Voice%20Engine-Web%20Speech%20%2B%20Twilio-F22F46?style=for-the-badge&logo=twilio)](https://www.twilio.com/)

**Live Production URL:** [https://lokapurdentalclinic.netlify.app/](https://lokapurdentalclinic.netlify.app/)

---

## 📌 Problem Statement

Traditional dental and outpatient clinic workflows rely heavily on **paper-based appointment registers and manual reminder phone calls**. This process creates severe bottlenecks:

- ❌ **Time-Consuming & Staff Dependent:** Clinic staff must manually dial every patient one day before their scheduled visit.
- ❌ **Missed Reminders & High No-Show Rates:** Staff easily forget to call or run out of time during busy clinic hours.
- ❌ **Communication & Language Barriers:** Patients often prefer local regional languages (e.g., **Kannada / ಕನ್ನಡ**, **Hindi / हिन्दी**), which clinic staff may struggle to provide consistently.
- ❌ **Zero Visibility & Follow-up Gaps:** No systematic tracking of whether a call was answered, missed, or confirmed, leading to unconfirmed slots and lost clinic revenue.

---

## 💡 The Solution: HMIS Digital System

**HMIS** is an end-to-end digital scheduling and automated voice reminder solution built to resolve these exact challenges:

1. **Digital Slot Management:** Clean mobile-first UI for booking, viewing, and managing patient appointments with real-time Google Cloud Firestore synchronization.
2. **Automated 1-Day Before Trigger:** The system automatically identifies every appointment scheduled for tomorrow (24 hours prior) and triggers a personalized voice reminder.
3. **Multilingual Regional Voice Reminders:** Speaks fluently in the patient's preferred language:
   - **Kannada (ಕನ್ನಡ)**: *"ನಮಸ್ಕಾರ {patient}. ಇದು ಲೋಕಾಪುರ ಡೆಂಟಲ್ ಕ್ಲಿನಿಕ್‌ನಿಂದ ಸ್ವಯಂಚಾಲಿತ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಜ್ಞಾಪನೆ. ನಾಳೆ {day} ರಂದು {time} ಗಂಟೆಗೆ {treatment} ಗಾಗಿ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಗದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಲು 1 ಒತ್ತಿರಿ."*
   - **Hindi (हिन्दी)**: *"नमस्ते {patient}। यह लोकपुर डेंटल क्लिनिक से आपका स्वचालित अपॉइंटमेंट रिमाइंडर है..."*
   - **English (EN)**: *"Hello {patient}. This is an automated reminder from Lokapur Dental Clinic..."*
   - **Spanish (ES), Chinese (ZH), Portuguese (PT)** also supported.
4. **Keypad Confirmation (`DTMF [1]`):** Patients press `1` to confirm their appointment on their phone, automatically updating their status to **Delivered & Confirmed**.
5. **Smart Automated Retry Engine:** Unanswered calls or busy lines automatically retry up to 3 times with configurable gaps.
6. **Staff Escalation:** If all retry attempts fail, the system highlights the patient under **Failed Exceptions** for manual staff follow-up.

---

## 🚀 Key Features

### 📅 1. Interactive Schedule
- Dynamic 5-day calendar window (Today + next 4 days).
- Add new appointments with patient name, contact number, treatment type, and language preference.
- Persistent storage in Firebase Firestore (survives browser refresh and device switches).

### 🔔 2. Reminder Monitor & 1-Day Automated Workflow
- Dedicated **⚡ 1-Day Voice Reminder Workflow** card showing tomorrow's target date and pending call count.
- One-click **"Trigger 1-day reminders"** batch dialer.
- Real-time status filters: `All`, `Delivered`, `Retry`, `Failed`.

### 🎙️ 3. Voice Audio Engine & Telephony Integration
- **In-Browser Audio Simulator:** Uses Web Speech Synthesis with native BCP-47 voices (`kn-IN`, `hi-IN`, `en-US`) for instant testing and demonstration without telecom fees.
- **Real Telecom Calling (Twilio Voice API):** Serverless function (`/api/make-call`) triggers actual physical mobile phone ringing via cellular networks with Amazon Polly Indian neural voice (`Polly.Aditi`).

### 👥 4. Patient Directory
- Aggregates unique patient records from appointment history.
- Displays phone number and preferred reminder language for every patient.

### ⚙️ 5. Automation Settings & Staff Profiles
- Enable/disable automated 1-day voice reminders.
- Configure maximum retry attempts (1 to 5).
- Configure retry time gaps (10 to 120 minutes).
- Set default fallback language for patients without a recorded preference.
- Real-time Firestore connection health indicator.

### 🔐 6. Role-Based Authentication & Guard
- Secure starting page (`/auth`) powered by Firebase Auth.
- Protected route guards redirect unauthorized visitors to login.
- Email/Password login + Google Sign-In + Email password reset.

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 HMIS Frontend Application                   │
│                  (TanStack Start + React)                   │
├──────────────┬──────────────────┬───────────────────────────┤
│  Schedule    │  Reminder Engine │   Patients & Settings     │
│  (index.tsx) │ (reminders/*.tsx)│  (patients.tsx, settings) │
└──────────────┴──────────────────┴───────────────────────────┘
        │                │                       │
        ▼                ▼                       ▼
┌─────────────────────────────────┐   ┌───────────────────────┐
│     Google Firebase Services    │   │ Telecom Voice Gateway │
│  ┌──────────────┬────────────┐  │   │  (Twilio Voice API)   │
│  │  Firestore   │    Auth    │  │   │  ┌──────────────────┐ │
│  │ appointments │ email/pass │  │   │  │ Amazon Polly TTS │ │
│  │ real-time db │  sessions  │  │   │  │  (kn-IN, hi-IN)  │ │
│  └──────────────┴────────────┘  │   │  └──────────────────┘ │
└─────────────────────────────────┘   └───────────────────────┘
        │                                        ▲
        ▼                                        │
┌─────────────────────────────────────────────────────────────┐
│               Netlify Serverless Infrastructure             │
│        - Nitro Serverless Engine (Static + SSR)             │
│        - Netlify Function: /api/make-call.ts                │
│        - Automatic CI/CD on Git push to 'main'              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Reminder Lifecycle State Machine

```
   [ Appointment Booked ]
             │
             ▼
     ┌───────────────┐
     │   SCHEDULED   │
     └───────┬───────┘
             │ (1 Day Before Scheduled Date)
             ▼
     ┌───────────────┐
     │    CALLING    │◀─────────────────────────┐
     └───────┬───────┘                          │
             │                                  │
    ┌────────┼─────────────────┐                │
    │        │                 │                │
    ▼        ▼                 ▼                │
[Answered] [No Answer / Busy] [Max Retries Met] │
    │        │                 │                │
    ▼        ▼                 ▼                │
┌─────────┐ ┌─────────┐   ┌─────────┐           │
│DELIVERED│ │RETRYING │   │ FAILED  │           │
│(Conf. 1)│ └────┬────┘   └────┬────┘           │
└─────────┘      │             │                │
                 │             ▼                │
                 │      [Staff Manual Call]     │
                 │                              │
                 └──────(Wait Gap Interval)─────┘
```

---

## 🛠️ Tech Stack & Libraries

| Component | Technology | Description |
|:---|:---|:---|
| **Frontend Framework** | TanStack Start (React 19) | Full-stack SSR and client routing |
| **Language** | TypeScript | Strict type safety across client and server |
| **Styling** | Tailwind CSS v4 | Responsive mobile-first phone shell layout |
| **Database** | Firebase Firestore | Real-time document store for appointments |
| **Authentication** | Firebase Auth | Secure email/password and session handling |
| **Voice Synthesis** | Web Speech API + Polly | Native speech engine in Kannada, Hindi, English |
| **Telephony Gateway**| Twilio Voice API / TwiML | Real-time GSM phone dialing and keypad collection |
| **Hosting & CI/CD** | Netlify + GitHub Actions | Automated serverless deployments on push |

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/rakshithamuniraj5-lgtm/HMIS-project.git
cd HMIS-project
npm install
```

### 2. Environment Variables (.env)
Create a `.env` file in the root directory:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=dental-clinic-40a20.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dental-clinic-40a20
VITE_FIREBASE_STORAGE_BUCKET=dental-clinic-40a20.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=691532303172
VITE_FIREBASE_APP_ID=your-app-id

# Optional: Twilio Configuration (For real cellular phone ringing)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Directory Structure

```
hmis/
├── netlify/
│   └── functions/
│       └── make-call.ts           # Twilio telecom voice call serverless function
├── src/
│   ├── routes/
│   │   ├── __root.tsx             # Root document, meta tags, and fonts
│   │   ├── index.tsx              # Daily appointment schedule view
│   │   ├── reminders.index.tsx    # 1-day reminder monitor & batch runner
│   │   ├── reminders.$id.tsx      # Reminder detail, TTS playback, keypad log
│   │   ├── patients.tsx           # Aggregated patient directory
│   │   ├── settings.tsx           # Automation settings & staff profile
│   │   ├── auth.tsx               # Login & authentication guard screen
│   │   └── reset-password.tsx     # Password recovery workflow
│   ├── lib/
│   │   ├── clinic-store.ts        # Firestore real-time sync & state store
│   │   ├── voice-reminder.ts      # Multilingual speech engine (Kannada, Hindi, English)
│   │   ├── firebase.ts            # Firebase app initialization & fallbacks
│   │   ├── auth-service.ts        # Authentication methods
│   │   └── staff-profile.ts       # User preference persistence
│   └── components/
│       └── PhoneShell.tsx         # Mobile phone container & navigation tabs
├── firestore.rules                # Firestore security rules
├── firebase.json                  # Firebase CLI configuration
├── netlify.toml                   # Netlify build, redirect, and function settings
└── package.json                   # Project dependencies and build scripts
```

---

## 👨‍⚕️ Default Staff Credentials (Demo & Evaluation)

| Role | Email | Password |
|:---|:---|:---|
| **Clinic Administrator** | `admin@gmail.com` | `Admin@123` |

---

## 📄 License
This project is open-source and available under the **MIT License**.
