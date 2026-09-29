import { useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
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
  day: string; // e.g. "Tue 04"
  time: string;
  treatment: string;
  language: LanguageCode;
  status: ReminderStatus;
  attempts: CallAttempt[];
  maxAttempts: number;
  createdAt?: unknown;
};

export type LanguageCode = "EN" | "ES" | "ZH" | "PT" | "HI";

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "EN", label: "English" },
  { code: "ES", label: "Español" },
  { code: "ZH", label: "中文" },
  { code: "PT", label: "Português" },
  { code: "HI", label: "हिन्दी" },
];

export const DAYS = ["Mon 03", "Tue 04", "Wed 05", "Thu 06", "Fri 07"];

export const SLOTS = [
  "09:00",
  "09:45",
  "10:00",
  "10:30",
  "11:30",
  "13:00",
  "14:15",
  "15:00",
  "16:30",
];

export const TREATMENTS = ["Check-up", "Scaling", "Crown fit", "Filling", "Root canal", "New exam"];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: "4818",
    patient: "Amara Okoye",
    phone: "+44 7700 900412",
    day: "Tue 04",
    time: "10:00",
    treatment: "Crown fit",
    language: "EN",
    status: "delivered",
    attempts: [{ at: "11:04", outcome: "answered — confirmed, 32s" }],
    maxAttempts: 3,
  },
  {
    id: "4821",
    patient: "Diego Ramírez",
    phone: "+34 611 22 33 44",
    day: "Tue 04",
    time: "11:30",
    treatment: "Scaling",
    language: "ES",
    status: "calling",
    attempts: [
      { at: "10:58", outcome: "busy, no answer" },
      { at: "11:00", outcome: "busy, no answer" },
      { at: "11:02", outcome: "dialing" },
    ],
    maxAttempts: 3,
  },
  {
    id: "4824",
    patient: "Mei-Ling Chen",
    phone: "+86 138 0013 8000",
    day: "Tue 04",
    time: "14:15",
    treatment: "New exam",
    language: "ZH",
    status: "failed",
    attempts: [
      { at: "08:12", outcome: "no answer" },
      { at: "09:05", outcome: "no answer" },
      { at: "09:40", outcome: "voicemail — max retries reached" },
    ],
    maxAttempts: 3,
  },
  {
    id: "4827",
    patient: "Tomás Silva",
    phone: "+351 912 345 678",
    day: "Wed 05",
    time: "09:45",
    treatment: "Filling",
    language: "PT",
    status: "retrying",
    attempts: [{ at: "08:30", outcome: "no answer — retry queued" }],
    maxAttempts: 3,
  },
  {
    id: "4830",
    patient: "Rajesh Menon",
    phone: "+91 98200 11223",
    day: "Wed 05",
    time: "13:00",
    treatment: "Root canal",
    language: "HI",
    status: "scheduled",
    attempts: [],
    maxAttempts: 3,
  },
  {
    id: "4833",
    patient: "Nadia Belkacem",
    phone: "+33 6 11 22 33 44",
    day: "Thu 06",
    time: "16:30",
    treatment: "Check-up",
    language: "EN",
    status: "scheduled",
    attempts: [],
    maxAttempts: 3,
  },
];

let appointments: Appointment[] = [...SEED_APPOINTMENTS];
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

// Setup real-time Firestore sync if configured
let firestoreInitialized = false;
function initFirestoreSync() {
  if (typeof window === "undefined" || !isFirebaseConfigured || firestoreInitialized) return;
  firestoreInitialized = true;

  try {
    const colRef = collection(db, "appointments");
    onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
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
            });
          });
          appointments = remoteList;
          emit();
        } else {
          // If Firestore collection is empty, seed it with default appointments
          SEED_APPOINTMENTS.forEach((seed) => {
            setDoc(doc(db, "appointments", seed.id), {
              ...seed,
              createdAt: serverTimestamp(),
            }).catch(() => {});
          });
        }
      },
      (err) => {
        console.warn("[Firestore] Appointments real-time sync:", err.message);
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

export async function addAppointment(input: {
  patient: string;
  phone: string;
  day: string;
  time: string;
  treatment: string;
  language: LanguageCode;
}) {
  const id = String(4840 + appointments.length * 3);
  const newAppt: Appointment = {
    id,
    ...input,
    status: "scheduled",
    attempts: [],
    maxAttempts: 3,
  };

  appointments.push(newAppt);
  emit();

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "appointments", id), {
        ...newAppt,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[Firestore] addAppointment error:", err);
    }
  }

  return id;
}

export async function retryReminder(id: string) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return;

  const newAttempts = [...appt.attempts, { at: now(), outcome: "manual retry — dialing" }];
  appt.attempts = newAttempts;
  appt.status = "calling";
  emit();

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "appointments", id), {
        attempts: newAttempts,
        status: "calling",
      });
    } catch (err) {
      console.warn("[Firestore] retryReminder update error:", err);
    }
  }

  setTimeout(async () => {
    const target = appointments.find((a) => a.id === id);
    if (!target) return;
    const last = target.attempts[target.attempts.length - 1];
    if (!last) return;
    const success = target.attempts.length % 2 === 1;
    const updatedAttempts = [
      ...target.attempts.slice(0, -1),
      {
        at: last.at,
        outcome: success ? "answered — confirmed" : "no answer",
      },
    ];
    target.attempts = updatedAttempts;
    if (success) target.status = "delivered";
    else target.status = target.attempts.length >= target.maxAttempts ? "failed" : "retrying";
    emit();

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, "appointments", id), {
          attempts: updatedAttempts,
          status: target.status,
        });
      } catch (err) {
        console.warn("[Firestore] retry outcome update error:", err);
      }
    }
  }, 2200);
}

export async function triggerReminder(id: string) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return;

  const newAttempts = [...appt.attempts, { at: now(), outcome: "queued — fires 1 day before" }];
  appt.status = "retrying";
  appt.attempts = newAttempts;
  emit();

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: "retrying",
        attempts: newAttempts,
      });
    } catch (err) {
      console.warn("[Firestore] triggerReminder error:", err);
    }
  }
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
