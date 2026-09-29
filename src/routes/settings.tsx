import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { LANGUAGES } from "@/lib/clinic-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Reminder settings — Meridian Dental" },
      {
        name: "description",
        content:
          "Set when voice reminders fire, how many retries to attempt, and which language is used by default.",
      },
      { property: "og:title", content: "Reminder settings — Meridian Dental" },
      {
        property: "og:description",
        content:
          "Set when voice reminders fire, how many retries to attempt, and which language is used by default.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [auto, setAuto] = useState(true);
  const [retries, setRetries] = useState(3);
  const [gap, setGap] = useState(30);
  const [fallback, setFallback] = useState("EN");

  return (
    <PhoneShell>
      <div className="px-5 pb-2 pt-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-signal">Automation</div>
        <div className="mt-1 font-display text-3xl font-black leading-none tracking-tight">
          Settings
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 px-4">
        <div className="flex items-center justify-between rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
          <div>
            <div className="font-display text-sm font-bold">Auto voice reminder</div>
            <div className="text-[10px] text-frost/50">Fires 1 day before each appointment</div>
          </div>
          <button
            onClick={() => setAuto((v) => !v)}
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${auto ? "bg-ok" : "bg-frost/20"}`}
          >
            <span
              className={`block size-5 rounded-full bg-frost transition-transform ${auto ? "translate-x-5" : ""}`}
            />
          </button>
        </div>

        <div className="rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
          <div className="flex items-center justify-between">
            <div className="font-display text-sm font-bold">Retry attempts</div>
            <span className="text-[10px] text-warn">{retries} max</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={retries}
            onChange={(e) => setRetries(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--signal)]"
          />
          <div className="text-[9px] text-frost/40">
            After the last failure the reminder is flagged for staff follow-up.
          </div>
        </div>

        <div className="rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
          <div className="flex items-center justify-between">
            <div className="font-display text-sm font-bold">Gap between retries</div>
            <span className="text-[10px] text-warn">{gap} min</span>
          </div>
          <input
            type="range"
            min={10}
            max={120}
            step={10}
            value={gap}
            onChange={(e) => setGap(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--signal)]"
          />
        </div>

        <div className="rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
          <div className="font-display text-sm font-bold">Fallback language</div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setFallback(l.code)}
                className={`rounded-full px-2 py-0.5 ${
                  fallback === l.code ? "bg-signal font-bold text-frost" : "bg-frost/10 text-frost/60"
                }`}
              >
                {l.code}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[9px] text-frost/40">
            Used when a patient has no preferred language on file.
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
