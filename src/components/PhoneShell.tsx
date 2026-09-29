import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const TABS = [
  { to: "/", label: "Schedule" },
  { to: "/reminders", label: "Reminders" },
  { to: "/patients", label: "Patients" },
  { to: "/settings", label: "Settings" },
] as const;

export function PhoneShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="stage-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-[420px] w-[420px] rotate-12 skew-y-12 bg-signal/10" />
        <div className="absolute bottom-[-40px] right-[-60px] h-[460px] w-[460px] -rotate-6 skew-y-12 bg-cool/10" />
      </div>

      <div className="relative w-full max-w-[340px] rounded-[38px] bg-ink p-[10px] shadow-2xl">
        <div className="screen-bg relative flex h-[660px] flex-col overflow-hidden rounded-[30px] bg-ink text-frost">
          <div className="flex items-center justify-between px-5 pt-4 text-[10px] text-frost/50">
            <span>09:12</span>
            <span className="font-display font-bold tracking-tight text-frost/80">
              CLINIC · MERIDIAN
            </span>
            <span>4G ▮</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>

          {!hideNav && (
            <div className="grid grid-cols-4 border-t border-frost/10 py-2 text-center text-[9px] uppercase tracking-wider">
              {TABS.map((tab) => {
                const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={active ? "text-signal" : "text-frost/50"}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
