import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { LANGUAGES, useAppointments } from "@/lib/clinic-store";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "Patients — HMIS" },
      {
        name: "description",
        content:
          "Patient list with phone numbers and the language each person hears their appointment reminder in.",
      },
      { property: "og:title", content: "Patients — HMIS" },
      {
        property: "og:description",
        content:
          "Patient list with phone numbers and the language each person hears their appointment reminder in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const appointments = useAppointments();
  const seen = new Set<string>();
  const patients = appointments.filter((a) => {
    if (seen.has(a.patient)) return false;
    seen.add(a.patient);
    return true;
  });

  return (
    <PhoneShell requireAuth>
      <div className="px-5 pb-2 pt-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-signal">Directory</div>
        <div className="mt-1 font-display text-3xl font-black leading-none tracking-tight">
          Patients
        </div>
        <div className="mt-1 text-[10px] text-frost/50">
          {patients.length} people · reminder language per patient
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 px-4">
        {patients.length === 0 && (
          <div className="rounded-2xl bg-frost/8 p-6 text-center ring-1 ring-frost/10">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-[11px] font-semibold text-frost/60">No patients yet</div>
            <div className="text-[10px] text-frost/40 mt-1">Add appointments to see patients here</div>
          </div>
        )}
        {patients.map((a, i) => (
          <Link
            key={a.patient}
            to="/reminders/$id"
            params={{ id: a.id }}
            className="rise flex items-center gap-3 rounded-2xl bg-frost/8 p-3 ring-1 ring-frost/10"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-frost/10 font-display text-[11px] font-bold">
              {a.patient
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-bold">{a.patient}</div>
              <div className="truncate text-[10px] text-frost/50">{a.phone}</div>
            </div>
            <span className="rounded-full bg-frost/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-frost/60">
              {LANGUAGES.find((l) => l.code === a.language)?.label}
            </span>
          </Link>
        ))}
      </div>
    </PhoneShell>
  );
}
