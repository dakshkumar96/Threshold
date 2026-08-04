"use client";

import { useEffect } from "react";
import { applyVerdict, salaryClass, type Sponsor } from "@/lib/results-utils";
import ConfidenceBadge from "../ConfidenceBadge";
import InfoTip from "../InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";

export default function JdAnalysisDrawer({
  sponsor,
  onClose,
}: {
  sponsor: Sponsor | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!sponsor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sponsor, onClose]);

  if (!sponsor) return null;

  const verdict = applyVerdict(sponsor);
  const salary = VISA_CONTENT.salaryThreshold;
  const essential = (sponsor.jd_skills || []).filter((j) => j.essential);
  const desirable = (sponsor.jd_skills || []).filter((j) => !j.essential);
  const matched = new Set((sponsor.cv_matched_skills || []).map((s) => s.toLowerCase()));

  return (
    <>
      <button
        type="button"
        className="jd-drawer-backdrop border-0 p-0"
        aria-label="Close analysis"
        onClick={onClose}
      />
      <aside className="jd-drawer" role="dialog" aria-modal="true" aria-label="Job analysis">
        <div className="flex items-start justify-between gap-3">
          <div>
            <ConfidenceBadge
              confidence={sponsor.sponsor_confidence}
              matchScore={sponsor.match_score}
              source={sponsor.source}
            />
            <h2 className="mt-3 mb-1 text-xl font-medium text-ink">{sponsor.title}</h2>
            <p className="m-0 text-sm text-ink-soft">{sponsor.company}</p>
          </div>
          <button type="button" className="filter-pill" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          className={`jd-drawer__verdict mt-4 rounded-xl p-3 text-sm jd-drawer__verdict--${
            verdict.kind === "now" ? "now" : verdict.kind === "later" ? "later" : "no"
          }`}
        >
          <p className="m-0 text-xs font-medium uppercase tracking-wider text-muted">
            Apply verdict
          </p>
          <p className="mt-1 mb-0 text-ink-soft">{verdict.label}</p>
        </div>

        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Location</dt>
            <dd className="m-0 text-right text-ink">{sponsor.location || "Not stated"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="inline-flex items-center gap-1 text-muted">
              Salary
              <InfoTip label={salary.label}>
                <span className="block">{salary.body}</span>
              </InfoTip>
            </dt>
            <dd className={`m-0 text-right ${salaryClass(sponsor.salary_vs_threshold)}`}>
              {sponsor.salary_display || "Not stated"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Licence band</dt>
            <dd className="m-0 text-right text-ink">
              {sponsor.stability_band || "Unknown"}
              {sponsor.licence_years != null ? ` · ~${sponsor.licence_years}y` : ""}
            </dd>
          </div>
          {sponsor.cv_overlap_total != null && sponsor.cv_overlap_total > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">CV overlap</dt>
              <dd className="m-0 text-right text-ink">
                {sponsor.cv_overlap_count}/{sponsor.cv_overlap_total} skills
              </dd>
            </div>
          ) : null}
        </dl>

        {sponsor.jd_text_limited || !sponsor.jd_skills?.length ? (
          <p className="mt-4 mb-0 text-sm text-muted">
            Limited JD text from this source. we can’t invent per-job skill ticks. Open the
            listing for the full description.
          </p>
        ) : (
          <>
            {essential.length > 0 ? (
              <SkillList title="Essential (from JD wording)" skills={essential} matched={matched} />
            ) : null}
            {desirable.length > 0 ? (
              <SkillList
                title={essential.length ? "Also mentioned" : "Skills in this JD"}
                skills={desirable}
                matched={matched}
              />
            ) : null}
          </>
        )}

        {sponsor.cv_missing_skills && sponsor.cv_missing_skills.length > 0 ? (
          <div className="mt-4">
            <p className="m-0 text-xs font-medium uppercase tracking-wider text-muted">
              Gaps for this role
            </p>
            <ul className="mt-2 mb-0 list-disc pl-4 text-sm text-ink-soft">
              {sponsor.cv_missing_skills.slice(0, 10).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {sponsor.description_excerpt ? (
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-medium text-ink">
              JD excerpt
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
              {sponsor.description_excerpt}
            </p>
          </details>
        ) : null}

        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="cta-primary mt-6 inline-flex w-full justify-center"
            style={{
              minHeight: 44,
              textDecoration: "none",
              fontSize: "0.9375rem",
            }}
          >
            Open listing
          </a>
        ) : null}
      </aside>
    </>
  );
}

function SkillList({
  title,
  skills,
  matched,
}: {
  title: string;
  skills: { skill: string; essential?: boolean }[];
  matched: Set<string>;
}) {
  return (
    <div className="mt-4">
      <p className="m-0 text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
      <ul className="mt-2 mb-0 grid list-none gap-1.5 p-0">
        {skills.map((j) => {
          const hit = matched.has(j.skill.toLowerCase());
          return (
            <li key={j.skill} className="flex items-center gap-2 text-sm text-ink-soft">
              <span className={hit ? "text-signal" : "text-warning"}>{hit ? "✓" : "○"}</span>
              {j.skill}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
