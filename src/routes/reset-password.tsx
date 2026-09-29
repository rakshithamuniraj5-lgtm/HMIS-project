import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — Meridian Dental" },
    { name: "description", content: "Set a new password for your Meridian Dental staff account." },
    { property: "og:title", content: "Reset password — Meridian Dental" },
    { property: "og:description", content: "Recover access to your Meridian Dental staff account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "recovery") setRecovery(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) setError(authError.message);
    else setDone(true);
  }

  return <PhoneShell hideNav><div className="flex min-h-full flex-col px-6 pt-10 pb-7">
    <div className="grid size-12 place-items-center rounded-2xl bg-signal"><LockKeyhole className="size-6 text-frost" /></div>
    <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-signal">Meridian · staff access</div>
    <h1 className="mt-2 font-display text-3xl font-black text-frost">New password.</h1>
    {done ? <div className="mt-6"><p className="text-[11px] text-ok">Password updated successfully.</p><Button onClick={() => navigate({ to: "/", replace: true })} className="mt-5 w-full bg-signal text-frost">Continue to schedule</Button></div>
      : recovery ? <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-[10px] text-frost/60">New password<input required minLength={6} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-frost/15 bg-frost/8 px-3 text-frost outline-none focus:border-signal" /></label>
          <label className="block text-[10px] text-frost/60">Confirm password<input required minLength={6} type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-frost/15 bg-frost/8 px-3 text-frost outline-none focus:border-signal" /></label>
          {error && <p role="alert" className="text-[10px] text-signal">{error}</p>}
          <Button disabled={loading} type="submit" className="h-11 w-full bg-signal text-frost">{loading ? "Updating…" : "Save new password"}</Button>
        </form>
      : <p className="mt-5 text-[11px] text-frost/60">This reset link is missing or has expired. Request a new one from the sign-in screen.</p>}
    <Button type="button" variant="link" onClick={() => navigate({ to: "/auth" })} className="mt-auto text-signal">Back to sign in</Button>
  </div></PhoneShell>;
}