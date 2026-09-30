import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { confirmResetPassword, updateUserPassword, getCurrentUser } from "@/lib/auth-service";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — HMIS" },
      { name: "description", content: "Set a new password for your HMIS staff account." },
      { property: "og:title", content: "Reset Password — HMIS" },
      { property: "og:description", content: "Recover access to your HMIS staff account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check URL search parameters or hash for Firebase's oobCode
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
    const code = urlParams.get("oobCode") || hashParams.get("oobCode");

    if (code) {
      setOobCode(code);
    } else if (getCurrentUser()) {
      setIsLoggedIn(true);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (oobCode) {
        await confirmResetPassword(oobCode, password);
      } else if (isLoggedIn) {
        await updateUserPassword(password);
      } else {
        throw new Error("Missing reset code or active session. Please request a new password reset email.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  const canReset = Boolean(oobCode || isLoggedIn);

  return (
    <PhoneShell hideNav>
      <div className="flex min-h-full flex-col px-6 pb-7 pt-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-signal">
          <LockKeyhole className="size-6 text-frost" />
        </div>
        <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-signal">
          HMIS · Staff Access
        </div>
        <h1 className="mt-2 font-display text-3xl font-black text-frost">New password.</h1>

        {done ? (
          <div className="mt-6">
            <p className="text-[11px] text-ok">Password updated successfully.</p>
            <Button
              onClick={() => navigate({ to: "/auth", replace: true })}
              className="mt-5 w-full bg-signal text-frost"
            >
              Continue to sign in
            </Button>
          </div>
        ) : canReset ? (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-[10px] text-frost/60">
              New password
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-2 h-11 w-full rounded-lg border border-frost/15 bg-frost/8 px-3 text-frost outline-none focus:border-signal"
              />
            </label>
            <label className="block text-[10px] text-frost/60">
              Confirm password
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-2 h-11 w-full rounded-lg border border-frost/15 bg-frost/8 px-3 text-frost outline-none focus:border-signal"
              />
            </label>
            {error && (
              <p role="alert" className="text-[10px] text-signal">
                {error}
              </p>
            )}
            <Button
              disabled={loading}
              type="submit"
              className="h-11 w-full bg-signal text-frost hover:bg-signal/85"
            >
              {loading ? "Updating…" : "Save new password"}
            </Button>
          </form>
        ) : (
          <p className="mt-5 text-[11px] text-frost/60">
            This reset link is missing or has expired. Please request a new one from the sign-in screen.
          </p>
        )}

        <Button
          type="button"
          variant="link"
          onClick={() => navigate({ to: "/auth" })}
          className="mt-auto text-signal"
        >
          Back to sign in
        </Button>
      </div>
    </PhoneShell>
  );
}