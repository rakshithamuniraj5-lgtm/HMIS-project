import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  statusClasses,
  statusLabel,
  useAppointments,
  trigger1DayAutomatedWorkflow,
  DAYS,
  type ReminderStatus,
} from "@/lib/clinic-store";
import { get1DayBeforeAppointments } from "@/lib/voice-reminder";

export const Route = createFileRoute("/reminders/")({
  head: () => ({
    meta: [
      { title: "Reminder monitor — HMIS" },
      {
        name: "description",
        content:
          "Track every automated voice reminder: delivered, calling, retrying, or failed and waiting on staff follow-up.",
      },
      { property: "og:title", content: "Reminder Monitor — HMIS" },
      {
        property: "og:description",
        content:
          "Track every automated voice reminder: delivered, calling, retrying, or failed and waiting on staff follow-up.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RemindersPage,
});

type Filter = "all" | ReminderStatus;

function RemindersPage() {
  const appointments = useAppointments();
  const [filter, setFilter] = useState<Filter>("all");
  const [isRunning1DayWorkflow, setIsRunning1DayWorkflow] = useState(false);
  const [speakAloud, setSpeakAloud] = useState(true);
  const [workflowBanner, setWorkflowBanner] = useState<string | null>(null);

  const tomorrowDay = DAYS[1];
  const eligible1DayAppts = get1DayBeforeAppointments(appointments);

  const count = (s: ReminderStatus) => appointments.filter((a) => a.status === s).length;
  const shown = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);
  const exceptions = count("failed");

  const chips: { key: Filter; label: string; cls: string }[] = [
    { key: "all", label: `All ${appointments.length}`, cls: "bg-frost/10 text-frost/50" },
    { key: "delivered", label: `Delivered ${count("delivered")}`, cls: "bg-ok/20 text-ok" },
    { key: "retrying", label: `Retry ${count("retrying")}`, cls: "bg-warn/20 text-warn" },
    { key: "failed", label: `Failed ${exceptions}`, cls: "bg-signal/20 text-signal" },
  ];

  async function handleRun1DayWorkflow() {
    if (isRunning1DayWorkflow || eligible1DayAppts.length === 0) return;
    setIsRunning1DayWorkflow(true);
    setWorkflowBanner(`Calling ${eligible1DayAppts.length} patient(s) scheduled for tomorrow (${tomorrowDay})…`);
    try {
      const result = await trigger1DayAutomatedWorkflow(speakAloud);
      setWorkflowBanner(
        `✓ Finished! Executed ${result.completed} voice reminders for tomorrow (${tomorrowDay}).`
      );
    } catch (err) {
      setWorkflowBanner("Voice workflow encounter an issue: " + String(err));
    } finally {
      setIsRunning1DayWorkflow(false);
    }
  }

  return (
    <PhoneShell requireAuth>
      <div className="px-5 pb-2 pt-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-signal">Monitor</div>
        <div className="mt-1 font-display text-3xl font-black leading-none tracking-tight">
          Reminders
        </div>

        {/* ── 1-Day Before Automated Voice Reminder Widget ── */}
        <div className="mt-3 rounded-2xl border border-signal/30 bg-gradient-to-br from-signal/15 to-signal/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-signal">
              ⚡ 1-Day Voice Reminder Workflow
            </span>
            <span className="rounded-full bg-signal/20 px-2 py-0.5 text-[9px] font-medium text-signal">
              Tomorrow: {tomorrowDay}
            </span>
          </div>

          <p className="mt-1.5 text-[10.5px] leading-tight text-frost/70">
            Automatically dials patients scheduled for tomorrow in their preferred language ({eligible1DayAppts.length} pending).
          </p>

          {workflowBanner && (
            <div className="mt-2 rounded-xl bg-ink/60 px-2.5 py-1.5 text-[10px] font-medium text-frost/90 ring-1 ring-signal/30">
              {workflowBanner}
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-[9.5px] text-frost/60">
              <input
                type="checkbox"
                checked={speakAloud}
                onChange={(e) => setSpeakAloud(e.target.checked)}
                className="size-3.5 accent-[var(--signal)] rounded"
              />
              <span>🔊 Voice audio preview</span>
            </label>

            <button
              onClick={handleRun1DayWorkflow}
              disabled={isRunning1DayWorkflow || eligible1DayAppts.length === 0}
              className={`rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all ${
                eligible1DayAppts.length === 0
                  ? "bg-frost/10 text-frost/40 cursor-not-allowed"
                  : isRunning1DayWorkflow
                  ? "bg-warn text-ink animate-pulse"
                  : "bg-signal text-frost hover:opacity-90 shadow-md"
              }`}
            >
              {isRunning1DayWorkflow
                ? "Dials in progress…"
                : eligible1DayAppts.length === 0
                ? "All 1-day reminders done"
                : `Trigger 1-day reminders (${eligible1DayAppts.length})`}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-[9px] uppercase tracking-wider">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`shrink-0 rounded-full px-2 py-1 ${c.cls} ${
                filter === c.key ? "ring-1 ring-frost/40" : ""
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 px-4">
        {shown.length === 0 && (
          <div className="rounded-2xl bg-frost/8 p-6 text-center ring-1 ring-frost/10">
            <div className="text-2xl mb-2">🔔</div>
            <div className="text-[11px] font-semibold text-frost/60">
              {filter === "all" ? "No appointments yet" : `No ${filter} reminders`}
            </div>
            <div className="text-[10px] text-frost/40 mt-1">Add appointments from the Schedule tab</div>
          </div>
        )}
        {shown.map((a, i) => (
          <Link
            key={a.id}
            to="/reminders/$id"
            params={{ id: a.id }}
            className={`rise rounded-2xl p-3 ring-1 ${
              a.status === "failed"
                ? "bg-signal/10 ring-signal/30"
                : "bg-frost/8 ring-frost/10"
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="font-display text-sm font-bold">{a.patient}</div>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${statusClasses(a.status)}`}
              >
                {statusLabel[a.status]}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-[10px] text-frost/50">
                {a.language} voice · attempt {Math.min(a.attempts.length, a.maxAttempts)}/
                {a.maxAttempts}
              </div>
              {a.status === "calling" ? (
                <span className="inline-flex items-center gap-1 text-[9px] text-warn">
                  <span className="blip h-2 w-2 rounded-full bg-warn" />
                  ringing
                </span>
              ) : (
                <span className="text-[9px] text-frost/50">
                  {a.status === "failed" ? "staff follow-up" : a.day + " · " + a.time}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-auto px-4 pb-3 pt-3">
        <div className="rounded-2xl bg-frost/8 p-3 text-[10px] text-frost/60 ring-1 ring-frost/10">
          <span className="font-bold text-signal">{exceptions} exceptions</span> need a manual call
          before 17:00
        </div>
      </div>
    </PhoneShell>
  );
}
