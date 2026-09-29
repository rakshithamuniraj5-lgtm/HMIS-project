import { useSyncExternalStore } from "react";

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

let appointments: Appointment[] = [
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

export function useAppointments() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function addAppointment(input: {
  patient: string;
  phone: string;
  day: string;
  time: string;
  treatment: string;
  language: LanguageCode;
}) {
  const id = String(4840 + appointments.length * 3);
  appointments.push({
    id,
    ...input,
    status: "scheduled",
    attempts: [],
    maxAttempts: 3,
  });
  emit();
  return id;
}

export function retryReminder(id: string) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return;
  appt.attempts = [...appt.attempts, { at: now(), outcome: "manual retry — dialing" }];
  appt.status = "calling";
  emit();

  setTimeout(() => {
    const target = appointments.find((a) => a.id === id);
    if (!target) return;
    const last = target.attempts[target.attempts.length - 1];
    if (!last) return;
    const success = target.attempts.length % 2 === 1;
    target.attempts = [
      ...target.attempts.slice(0, -1),
      {
        at: last.at,
        outcome: success ? "answered — confirmed" : "no answer",
      },
    ];
    if (success) target.status = "delivered";
    else target.status = target.attempts.length >= target.maxAttempts ? "failed" : "retrying";
    emit();
  }, 2200);
}

export function triggerReminder(id: string) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return;
  appt.status = "retrying";
  appt.attempts = [...appt.attempts, { at: now(), outcome: "queued — fires 1 day before" }];
  emit();
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
