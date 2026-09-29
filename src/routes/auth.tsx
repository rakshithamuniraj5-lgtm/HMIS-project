import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Mail, LockKeyhole, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  onAuthChange,
} from "@/lib/auth-service";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — Meridian Dental" },
      { name: "description", content: "Sign in to Meridian Dental's appointment and reminder app." },
      { property: "og:title", content: "Staff sign in — Meridian Dental" },
      { property: "og:description", content: "Secure access to Meridian Dental's appointment and reminder app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (mode === "forgot") {
        await sendPasswordReset(email);
        setNotice("If this address has an account, a reset link is on its way.");
      } else if (mode === "signup") {
        await signUpWithEmail(email, password, name);
        await navigate({ to: "/", replace: true });
      } else {
        await signInWithEmail(email, password);
        await navigate({ to: "/", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      await navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneShell hideNav>
      <div className="flex min-h-full flex-col px-6 pb-6 pt-8">
        <div className="rise">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-signal font-display text-2xl font-black text-frost">
            M.
          </div>
          <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-signal">
            Meridian · staff access
          </div>
          <h1 className="mt-2 font-display text-[32px] font-black leading-[1.04] text-frost">
            {mode === "signin" ? (
              <>
                Good to have
                <br />
                you back.
              </>
            ) : mode === "signup" ? (
              <>
                Join the
                <br />
                clinic team.
              </>
            ) : (
              <>
                Reset your
                <br />
                password.
              </>
            )}
          </h1>
          <p className="mt-3 max-w-[240px] text-[11px] leading-relaxed text-frost/50">
            {mode === "signin"
              ? "Sign in to manage appointments and keep every reminder on track."
              : mode === "signup"
                ? "Create your staff account to access the clinic schedule."
                : "Enter your email and we'll send you a link to set a new password."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
          {mode === "signup" && (
            <label className="block text-[10px] text-frost/60">
              Full name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 h-11 w-full rounded-lg border border-frost/15 bg-frost/8 px-3 text-[12px] text-frost outline-none placeholder:text-frost/30 focus:border-signal"
              />
            </label>
          )}
          <label className="block text-[10px] text-frost/60">
            Work email
            <span className="relative mt-1.5 block">
              <Mail className="absolute left-3 top-3.5 size-4 text-frost/35" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@clinic.com"
                className="h-11 w-full rounded-lg border border-frost/15 bg-frost/8 pl-10 pr-3 text-[12px] text-frost outline-none placeholder:text-frost/30 focus:border-signal"
              />
            </span>
          </label>
          {mode !== "forgot" && (
            <label className="block text-[10px] text-frost/60">
              Password
              <span className="relative mt-1.5 block">
                <LockKeyhole className="absolute left-3 top-3.5 size-4 text-frost/35" />
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-11 w-full rounded-lg border border-frost/15 bg-frost/8 pl-10 pr-10 text-[12px] text-frost outline-none placeholder:text-frost/30 focus:border-signal"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1 size-9 text-frost/50 hover:bg-frost/10 hover:text-frost"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </span>
            </label>
          )}
          {mode === "signin" && (
            <Button
              type="button"
              variant="link"
              onClick={() => switchMode("forgot")}
              className="h-auto self-end p-0 text-[10px] text-signal"
            >
              Forgot password?
            </Button>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-signal/15 p-2 text-[10px] leading-relaxed text-signal">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-lg bg-ok/15 p-2 text-[10px] leading-relaxed text-ok">
              {notice}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 w-full justify-between rounded-lg bg-signal px-4 font-display text-[12px] font-bold text-frost hover:bg-signal/85"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            <ArrowRight />
          </Button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3 text-[9px] text-frost/35">
              <span className="h-px flex-1 bg-frost/15" />
              or continue with
              <span className="h-px flex-1 bg-frost/15" />
            </div>
            <Button
              type="button"
              disabled={loading}
              variant="outline"
              onClick={handleGoogleSignIn}
              className="h-11 w-full rounded-lg border-frost/20 bg-frost/5 font-display text-[11px] font-semibold text-frost hover:bg-frost/10 hover:text-frost"
            >
              <span className="font-display text-lg font-bold text-ok">G</span> Google
            </Button>
          </>
        )}
        <div className="mt-auto pt-6 text-center text-[10px] text-frost/50">
          {mode === "signin" ? (
            <>
              New to the team?{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => switchMode("signup")}
                className="h-auto p-0 text-[10px] text-signal"
              >
                Create an account
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="link"
              onClick={() => switchMode("signin")}
              className="h-auto gap-1 p-0 text-[10px] text-signal"
            >
              <ArrowLeft className="size-3" /> Back to sign in
            </Button>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}