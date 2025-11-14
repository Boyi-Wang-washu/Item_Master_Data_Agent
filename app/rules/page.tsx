import type { ReactElement } from "react";

const rules: Array<{
  id: string;
  name: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  impacted: string[];
  owner: string;
}> = [
  {
    id: "INV_COST_MISSING",
    name: "Inventory Cost Missing",
    severity: "High",
    description:
      "Inventory item is marked as inventory but both standard and current unit costs are zero, leading to misstated inventory valuation.",
    impacted: ["ITMRVA", "ITMRVB"],
    owner: "Finance",
  },
  {
    id: "EXP_ITEM_WITH_INVENTORY_COST",
    name: "Expense Item with Inventory Cost",
    severity: "High",
    description:
      "Item is treated as an expense but has non-zero inventory cost, creating a double-counting risk between expense and balance sheet.",
    impacted: ["ITMRVA", "ITMRVB"],
    owner: "Finance",
  },
  {
    id: "UOM_MISMATCH",
    name: "Unit of Measure Mismatch",
    severity: "Medium",
    description:
      "Site-level unit of measure does not align with the global stocking unit, causing valuation and reconciliation issues.",
    impacted: ["ITMENT", "ITMRVA"],
    owner: "Operations",
  },
  {
    id: "ITEM_CLASS_INVALID",
    name: "Invalid Item Class",
    severity: "Medium",
    description:
      "Item is assigned to an unexpected or non-standard class that does not map cleanly to GL accounts or reporting structures.",
    impacted: ["ITMRVA"],
    owner: "Finance / IT",
  },
  {
    id: "ORPHAN_ITEM_SITE",
    name: "Orphan Item Site",
    severity: "High",
    description:
      "Item exists at a site with value or quantity but has no corresponding global Item Master record, breaking traceability.",
    impacted: ["ITMRVA", "ITMRVB"],
    owner: "Operations / IT",
  },
];

const severityStyles: Record<string, string> = {
  High: "bg-rose-50 text-rose-700 border border-rose-200",
  Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  Low: "bg-sky-50 text-sky-700 border border-sky-200",
};

export default function RulesPage(): ReactElement {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Validation Rule Catalog
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-3xl">
          These Item Master data quality checks power the current MVP. A future phase could let
          finance and operations maintain this rulebook as a governed, auditable standard.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <article
            key={rule.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {rule.id}
                </p>
                <h2 className="text-lg font-semibold text-slate-900">{rule.name}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[rule.severity]}`}>
                {rule.severity}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{rule.description}</p>
            <dl className="grid gap-2 text-sm text-slate-600">
              <div className="flex flex-col">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Impacted tables
                </dt>
                <dd className="text-slate-700">{rule.impacted.join(", ")}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Primary owner
                </dt>
                <dd className="text-slate-700">{rule.owner}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}

