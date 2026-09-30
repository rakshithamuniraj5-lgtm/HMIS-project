import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import {
  LANGUAGES,
  retryReminder,
  statusClasses,
  statusLabel,
  triggerReminder,
  useAppointments,
} from "@/lib/clinic-store";

export const Route = createFileRoute("/reminders/$id")({
  head: () => ({
    meta: [
      { title: "Reminder Detail — HMIS" },
      {
        name: "description",
        content:
          "View every voice-call attempt for an appointment reminder and manually retry when automatic calls fail.",
      },
      { property: "og:title", content: "Reminder Detail — HMIS" },
      {
        property: "og:description",
        content:
          "View every voice-call attempt for an appointment reminder and manually retry when automatic calls fail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReminderDetail,
});

function ReminderDetail() {
  const { id } = Route.useParams();
  const appointments = useAppointments();
  const appt = appointments.find((a) => a.id === id);

  if (!appt) {
    return (
      <PhoneShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <div className="font-display text-xl font-black">Reminder not found</div>
          <Link to="/reminders" className="rounded-full bg-signal px-4 py-2 text-[11px] text-frost">
            Back to reminders
          </Link>
        </div>
      </PhoneShell>
    );
  }

  const language = LANGUAGES.find((l) => l.code === appt.language);
  const progress = Math.min(appt.attempts.length / appt.maxAttempts, 1) * 100;

  return (
    <PhoneShell>
      <div className="px-5 pb-2 pt-3">
        <Link to="/reminders" className="text-[10px] uppercase tracking-[0.14em] text-frost/45">
          ‹ Back to reminders
        </Link>
        <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-signal">
          Detail · #{appt.id}
        </div>
        <div className="mt-1 font-display text-2xl font-black leading-none tracking-tight">
          {appt.patient}
        </div>
        <div className="mt-1 text-[10px] text-frost/50">
          {appt.day} · {appt.time} · {appt.treatment} · {language?.label}
        </div>
        <div className="mt-1 text-[10px] text-frost/40">{appt.phone}</div>
      </div>

      <div className="mx-4 mt-2 rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-frost/50">
            Reminder status
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${statusClasses(appt.status)}`}
          >
            {statusLabel[appt.status]} {Math.min(appt.attempts.length, appt.maxAttempts)}/
            {appt.maxAttempts}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-frost/10">
          <div
            className={`h-full ${appt.status === "delivered" ? "bg-ok" : appt.status === "failed" ? "bg-signal" : "bg-warn"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-[9px] text-frost/40">
          Auto-fires 1 day before · {language?.label} voice · retries every 30 min, max{" "}
          {appt.maxAttempts}
        </div>
      </div>

      <div className="mx-4 mt-2 rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-frost/50">Call attempts</div>
        {appt.attempts.length === 0 && (
          <div className="text-[10px] text-frost/50">No calls placed yet.</div>
        )}
        {[...appt.attempts].reverse().map((att, i) => (
          <div key={i} className="flex justify-between py-0.5 text-[10px] text-frost/60">
            <span>{att.at}</span>
            <span className="text-frost/50">{att.outcome}</span>
          </div>
        ))}
      </div>

      {appt.status === "failed" && (
        <div className="mx-4 mt-2 flex items-center gap-3 rounded-2xl bg-signal/10 p-3 ring-1 ring-signal/30">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-signal text-sm font-bold text-frost">
            !
          </div>
          <p className="text-[11px] leading-snug text-frost/70">
            All {appt.maxAttempts} attempts failed. Call {appt.patient} directly to confirm{" "}
            {appt.day} {appt.time}.
          </p>
        </div>
      )}

      <div className="mt-auto flex gap-2 px-4 pb-3 pt-3">
        <button
          onClick={() => triggerReminder(appt.id)}
          className="flex-1 rounded-2xl bg-frost/10 py-3 text-[11px] font-bold text-frost/70"
        >
          Queue reminder
        </button>
        <button
          onClick={() => retryReminder(appt.id)}
          className="flex-1 rounded-2xl bg-signal py-3 font-display text-sm font-bold text-frost"
        >
          ↻ Retry now
        </button>
      </div>
    </PhoneShell>
  );
}
