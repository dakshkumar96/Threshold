"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/api";
import InfoTip from "../components/InfoTip";
import SkillRoadmap from "../components/SkillRoadmap";
import SponsorCard from "../components/SponsorCard";
import { VISA_CONTENT } from "@/lib/visa-content";

export default function ResultsPage() {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sponsor_signal_results");
      if (!raw) return;
      setData(JSON.parse(raw) as AnalyzeResponse);
    } catch {
      setLoadError("Saved results were corrupted. Please run a new search.");
      sessionStorage.removeItem("sponsor_signal_results");
    }
  }, []);

  if (loadError) {
    return (
      <main className="pb-16 pt-10">
        <h1 className="m-0 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em]">
          Something went wrong with saved results
        </h1>
        <p className="mt-3 text-danger" role="alert">
          {loadError}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-gold px-4 font-semibold text-gold-ink no-underline"
        >
          Search again
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="pb-16 pt-10">
        <h1 className="m-0 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em]">
          No search yet
        </h1>
        <p className="mt-3 max-w-[50ch] text-muted">
          Run a role search to see licensed sponsors hiring now, skill demand, and
          an optional CV roadmap.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-gold px-4 font-semibold text-gold-ink no-underline"
        >
          Find sponsor roles
        </Link>
      </main>
    );
  }

  const hasCv = data.has_cv ?? data.score != null;
  const companyData = data.chart?.top_companies || data.top_companies || [];
  const stabilityNote = data.stability_caveat || "";
  const gapSuggestion = data.gap_suggestion;
  const skillsToLearn =
    data.skills_to_learn ||
    data.cv_feedback?.skills_to_learn ||
    data.gaps ||
    [];
  const marketSkills = (data.requirement_frequencies || []).slice(0, 10);
  const whereYouAre =
    data.where_you_are ||
    data.cv_feedback?.where_you_are ||
    data.cv_feedback?.first_impression ||
    null;
  const jobsInSkillAnalysis =
    data.jobs_in_skill_analysis ??
    data.jobs_scanned_for_skills ??
    data.jobs_total;
  const jdExcerpts =
    data.jd_excerpts_used ??
    data.cv_feedback?.jd_excerpts_used ??
    data.jobs_sent_to_llm ??
    data.cv_feedback?.jobs_reviewed ??
    null;
  const verified = data.jobs_verified ?? 0;
  const sponsorRoles = data.sponsors ?? [];
  const roleCount = sponsorRoles.length;
  const sponsorCount = new Set(
    sponsorRoles
      .map((s) => (s.matched_sponsor || s.company || "").trim().toLowerCase())
      .filter(Boolean),
  ).size;
  const cosTip = VISA_CONTENT.cos;
  const confTip = VISA_CONTENT.confidenceTiers;

  const roadmapSkills = hasCv
    ? skillsToLearn.map((s) => ({
        skill: s.skill,
        frequency_pct: s.frequency_pct,
        ease_weeks: s.ease_weeks,
        note: "note" in s ? s.note : null,
        priority_score: "priority_score" in s ? s.priority_score : null,
      }))
    : marketSkills.map((f) => ({
        skill: f.skill,
        frequency_pct: f.share_pct,
        ease_weeks: null,
        note: `Appears in ${f.share_pct}% of ads in this search.`,
      }));

  return (
    <main className="pb-20 pt-8 md:pt-10">
      <header className="motion-enter border-b border-line pb-8">
        <p className="m-0 text-sm font-medium text-muted">Role: {data.role}</p>
        <h1 className="mt-3 mb-0 max-w-[28ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
          {sponsorCount === 0
            ? `No licensed-sponsor matches yet for ${data.role}`
            : sponsorCount === 1
              ? `1 licensed sponsor is hiring for ${data.role}`
              : `${sponsorCount} licensed sponsors are hiring for ${data.role}`}
        </h1>
        <p className="mt-4 mb-0 max-w-[65ch] text-muted">
          {roleCount > 0
            ? `${roleCount} open ${roleCount === 1 ? "ad" : "ads"} from them, found in ${data.jobs_total} UK ads scanned`
            : `Scanned ${data.jobs_total} UK ads`}
          {verified > 0 ? ` · ${verified} verified from company boards` : ""}
          {data.jobs_sponsor_matched > 0
            ? ` · ${data.jobs_sponsor_matched} name-matched to the register (${data.match_rate_pct}%)`
            : ""}
          .
        </p>
        {data.experience_filter_note ? (
          <p className="mt-2 mb-0 text-sm text-ink-soft">
            {data.experience_filter_note}
          </p>
        ) : data.experience_level_requested &&
          data.experience_level_requested !== "any" ? (
          <p className="mt-2 mb-0 text-sm text-ink-soft">
            Experience focus: {data.experience_level_requested}
            {data.experience_filter_applied
              ? ` (${data.experience_jobs_count} ads in skill analysis)`
              : ""}
            .
          </p>
        ) : null}
        <p className="mt-3 mb-0 inline-flex flex-wrap items-center gap-2 text-sm text-muted">
          Confidence is evidence strength, not a visa decision
          <InfoTip label={confTip.label}>
            <span className="block">{confTip.body}</span>
            <span className="mt-2 block">
              <a href={confTip.href}>{confTip.linkLabel}</a>
            </span>
          </InfoTip>
          <InfoTip label={cosTip.label}>
            <span className="block">{cosTip.body}</span>
            <span className="mt-2 block">
              <a href={cosTip.href} target="_blank" rel="noreferrer">
                {cosTip.linkLabel}
              </a>
            </span>
          </InfoTip>
        </p>
        <p className="mt-2 mb-0 text-xs text-muted">{data.accuracy_note}</p>
      </header>

      {sponsorCount === 0 ? (
        <section className="mt-10 rounded-[14px] border border-line bg-navy-field p-5 text-[#e8edf5] md:p-6">
          <h2 className="m-0 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em]">
            Try a wider net
          </h2>
          <p className="mt-3 mb-0 max-w-[55ch] text-sm leading-relaxed opacity-90">
            No licensed-sponsor matches in this batch. Search again with a broader
            title, switch experience to Any level, remove a salary floor, or try a
            related role name.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-gold px-4 font-semibold text-gold-ink no-underline"
            >
              Search again
            </Link>
            <a
              href="#top-companies"
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#4a5c78] px-4 font-semibold text-[#e8edf5] no-underline"
            >
              See top employers below
            </a>
          </div>
        </section>
      ) : (
        <section aria-labelledby="opportunities-heading" className="mt-10">
          <h2
            id="opportunities-heading"
            className="m-0 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-ink"
          >
            Best opportunities
          </h2>
          <p className="mt-2 mb-0 max-w-[60ch] text-muted">
            Sorted verified first, then licence tenure, then recency.
            {stabilityNote ? ` ${stabilityNote}.` : ""}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4">
            {data.sponsors.map((s, i) => (
              <SponsorCard key={`${s.source}-${s.title}-${i}`} sponsor={s} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 border-t border-line pt-10">
        <SkillRoadmap
          score={hasCv ? data.score : null}
          skills={roadmapSkills}
          emptyHint={
            hasCv
              ? "No gaps against the top skill list - keep applying and refresh after new experience."
              : "No skill frequencies detected in this batch."
          }
        />
        {gapSuggestion ? (
          <p className="mt-4 mb-0 max-w-[65ch] text-sm text-ink-soft">
            {gapSuggestion}
          </p>
        ) : null}
        {!hasCv ? (
          <p className="mt-6 mb-0 max-w-[55ch] text-sm text-muted">
            Upload a CV on your next search to unlock your match score, priority
            gaps, and a recruiter-style review.
          </p>
        ) : null}
      </div>

      {hasCv ? (
        <section
          aria-labelledby="cv-heading"
          className="mt-14 border-t border-line pt-10"
        >
          <h2
            id="cv-heading"
            className="m-0 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-ink"
          >
            CV feedback
          </h2>
          {data.cv_feedback &&
          !data.cv_feedback.error &&
          (data.cv_feedback.first_impression || data.cv_feedback.full_report) ? (
            <div className="mt-6 space-y-8">
              <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                {data.cv_feedback.score_out_of_100 != null ? (
                  <p className="m-0 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.03em] text-ink">
                    {data.cv_feedback.score_out_of_100}
                    <span className="text-lg font-medium text-muted">/100</span>
                  </p>
                ) : null}
                {data.cv_feedback.bucket ? (
                  <p className="m-0 text-sm font-semibold text-ink-soft">
                    {data.cv_feedback.bucket}
                  </p>
                ) : null}
                {data.cv_feedback.would_put_forward ? (
                  <p className="m-0 text-sm text-muted">
                    Recruiter verdict: {data.cv_feedback.would_put_forward}
                  </p>
                ) : null}
              </div>

              <div>
                <h3 className="m-0 text-base font-semibold text-ink">
                  Where you are now
                </h3>
                <p className="mt-2 mb-0 max-w-[65ch] text-ink-soft">
                  {whereYouAre || data.cv_feedback.first_impression}
                </p>
                {(data.matched_skills || []).length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2 p-0 list-none">
                    {data.matched_skills.map((m) => (
                      <li
                        key={m.skill}
                        className="rounded-full bg-signal-soft px-3 py-1 text-xs font-semibold text-signal"
                      >
                        {m.skill} · {m.frequency_pct}%
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 mb-0 text-sm text-muted">
                    None of the top skills detected in your CV yet.
                  </p>
                )}
              </div>

              <div>
                <h3 className="m-0 text-base font-semibold text-ink">
                  What to build next
                </h3>
                <p className="mt-2 mb-0 max-w-[65ch] text-ink-soft">
                  {data.cv_feedback.one_thing_to_fix_first ||
                    "Use the skill roadmap above as your next practice order."}
                </p>
                {(data.cv_feedback.top_3_gaps || []).length > 0 ? (
                  <p className="mt-3 mb-0 text-sm text-muted">
                    Gaps: {(data.cv_feedback.top_3_gaps || []).join(" · ")}
                  </p>
                ) : null}
                {(data.cv_feedback.top_3_strengths || []).length > 0 ? (
                  <p className="mt-2 mb-0 text-sm text-muted">
                    Strengths: {(data.cv_feedback.top_3_strengths || []).join(" · ")}
                  </p>
                ) : null}
              </div>

              <p className="m-0 text-xs text-muted">
                Skills from {data.cv_feedback.jobs_in_skill_analysis ?? jobsInSkillAnalysis}{" "}
                UK ads
                {(data.cv_feedback.jd_excerpts_used ?? jdExcerpts) != null
                  ? `; narrative from aggregates + ${
                      data.cv_feedback.jd_excerpts_used ?? jdExcerpts
                    } excerpts`
                  : ""}
                . Your CV may have been sent to a third-party LLM.
              </p>

              {data.cv_feedback.full_report ? (
                <div>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center border-0 bg-transparent p-0 text-sm font-semibold text-ink underline-offset-2 hover:underline"
                    aria-expanded={reportOpen}
                    onClick={() => setReportOpen((v) => !v)}
                  >
                    {reportOpen ? "Hide full recruiter review" : "Show full recruiter review"}
                  </button>
                  {reportOpen ? (
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                      {data.cv_feedback.full_report}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <p className="m-0 text-muted">{data.llm_message}</p>
              {data.cv_feedback?.error ? (
                <p className="mt-3 text-danger" role="alert">
                  {data.cv_feedback.error}
                </p>
              ) : null}
              {whereYouAre ? (
                <p className="mt-4 max-w-[65ch] text-ink-soft">{whereYouAre}</p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <section
        id="top-companies"
        aria-labelledby="companies-heading"
        className="mt-14 border-t border-line pt-10"
      >
        <h2
          id="companies-heading"
          className="m-0 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em] text-ink"
        >
          Top companies hiring now
        </h2>
        <p className="mt-2 mb-0 max-w-[60ch] text-sm text-muted">
          {data.top_companies_are_sponsors
            ? "Most ads among licensed-sponsor matches in this search."
            : "No licensed-sponsor matches - showing top employers from all ads (not verified sponsors)."}
        </p>
        {companyData.length === 0 ? (
          <p className="mt-4 text-muted">No company counts available.</p>
        ) : (
          <ul className="mt-6 list-none divide-y divide-line border-t border-line p-0">
            {companyData.map((c) => (
              <li
                key={c.company}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <div>
                  <span className="font-semibold text-ink">{c.company}</span>
                  {c.stability_band ? (
                    <span className="ml-2 text-xs text-muted">{c.stability_band}</span>
                  ) : null}
                </div>
                <span className="text-sm text-muted">
                  {c.jobs} ad{c.jobs === 1 ? "" : "s"} · {c.location}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!hasCv && marketSkills.length > 0 ? (
        <section
          aria-labelledby="market-skills-heading"
          className="mt-14 border-t border-line pt-10"
        >
          <h2
            id="market-skills-heading"
            className="m-0 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em] text-ink"
          >
            Market skills in this role&apos;s ads
          </h2>
          <ul className="mt-6 list-none divide-y divide-line border-t border-line p-0">
            {marketSkills.map((f) => (
              <li
                key={f.skill}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span className="font-medium text-ink">{f.skill}</span>
                <span className="shrink-0 text-sm text-muted">{f.share_pct}%</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-14 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/" className="font-semibold text-ink">
          New search
        </Link>
        <Link href="/methodology" className="text-muted">
          Methodology
        </Link>
      </p>
    </main>
  );
}
