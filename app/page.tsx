"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ValidationResult, ValidationIssue, IssueSeverity } from "@/lib/itemMasterValidation";

// Helper component for severity badge
function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const styles = {
    high: "bg-rose-50 text-rose-700 border border-rose-100",
    medium: "bg-amber-50 text-amber-700 border border-amber-100",
    low: "bg-sky-50 text-sky-700 border border-sky-100",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

export default function Page() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const authed = sessionStorage.getItem("curium-demo-authed");
    if (!authed) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    // Clear previous result when selecting a new file
    if (selectedFile) {
      setResult(null);
      setAiSummary(null);
      setAiError(null);
      setAiLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      setError("Please select an Excel file before validating.");
      return;
    }

    setLoading(true);
    setError(null);
    // Reset AI-related state when validation starts
    setAiSummary(null);
    setAiError(null);
    setAiLoading(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/validate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Validation failed. Please try again.");
        setResult(null);
        return;
      }

      const data: ValidationResult = await response.json();
      setResult(data);

      // After successful validation, call /api/summary
      setAiLoading(true);
      setAiError(null);

      try {
        const summaryRes = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!summaryRes.ok) {
          const errJson = await summaryRes.json().catch(() => null);
          const msg =
            errJson?.error || "Failed to generate AI summary. Please try again later.";
          setAiError(msg);
          setAiSummary(null);
        } else {
          const summaryJson = await summaryRes.json();
          const text =
            typeof summaryJson?.summary === "string" ? summaryJson.summary : "";
          if (text) {
            setAiSummary(text);
          } else {
            setAiError("AI summary is not available. Please review the issues table.");
            setAiSummary(null);
          }
        }
      } catch (e) {
        console.error("Error calling /api/summary:", e);
        setAiError("Unable to generate AI summary due to a server error.");
        setAiSummary(null);
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setResult(null);
      console.error("Validation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const issuesToShow = result ? result.issues.slice(0, 200) : [];

  // Don't render content until auth check is complete
  if (isChecking) {
    return null;
  }

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <header className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            Finance &amp; Operations Data Quality
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Curium Item Master Quality Check
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl">
              Upload your Item Master workbook, validate cross-site data quality, and get a clear
              narrative of the issues that finance and operations leaders should care about.
            </p>
          </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
        {/* Left Column: Upload, Summary, Issues */}
        <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 p-6 space-y-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#D12B8A] to-[#5C3C92]" />
              <div className="pt-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Upload Item Master File
                </h2>
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="file-input"
                  className="block text-sm font-medium text-slate-600"
                >
                  Select Excel File (.xlsx)
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleValidate}
                  disabled={loading || !file}
                  className="w-full px-6 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#D12B8A] to-[#5C3C92] shadow-sm hover:shadow-md hover:-translate-y-[1px] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#D12B8A]/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Validating...
                    </span>
                  ) : (
                    "Validate Item Master"
                  )}
                </button>
                <p className="text-xs text-slate-500">
                  We don’t store your file. Validation runs securely in this session.
                </p>
                {error && (
                  <div className="mt-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            {result && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    Validation Snapshot
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instant view of your uploaded Item Master
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Items",
                      value: result.stats.total_items,
                    },
                    {
                      label: "Total Sites",
                      value: result.stats.total_sites,
                    },
                    {
                      label: "Item-Site Pairs",
                      value: result.stats.total_item_sites,
                    },
                    {
                      label: "Total Issues",
                      value: result.stats.total_issues,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden"
                    >
                      <span className="absolute inset-x-4 top-3 h-1 rounded-full bg-gradient-to-r from-[#D12B8A] to-[#5C3C92] opacity-20" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Issues Table */}
          {result && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-900">Validation Issues</h2>
                    {result.issues.length > 200 && (
                      <p className="text-xs text-slate-500">
                        Showing first 200 of {result.issues.length} results
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {result.issues.length} issues
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Severity", "Rule", "Site", "Item #", "Item Description", "Message"].map(
                          (col) => (
                            <th key={col} className="px-5 py-3 whitespace-nowrap">
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {issuesToShow.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-8 text-center text-slate-500"
                          >
                            No issues found. All validations passed!
                          </td>
                        </tr>
                      ) : (
                        issuesToShow.map((issue: ValidationIssue, index: number) => (
                          <tr
                            key={index}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-5 py-3 whitespace-nowrap">
                              <SeverityBadge severity={issue.severity} />
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-900">
                              {issue.rule_id}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                              {issue.site || "—"}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap font-semibold text-slate-900">
                              {issue.item_number}
                            </td>
                            <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                              {issue.item_description || "—"}
                            </td>
                            <td className="px-5 py-3 text-slate-700">
                              {issue.message}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {/* Recommended Next Steps */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Recommended Next Steps
              </h2>
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                From validation &amp; AI insights
              </span>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
              <li>
                Review cost setup for high-severity items with missing inventory costs before the next close.
              </li>
              <li>
                Align unit-of-measure definitions between procurement and finance teams for items flagged with mismatches.
              </li>
              <li>
                Confirm item class mapping for records driving significant inventory balances and correct non-standard classes.
              </li>
              <li>
                Plan a quarterly Item Master data quality review with finance, operations, and IT stakeholders.
              </li>
            </ul>
          </section>
        </div>

        {/* Right Column: AI Summary Panel */}
        <div>
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 flex flex-col gap-4 h-full lg:sticky lg:top-24">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  AI Summary &amp; Insights
                </h2>
                <p className="text-xs text-slate-500 uppercase tracking-[0.18em]">
                  Narrative view of your Item Master data quality.
                </p>
              </div>
              {!result ? (
                <div className="text-sm text-slate-500 leading-relaxed">
                  Upload an Item Master file and run validation to see a summary here.
                </div>
              ) : (
                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                  {aiLoading ? (
                    <div className="inline-flex items-center gap-2 text-slate-600">
                      <svg
                        className="animate-spin h-4 w-4 text-indigo-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="font-medium">Generating AI summary…</span>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        let summaryText: string | null = null;
                        if (aiSummary) {
                          summaryText = aiSummary;
                        } else if (result?.summary) {
                          summaryText = result.summary;
                        }

                        return summaryText ? (
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {aiSummary ? "AI Summary" : "Summary"}
                            </h3>
                            <p className="whitespace-pre-wrap text-slate-700">
                              {summaryText}
                            </p>
                          </div>
                        ) : null;
                      })()}
                      {aiError && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          {aiError}
                        </p>
                      )}
                      {!aiSummary && result?.summary && !aiError && (
                        <p className="text-xs text-slate-500 italic">
                          In a future version, this panel will be powered by an LLM to generate
                          deeper insights and explanations.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                Powered by an internal LLM using your validation results. Preview feature.
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

