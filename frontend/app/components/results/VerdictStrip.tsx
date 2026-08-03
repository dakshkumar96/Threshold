"use client";

import type { AnalyzeResponse } from "@/lib/api";
import { confidenceCounts, readinessLine } from "@/lib/results-utils";
import { Briefcase, Buildings, SealCheck } from "@phosphor-icons/react";

export default function VerdictStrip({ data }: { data: AnalyzeResponse }) {
  const sponsors = data.sponsors || [];
  const counts = confidenceCounts(sponsors);
  const unique = new Set(
    sponsors
      .map((s) => (s.matched_sponsor || s.company || "").trim().toLowerCase())
      .filter(Boolean),
  ).size;

  const stats = [
    {
      n: data.jobs_total != null ? String(data.jobs_total) : "N/A",
      l: "Ads scanned",
      Icon: Briefcase,
    },
    {
      n: String(unique),
      l: "Sponsors",
      Icon: Buildings,
    },
    {
      n: String(counts.verified),
      l: "Verified",
      Icon: SealCheck,
      tone: "signal" as const,
    },
  ];

  return (
    <section className="verdict-hero" aria-label="Search verdict">
      <div className="verdict-hero__copy">
        <h1>
          {unique > 0 ? (
            <>
              {unique} licensed sponsor{unique === 1 ? "" : "s"} for{" "}
              <em>{data.role || "this role"}</em>
            </>
          ) : (
            <>No licensed sponsors for {data.role || "this role"}</>
          )}
        </h1>
        <p className="verdict-hero__meta">
          <span data-tone="signal">{counts.verified} verified</span>
          <span>{counts.likely} likely</span>
          <span data-tone="warn">{counts.possible} possible</span>
        </p>
        <p className="verdict-hero__readiness">{readinessLine(data)}</p>
        {!data.has_cv ? (
          <a href="/search" className="verdict-hero__link">
            Upload CV for a match score →
          </a>
        ) : null}
      </div>

      <div className="verdict-hero__stats">
        {stats.map(({ n, l, Icon, tone }) => (
          <div key={l} className="verdict-stat" data-tone={tone || undefined}>
            <Icon size={18} weight="duotone" aria-hidden />
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
