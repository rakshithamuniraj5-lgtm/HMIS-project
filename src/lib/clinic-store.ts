import { useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export type ReminderStatus = "scheduled" | "calling" | "delivered" | "failed" | "retrying";

export type CallAttempt = {
  at: string;
  outcome: string;
};

export type Appointment = {
  id: string;
  patient: string;
  phone: string;
  day: string; // e.g. "Tue 04 Oct"
  time: string;
  treatment: string;
  language: LanguageCode;
  status: ReminderStatus;
  attempts: CallAttempt[];
  maxAttempts: number;
  createdAt?: unknown;
};

export type LanguageCode = "EN" | "KN" | "HI" | "ES" | "ZH" | "PT";

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "EN", label: "English" },
  { code: "KN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "HI", label: "हिन्दी (Hindi)" },
  { code: "ES", label: "Español" },
  { code: "ZH", label: "中文" },
  { code: "PT", label: "Português" },
];

/** Generate a 5-day window starting from today */
export function generateDays(): string[] {
  const days: string[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, "0");
    const month = monthNames[d.getMonth()];
    days.push(`${dayName} ${dayNum} ${month}`);
  }
  return days;
}

export const DAYS = generateDays();

export const SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export const TREATMENTS = [
  "Check-up",
  "Scaling",
  "Crown fit",
  "Filling",
  "Root canal",
  "New exam",
  "Teeth whitening",
  "Extraction",
  "Braces adjustment",
  "Consultation",
];

// ── In-memory store ──────────────────────────────────────────────────────────
let appointments: Appointment[] = [];
const listeners = new Set<() => void>();

function emit() {
  appointments = [...appointments];
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return appointments;
}

// ── Firestore real-time sync ─────────────────────────────────────────────────
let firestoreInitialized = false;
function initFirestoreSync() {
  if (typeof window === "undefined" || !isFirebaseConfigured || firestoreInitialized) return;
  firestoreInitialized = true;

  try {
    const colRef = collection(db, "appointments");
    onSnapshot(
      colRef,
      (snapshot) => {
        const remoteList: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteList.push({
            id: docSnap.id,
            patient: (data["patient"] as string) || "",
            phone: (data["phone"] as string) || "",
            day: (data["day"] as string) || "",
            time: (data["time"] as string) || "",
            treatment: (data["treatment"] as string) || "",
            language: (data["language"] as LanguageCode) || "EN",
            status: (data["status"] as ReminderStatus) || "scheduled",
            attempts: Array.isArray(data["attempts"]) ? (data["attempts"] as CallAttempt[]) : [],
            maxAttempts: typeof data["maxAttempts"] === "number" ? (data["maxAttempts"] as number) : 3,
            createdAt: data["createdAt"],
          });
        });
        // Sort by day then time
        remoteList.sort((a, b) => {
          if (a.day !== b.day) return a.day.localeCompare(b.day);
          return a.time.localeCompare(b.time);
        });
        appointments = remoteList;
        emit();
      },
      (err) => {
        console.warn("[Firestore] Appointments real-time sync error:", err.message);
      }
    );
  } catch (err) {
    console.warn("[Firestore] Unable to connect real-time listener:", err);
  }
}

export function useAppointments() {
  initFirestoreSync();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Generate a unique ID based on timestamp + random suffix */
function generateId(): string {
  return `appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function addAppointment(input: {
  patient: string;
  phone: string;
  day: string;
  time: string;
  treatment: string;
  language: LanguageCode;
}): Promise<string> {
  const id = generateId();
  const newAppt: Appointment = {
    id,
    ...input,
    status: "scheduled",
    attempts: [],
    maxAttempts: 3,
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "appointments", id), {
        ...newAppt,
        createdAt: serverTimestamp(),
      });
      // onSnapshot will update the local state automatically
    } catch (err) {
      console.error("[Firestore] addAppointment error:", err);
      // Optimistic local update as fallback
      appointments = [...appointments, newAppt];
      emit();
    }
  } else {
    // Offline fallback — local only
    appointments = [...appointments, newAppt];
    emit();
  }

  return id;
}

export async function deleteAppointment(id: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, "appointments", id));
      // onSnapshot will update local state
    } catch (err) {
      console.error("[Firestore] deleteAppointment error:", err);
      appointments = appointments.filter((a) => a.id !== id);
      emit();
    }
  } else {
    appointments = appointments.filter((a) => a.id !== id);
    emit();
  }
}

export async function retryReminder(id: string, speakAloud = false) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return;

  const { executeVoiceCall } = await import("./voice-reminder");
  await executeVoiceCall(appt, { speakAloud });
}

export async function triggerReminder(id: string) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return;

  const newAttempts = [...appt.attempts, { at: now(), outcome: "queued — auto-fires 1 day before" }];
  appt.status = "scheduled";
  appt.attempts = newAttempts;
  emit();

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: "scheduled",
        attempts: newAttempts,
      });
    } catch (err) {
      console.warn("[Firestore] triggerReminder error:", err);
    }
  }
}

/**
 * Automated 1-Day Before Workflow:
 * Finds all appointments scheduled for tomorrow (DAYS[1]) that are "scheduled" or "retrying",
 * and executes the automated multilingual voice reminder call for each patient.
 */
export async function trigger1DayAutomatedWorkflow(speakAloud = false): Promise<{
  totalEligible: number;
  completed: number;
}> {
  const tomorrow = DAYS[1];
  const eligible = appointments.filter(
    (a) => a.day === tomorrow && (a.status === "scheduled" || a.status === "retrying")
  );

  if (eligible.length === 0) {
    return { totalEligible: 0, completed: 0 };
  }

  const { executeVoiceCall } = await import("./voice-reminder");
  let completedCount = 0;

  for (const appt of eligible) {
    await executeVoiceCall(appt, { speakAloud });
    completedCount++;
  }

  return { totalEligible: eligible.length, completed: completedCount };
}

export const statusLabel: Record<ReminderStatus, string> = {
  scheduled: "Scheduled",
  calling: "Calling",
  delivered: "Delivered",
  failed: "Failed",
  retrying: "Retrying",
};

export function statusClasses(status: ReminderStatus) {
  switch (status) {
    case "delivered":
      return "bg-ok/20 text-ok";
    case "calling":
    case "retrying":
      return "bg-warn/20 text-warn";
    case "failed":
      return "bg-signal/20 text-signal";
    default:
      return "bg-frost/10 text-frost/50";
  }
}
