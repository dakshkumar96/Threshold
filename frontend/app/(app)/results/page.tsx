"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/api";
import { useUserApi } from "@/lib/user-api";
import {
  loadBookmarks,
  pushHistory,
  toggleBookmark,
  type Sponsor,
} from "@/lib/results-utils";
import { RESULTS_DEMO } from "@/lib/results-demo";
import DataOverviewStrip from "@/app/components/results/DataOverviewStrip";
import ShortlistSection from "@/app/components/results/ShortlistSection";
import GapRoadmap from "@/app/components/results/GapRoadmap";
import SponsorList from "@/app/components/results/SponsorList";
import CvReviewTrigger from "@/app/components/results/CvReviewTrigger";
import JdAnalysisDrawer from "@/app/components/results/JdAnalysisDrawer";

export default function ResultsPage() {
  const api = useUserApi();
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<Sponsor | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);

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

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  useEffect(() => {
    if (!data) return;
    if (data.has_cv && data.score != null) {
      pushHistory(data.role || "role", data.score);
    }
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const sponsors = (data.sponsors || []).slice(0, 5).map((s) => ({
      company: s.company,
      title: s.title,
      stability_band: s.stability_band,
      sponsor_confidence: s.sponsor_confidence,
    }));
    const gaps = (data.skills_to_learn || data.gaps || []).slice(0, 5).map((g) => ({
      skill: g.skill,
      frequency_pct: g.frequency_pct ?? undefined,
      ease_weeks: "ease_weeks" in g ? g.ease_weeks ?? undefined : undefined,
    }));
    const uniqueSponsors = new Set(
      (data.sponsors || [])
        .map((s) => (s.matched_sponsor || s.company || "").trim().toLowerCase())
        .filter(Boolean),
    ).size;
    void api
      .putLastMatch({
        role: data.role,
        score: data.score,
        gaps,
        sponsors,
        top_companies: (data.chart?.top_companies || data.top_companies || []).slice(0, 5),
        requirement_frequencies: (data.requirement_frequencies || []).slice(0, 10),
        where_you_are: data.where_you_are || data.cv_feedback?.where_you_are || null,
        jobs_total: data.jobs_total,
        sponsor_count: uniqueSponsors,
      })
      .then(() => setSaveNote("Saved to your account"))
      .catch(() => {
        /* guest or offline */
      });
  }, [data, api]);

  const onBookmark = useCallback((url: string) => {
    setBookmarks((prev) => toggleBookmark(url, prev));
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

  const sponsors = data.sponsors || [];

  return (
    <main className="results-page mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10">
      <div className="results-page__bar">
        <h1 className="results-page__role">{data.role}</h1>
        <div className="results-page__actions">
          {saveNote ? <span className="results-page__saved">{saveNote}</span> : null}
          <Link href="/search" className="results-page__new">
            New search
          </Link>
        </div>
      </div>

      <div className="results-stack">
        {/* 1. Data */}
        <DataOverviewStrip data={data} />
        <CvReviewTrigger data={data} />
        <GapRoadmap data={data} />

        {/* 2. Top 5 */}
        <ShortlistSection
          sponsors={sponsors}
          bookmarks={bookmarks}
          onBookmark={onBookmark}
          onOpen={setDrawer}
          salaryThreshold={data.skilled_worker_salary_threshold}
          isNewEntrant={data.is_new_entrant}
        />

        {/* 3. All jobs */}
        <SponsorList
          sponsors={sponsors}
          bookmarks={bookmarks}
          onBookmark={onBookmark}
          salaryThreshold={data.skilled_worker_salary_threshold}
          isNewEntrant={data.is_new_entrant}
        />
      </div>

      <JdAnalysisDrawer sponsor={drawer} onClose={() => setDrawer(null)} />
    </main>
  );
}
