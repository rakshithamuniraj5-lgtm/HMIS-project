import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  DAYS,
  LANGUAGES,
  SLOTS,
  TREATMENTS,
  addAppointment,
  statusClasses,
  statusLabel,
  useAppointments,
  type LanguageCode,
} from "@/lib/clinic-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Schedule — Meridian Dental Reminder App" },
      {
        name: "description",
        content:
          "Book dental appointment slots and let automated voice reminders call each patient a day before, in their own language.",
      },
      { property: "og:title", content: "Schedule — Meridian Dental Reminder App" },
      {
        property: "og:description",
        content:
          "Book dental appointment slots and let automated voice reminders call each patient a day before, in their own language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const appointments = useAppointments();
  const [day, setDay] = useState<string>(DAYS[1] ?? "Tue 04");
  const [sheetOpen, setSheetOpen] = useState(false);

  const [patient, setPatient] = useState("");
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState<string>(SLOTS[0] ?? "09:00");
  const [treatment, setTreatment] = useState<string>(TREATMENTS[0] ?? "Check-up");
  const [language, setLanguage] = useState<LanguageCode>("EN");

  const dayAppts = appointments.filter((a) => a.day === day);
  const confirmed = dayAppts.filter((a) => a.status === "delivered").length;

  function confirmBooking() {
    if (!patient.trim()) return;
    addAppointment({
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
  }

  return (
    <PhoneShell>
      <div className="px-5 pb-2 pt-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-signal">Today · {day}</div>
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

      <div className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {DAYS.map((d) => {
          const [name, num] = d.split(" ");
          const active = d === day;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-xl px-3 py-2 text-center ${active ? "bg-signal" : "bg-frost/10"}`}
            >
              <div
                className={`text-[9px] uppercase ${active ? "text-frost/80" : "text-frost/50"}`}
              >
                {name}
              </div>
              <div className="font-display font-bold">{num}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 px-4">
        {dayAppts.length === 0 && (
          <div className="rounded-2xl bg-frost/8 p-4 text-center text-[10px] text-frost/50 ring-1 ring-frost/10">
            No appointments booked for {day}.
          </div>
        )}
        {dayAppts.map((a, i) => (
          <Link
            key={a.id}
            to="/reminders/$id"
            params={{ id: a.id }}
            className="rise rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10"
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
        ))}
      </div>

      <div className="mt-auto px-4 pb-3 pt-3">
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full rounded-2xl bg-signal py-3 font-display text-sm font-bold text-frost"
        >
          + New appointment
        </button>
      </div>

      {sheetOpen && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-ink/50">
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
              <label className="rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Patient</div>
                <input
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-transparent text-[11px] outline-none placeholder:text-ink/30"
                />
              </label>
              <label className="rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Phone</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+00 000 000"
                  className="w-full bg-transparent text-[11px] outline-none placeholder:text-ink/30"
                />
              </label>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              <label className="rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Slot · {day}</div>
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
              <label className="rounded-xl bg-ink/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-ink/40">Treatment</div>
                <select
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full bg-transparent text-[11px] outline-none"
                >
                  {TREATMENTS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
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
                    className={`rounded-full px-2 py-0.5 ${
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
              className="relative mt-3 w-full overflow-hidden rounded-2xl bg-signal py-3 font-display text-sm font-bold text-frost"
            >
              <span className="sheen absolute inset-y-0 w-1/3 bg-frost/30" />
              Confirm booking
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
