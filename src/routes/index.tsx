import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  DAYS,
  LANGUAGES,
  SLOTS,
  TREATMENTS,
  addAppointment,
  deleteAppointment,
  statusClasses,
  statusLabel,
  useAppointments,
  type LanguageCode,
} from "@/lib/clinic-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Schedule — HMIS Appointment Manager" },
      {
        name: "description",
        content: "Manage hospital appointments with real-time Firebase sync.",
      },
      { property: "og:title", content: "Schedule — HMIS Appointment Manager" },
      {
        property: "og:description",
        content: "Manage hospital appointments with real-time Firebase sync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const appointments = useAppointments();
  const [day, setDay] = useState<string>(DAYS[0] ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [patient, setPatient] = useState("");
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState<string>(SLOTS[4] ?? "10:00");
  const [treatment, setTreatment] = useState<string>(TREATMENTS[0] ?? "Check-up");
  const [language, setLanguage] = useState<LanguageCode>("EN");
  const [saving, setSaving] = useState(false);

  const dayAppts = appointments.filter((a) => a.day === day);
  const confirmed = dayAppts.filter((a) => a.status === "delivered").length;

  async function confirmBooking() {
    if (!patient.trim() || saving) return;
    setSaving(true);
    try {
      await addAppointment({
        patient: patient.trim(),
        phone: phone.trim() || "+00 000 000 000",
        day,
        time: slot,
        treatment,
        language,
      });
      setPatient("");
      setPhone("");
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteAppointment(id);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <PhoneShell>
      <div className="px-5 pb-2 pt-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-signal">Today · {DAYS[0]}</div>
            <div className="mt-1 font-display text-3xl font-black leading-none tracking-tight">
              Schedule
            </div>
          </div>
          <div className="text-right text-[10px] text-frost/50">
            {dayAppts.length} appts
            <br />
            <span className="text-ok">{confirmed} confirmed</span>
          </div>
        </div>
      </div>

      {/* Day picker */}
      <div className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {DAYS.map((d, idx) => {
          const parts = d.split(" ");
          const name = parts[0];
          const num = parts[1];
          const active = d === day;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-xl px-3 py-2 text-center transition-all ${active ? "bg-signal scale-105" : "bg-frost/10"}`}
            >
              <div className={`text-[9px] uppercase ${active ? "text-frost/80" : "text-frost/50"}`}>
                {idx === 0 ? "TODAY" : name}
              </div>
              <div className="font-display font-bold">{num}</div>
            </button>
          );
        })}
      </div>

      {/* Appointment list */}
      <div className="mt-3 flex flex-col gap-2 px-4">
        {dayAppts.length === 0 && (
          <div className="rounded-2xl bg-frost/8 p-6 text-center ring-1 ring-frost/10">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-[11px] font-semibold text-frost/60">No appointments for {day}</div>
            <div className="text-[10px] text-frost/40 mt-1">Tap + New appointment to add one</div>
          </div>
        )}
        {dayAppts.map((a, i) => (
          <div key={a.id} className="relative">
            <Link
              to="/reminders/$id"
              params={{ id: a.id }}
              className="rise block rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10 pr-10"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-bold">{a.patient}</div>
                <div className="text-[10px] text-frost/60">{a.time}</div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-[10px] text-frost/50">
                  {a.treatment} · {a.language}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${statusClasses(a.status)}`}
                >
                  {statusLabel[a.status]}
                </span>
              </div>
            </Link>
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, a.id)}
              disabled={deleting === a.id}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-frost/10 text-frost/40 transition-colors hover:bg-signal/20 hover:text-signal active:scale-90"
              aria-label="Delete appointment"
            >
              {deleting === a.id ? (
                <span className="size-3 animate-spin rounded-full border border-signal border-t-transparent" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* New appointment button */}
      <div className="mt-auto px-4 pb-3 pt-3">
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full rounded-2xl bg-signal py-3 font-display text-sm font-bold text-frost active:scale-95 transition-transform"
        >
          + New appointment
        </button>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-ink/60 backdrop-blur-sm">
          <button
            aria-label="Close"
            className="flex-1"
            onClick={() => setSheetOpen(false)}
          />
          <div className="slide-sheet rounded-t-[26px] bg-frost p-4 text-ink shadow-[0_-10px_40px_rgba(10,18,20,0.5)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/20" />
            <div className="font-display text-lg font-black leading-none tracking-tight">
              New appointment
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <label className="col-span-2 rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Patient name *</div>
                <input
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  className="w-full bg-transparent text-[11px] outline-none placeholder:text-ink/30"
                />
              </label>
              <label className="rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Phone</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="w-full bg-transparent text-[11px] outline-none placeholder:text-ink/30"
                />
              </label>
              <label className="rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Slot · {day.split(" ").slice(0, 2).join(" ")}</div>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full bg-transparent text-[11px] outline-none"
                >
                  {SLOTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-2 rounded-xl bg-ink/5 p-2 text-[10px]">
              <div className="text-[8px] uppercase tracking-wider text-ink/40">Treatment</div>
              <select
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full bg-transparent text-[11px] outline-none mt-1"
              >
                {TREATMENTS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mt-2 rounded-xl bg-ink/5 p-2 text-[10px]">
              <div className="text-[8px] uppercase tracking-wider text-ink/40">
                Preferred language
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`rounded-full px-2 py-0.5 transition-all ${
                      language === l.code ? "bg-signal font-bold text-frost" : "bg-ink/8"
                    }`}
                  >
                    {l.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-ink/5 p-2 text-[10px]">
              <span className="text-[8px] uppercase tracking-wider text-ink/40">
                Voice reminder
              </span>
              <span className="font-bold text-ok">1 day before · auto</span>
            </div>

            <button
              onClick={confirmBooking}
              disabled={!patient.trim() || saving}
              className="relative mt-3 w-full overflow-hidden rounded-2xl bg-signal py-3 font-display text-sm font-bold text-frost disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-frost border-t-transparent" />
                  Saving…
                </span>
              ) : (
                <>
                  <span className="sheen absolute inset-y-0 w-1/3 bg-frost/30" />
                  Confirm booking
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
