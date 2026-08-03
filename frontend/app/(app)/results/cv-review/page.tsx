"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/api";
import { RESULTS_DEMO } from "@/lib/results-demo";
import CvFullReview from "@/app/components/results/CvFullReview";

export default function CvReviewPage() {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sponsor_signal_results");
      if (!raw) {
        if (process.env.NODE_ENV === "development") {
          sessionStorage.setItem("sponsor_signal_results", JSON.stringify(RESULTS_DEMO));
          setData(RESULTS_DEMO);
        }
        return;
      }
      setData(JSON.parse(raw) as AnalyzeResponse);
    } catch {
      setLoadError("Saved results were corrupted. Please run a new search.");
      sessionStorage.removeItem("sponsor_signal_results");
    }
  }, []);

  if (loadError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-[var(--color-danger)]">{loadError}</p>
        <Link href="/search" className="mt-4 inline-block text-sm font-medium text-[var(--color-gold-dark)]">
          New search
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-medium text-ink">No results yet</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Run a search to see sponsored roles, your match score, and a skill plan.
        </p>
        <Link
          href="/search"
          className="cta-primary mt-6 inline-flex"
          style={{ minHeight: 44, padding: "0 1.25rem", textDecoration: "none" }}
        >
          Search sponsors
        </Link>
      </main>
    );
  }

  if (!data.has_cv) {
    return (
      <main className="cv-full cv-full--empty">
        <div className="cv-full__empty-inner">
          <h1>CV review</h1>
          <p>Upload a CV on search to get a match score and a hiring-style report.</p>
          <a href="/search" className="cv-panel__cta">
            Upload CV
          </a>
          <Link href="/results" className="cv-full__back cv-full__back--solo">
            Back to results
          </Link>
        </div>
      </main>
    );
  }

  return <CvFullReview data={data} />;
}
