import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  LANGUAGES,
  retryReminder,
  statusClasses,
  statusLabel,
  triggerReminder,
  useAppointments,
} from "@/lib/clinic-store";
import { VOICE_SCRIPTS, playVoiceReminder, stopVoiceReminder } from "@/lib/voice-reminder";

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
      <PhoneShell requireAuth>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <div className="font-display text-xl font-black">Reminder not found</div>
          <Link to="/reminders" className="rounded-full bg-signal px-4 py-2 text-[11px] text-frost">
            Back to reminders
          </Link>
        </div>
      </PhoneShell>
    );
  }

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const language = LANGUAGES.find((l) => l.code === appt.language);
  const progress = Math.min(appt.attempts.length / appt.maxAttempts, 1) * 100;

  const script = appt
    ? VOICE_SCRIPTS[appt.language]?.({
        patient: appt.patient,
        day: appt.day,
        time: appt.time,
        treatment: appt.treatment,
      }) || ""
    : "";

  function handleToggleAudio() {
    if (isPlayingAudio) {
      stopVoiceReminder();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playVoiceReminder(
        {
          patient: appt.patient,
          day: appt.day,
          time: appt.time,
          treatment: appt.treatment,
          language: appt.language,
        },
        () => setIsPlayingAudio(false)
      );
    }
  }

  async function handleCallNow() {
    if (isCalling) return;
    setIsCalling(true);
    try {
      await retryReminder(appt.id, true);
    } finally {
      setIsCalling(false);
    }
  }

  return (
    <PhoneShell requireAuth>
      <div className="px-5 pb-2 pt-3">
        <Link to="/reminders" className="text-[10px] uppercase tracking-[0.14em] text-frost/45 hover:text-frost">
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
        <div className="mt-1 font-mono text-[10px] text-signal font-semibold">{appt.phone}</div>
      </div>

      {/* Reminder Status Card */}
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
          Auto-fires 1 day before · {language?.label} voice reminder · max {appt.maxAttempts} attempts
        </div>
      </div>

      {/* ── Voice Script & TTS Preview Card ── */}
      <div className="mx-4 mt-2 rounded-2xl border border-signal/20 bg-signal/5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-signal">
            🎙️ Voice Message ({language?.label})
          </span>
          <button
            onClick={handleToggleAudio}
            className={`rounded-full px-2.5 py-1 text-[9px] font-bold transition-all ${
              isPlayingAudio ? "bg-signal text-frost animate-pulse" : "bg-frost/10 text-frost hover:bg-frost/20"
            }`}
          >
            {isPlayingAudio ? "⏹ Stop audio" : "🔊 Listen audio"}
          </button>
        </div>
        <p className="mt-2 rounded-xl bg-ink/50 p-2.5 text-[10.5px] leading-relaxed text-frost/80 italic ring-1 ring-frost/10">
          "{script}"
        </p>
      </div>

      {/* Call Attempts Card */}
      <div className="mx-4 mt-2 rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-frost/50">Call history</div>
        {appt.attempts.length === 0 && (
          <div className="text-[10px] text-frost/50">No calls placed yet. Automated 1-day check pending.</div>
        )}
        {[...appt.attempts].reverse().map((att, i) => (
          <div key={i} className="flex justify-between border-b border-frost/5 py-1 text-[10px] text-frost/60 last:border-none">
            <span className="font-mono text-frost/50">{att.at}</span>
            <span className="font-medium text-frost/80 text-right">{att.outcome}</span>
          </div>
        ))}
      </div>

      {appt.status === "failed" && (
        <div className="mx-4 mt-2 flex items-center gap-3 rounded-2xl bg-signal/10 p-3 ring-1 ring-signal/30">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-signal text-sm font-bold text-frost">
            !
          </div>
          <p className="text-[11px] leading-snug text-frost/70">
            All {appt.maxAttempts} automated calls failed. Staff manual follow-up required for {appt.patient} ({appt.phone}).
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto flex gap-2 px-4 pb-3 pt-3">
        <button
          onClick={() => triggerReminder(appt.id)}
          className="flex-1 rounded-2xl bg-frost/10 py-3 text-[11px] font-bold text-frost/70 hover:bg-frost/15"
        >
          Queue 1-day reminder
        </button>
        <button
          onClick={handleCallNow}
          disabled={isCalling}
          className={`flex-1 rounded-2xl py-3 font-display text-sm font-bold text-frost transition-all ${
            isCalling ? "bg-warn animate-pulse text-ink" : "bg-signal hover:opacity-90 shadow-lg"
          }`}
        >
          {isCalling ? "Calling…" : "📞 Dial patient"}
        </button>
      </div>
    </PhoneShell>
  );
}
