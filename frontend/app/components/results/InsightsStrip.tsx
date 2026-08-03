"use client";

import insights from "@/data/insights.json";
import type { AnalyzeResponse } from "@/lib/api";
import { confidenceCounts } from "@/lib/results-utils";

export default function InsightsStrip({ data }: { data: AnalyzeResponse }) {
  const sponsors = data.sponsors || [];
  const conf = confidenceCounts(sponsors);
  const head = insights.headline;

  return (
    <section className="insights-compact" aria-label="Context">
      <p>
        <strong>{sponsors.length}</strong> roles ·{" "}
        <strong>{conf.verified}</strong> verified · register tracks{" "}
        <strong>{head.sponsors_tracked.toLocaleString()}</strong> sponsors
      </p>
      <a href="/insights">Insights & method →</a>
    </section>
  );
}
