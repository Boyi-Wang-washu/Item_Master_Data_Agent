const phases = [
  {
    label: "Phase 1",
    title: "Current MVP (Today)",
    bullets: [
      "Upload and validate Item Master Excel extracts",
      "Fixed rule catalog curated by the data quality team",
      "Finance-facing AI summary of validation results",
    ],
  },
  {
    label: "Phase 2",
    title: "Operational Expansion",
    bullets: [
      "Configurable rules maintained by finance and operations",
      "Cross-site trend analytics for Item Master quality",
      "Role-based access, approvals, and action tracking",
    ],
  },
  {
    label: "Phase 3",
    title: "Integrated Data Quality Platform",
    bullets: [
      "Direct ERP / MDM integration and automated ingestion",
      "Real-time alerts for high-severity issues",
      "Dashboards for close, collateral, and audit readiness",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Roadmap &amp; Future Phases
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-3xl">
          This prototype focuses on the Item Master rule engine. Below is an illustrative view of
          how it could evolve into a full Curium data quality platform supporting finance,
          operations, and audit teams.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {phases.map((phase) => (
          <article
            key={phase.label}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 space-y-3"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {phase.label}
              </span>
              <h2 className="text-xl font-semibold text-slate-900">{phase.title}</h2>
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#D12B8A] to-[#5C3C92]" />
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
              {phase.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

