import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { LANGUAGES } from "@/lib/clinic-store";
import {
  getStaffProfile,
  updateStaffProfilePreferences,
  type StaffProfile,
} from "@/lib/staff-profile";
import { onAuthChange, signOutUser } from "@/lib/auth-service";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { User } from "firebase/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Reminder Settings — HMIS" },
      {
        name: "description",
        content:
          "Configure when voice reminders fire, retry attempts, gaps between retries, and default reminder language.",
      },
      { property: "og:title", content: "Reminder Settings — HMIS" },
      {
        property: "og:description",
        content: "Configure automated voice reminder settings for the HMIS appointment system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [auto, setAuto] = useState(true);
  const [retries, setRetries] = useState(3);
  const [gap, setGap] = useState(30);
  const [fallback, setFallback] = useState("EN");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile: StaffProfile | null = await getStaffProfile(user.uid);
        if (profile) {
          if (typeof profile.autoReminders === "boolean") setAuto(profile.autoReminders);
          if (typeof profile.retryAttempts === "number") setRetries(profile.retryAttempts);
          if (typeof profile.retryGapMinutes === "number") setGap(profile.retryGapMinutes);
          if (profile.preferredLanguage) setFallback(profile.preferredLanguage);
        }
      }
    });
    return () => unsub();
  }, []);

  async function handleToggleAuto() {
    const next = !auto;
    setAuto(next);
    await updateStaffProfilePreferences({ autoReminders: next });
  }

  async function handleRetriesChange(val: number) {
    setRetries(val);
    await updateStaffProfilePreferences({ retryAttempts: val });
  }

  async function handleGapChange(val: number) {
    setGap(val);
    await updateStaffProfilePreferences({ retryGapMinutes: val });
  }

  async function handleFallbackLanguage(lang: string) {
    setFallback(lang);
    await updateStaffProfilePreferences({ preferredLanguage: lang });
  }

  async function handleSignOut() {
    setSaving(true);
    try {
      await signOutUser();
      navigate({ to: "/auth", replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PhoneShell requireAuth>
      <div className="px-5 pb-2 pt-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-signal">Automation</div>
        <div className="mt-1 font-display text-3xl font-black leading-none tracking-tight">
          Settings
        </div>
        {currentUser && (
          <div className="mt-1 truncate text-[10px] text-frost/50">
            Signed in as <span className="font-semibold text-frost">{currentUser.email || currentUser.displayName || "Staff"}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2 px-4">
        {/* Firestore Database Status Card */}
        <div className="rounded-2xl border border-frost/10 bg-frost/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-frost/60">
              Firestore Database
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                isFirebaseConfigured ? "bg-ok/20 text-ok" : "bg-warn/20 text-warn"
              }`}
            >
              {isFirebaseConfigured ? "● Connected" : "○ Offline Fallback"}
            </span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-[9px] text-frost/50">
            <div>Project: <span className="text-frost/80">{import.meta.env.VITE_FIREBASE_PROJECT_ID || "dental-clinic-40a20"}</span></div>
            <div>Auth: <span className="text-frost/80">{currentUser?.email || "Admin authenticated"}</span></div>
            <div>Rules: <span className="text-ok">firestore.rules configured</span></div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
          <div>
            <div className="font-display text-sm font-bold">Auto voice reminder</div>
            <div className="text-[10px] text-frost/50">Fires 1 day before each appointment</div>
          </div>
          <button
            onClick={handleToggleAuto}
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
            onChange={(e) => handleRetriesChange(Number(e.target.value))}
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
            onChange={(e) => handleGapChange(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--signal)]"
          />
        </div>

        <div className="rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10">
          <div className="font-display text-sm font-bold">Fallback language</div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleFallbackLanguage(l.code)}
                className={`rounded-full px-2 py-0.5 transition-all ${
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

        <div className="mt-2">
          {currentUser ? (
            <button
              onClick={handleSignOut}
              disabled={saving}
              className="w-full rounded-2xl border border-signal/30 bg-signal/15 py-3 font-display text-xs font-bold text-signal transition-colors hover:bg-signal/25"
            >
              {saving ? "Signing out…" : "Sign out from clinic"}
            </button>
          ) : (
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="w-full rounded-2xl border border-frost/20 bg-frost/10 py-3 font-display text-xs font-bold text-frost transition-colors hover:bg-frost/20"
            >
              Sign in to staff account
            </button>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
