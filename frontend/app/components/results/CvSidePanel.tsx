"use client";

import { useEffect, useId, useState } from "react";
import { ArrowRight, FileText, X } from "@phosphor-icons/react";
import type { AnalyzeResponse } from "@/lib/api";
import { splitLeadBold, splitVerdictBullets } from "@/lib/cv-report-utils";
import ScoreRing from "./ScoreRing";

function BoldLine({ text }: { text: string }) {
  const parts = splitLeadBold(text);
  if (!parts) return <>{text}</>;
  return (
    <>
      <strong>{parts.lead}</strong>
      {parts.rest ? ` ${parts.rest}` : ""}
    </>
  );
}

export default function CvSidePanel({ data }: { data: AnalyzeResponse }) {
  const [reportOpen, setReportOpen] = useState(false);
  const titleId = useId();
  const fb = data.cv_feedback;
  const score = data.score ?? fb?.score_out_of_100 ?? null;
  const strengths = (fb?.top_3_strengths || []).slice(0, 3);
  const gaps = (fb?.top_3_gaps || []).slice(0, 3);
  const fixFirst = fb?.one_thing_to_fix_first || data.gap_suggestion;
  const snapshot = data.where_you_are || fb?.where_you_are;

  useEffect(() => {
    if (!reportOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReportOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [reportOpen]);

  if (!data.has_cv) {
    return (
      <aside className="dash-card results-side cv-panel" aria-label="CV panel">
        <h2 className="cv-panel__title">CV review</h2>
        <p className="cv-panel__empty">
          Upload a CV on search to get a match score and a hiring-style report.
        </p>
        <a href="/search" className="cv-panel__cta">
          Upload CV
          <ArrowRight size={14} weight="bold" aria-hidden />
        </a>
      </aside>
    );
  }

  return (
    <>
      <aside className="dash-card results-side cv-panel" aria-label="CV panel">
        <h2 className="cv-panel__title">CV review</h2>

        <div className="cv-panel__score">
          <ScoreRing score={score} size={88} showValue />
          <div>
            <p className="cv-panel__score-label">
              {data.score_label || fb?.bucket || "Match score"}
            </p>
          </div>
        </div>

        {snapshot ? (
          <div className="cv-verdict" data-tone="verdict">
            <p className="cv-verdict__label">Final verdict</p>
            {(() => {
              const bullets = splitVerdictBullets(snapshot);
              if (bullets.length <= 1) {
                return (
                  <p className="cv-verdict__text">
                    <BoldLine text={bullets[0] || snapshot} />
                  </p>
                );
              }
              return (
                <ul className="cv-verdict__list">
                  {bullets.map((b) => (
                    <li key={b.slice(0, 48)}>
                      <BoldLine text={b} />
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        ) : null}

        {fixFirst ? (
          <div className="cv-panel__fix">
            <strong>Fix first</strong>
            <p>
              <BoldLine text={fixFirst} />
            </p>
          </div>
        ) : null}

        {strengths.length > 0 ? (
          <div className="cv-panel__list">
            <h3>Strengths</h3>
            <ul>
              {strengths.map((s) => (
                <li key={s} data-tone="good">
                  <BoldLine text={s} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {gaps.length > 0 ? (
          <div className="cv-panel__list">
            <h3>Gaps</h3>
            <ul>
              {gaps.map((s) => (
                <li key={s} data-tone="gap">
                  <BoldLine text={s} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {fb?.full_report ? (
          <button
            type="button"
            className="cv-panel__open-report"
            onClick={() => setReportOpen(true)}
          >
            <FileText size={16} weight="duotone" aria-hidden />
            Open full review
            <ArrowRight size={14} weight="bold" aria-hidden />
          </button>
        ) : data.llm_message ? (
          <p className="cv-panel__note">{data.llm_message}</p>
        ) : null}
      </aside>

      {reportOpen && fb?.full_report ? (
        <div
          className="cv-report-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="cv-report-overlay__backdrop"
            aria-label="Close full review"
            onClick={() => setReportOpen(false)}
          />
          <div className="cv-report-overlay__sheet">
            <header className="cv-report-overlay__header">
              <div>
                <h2 id={titleId}>Full CV review</h2>
                <p>
                  {data.role || "This role"}
                  {score != null ? ` · ${Math.round(score)}% match` : ""}
                </p>
              </div>
              <button
                type="button"
                className="cv-report-overlay__close"
                aria-label="Close"
                onClick={() => setReportOpen(false)}
              >
                <X size={18} weight="bold" />
              </button>
            </header>
            <div className="cv-report-overlay__body">
              <pre>{fb.full_report}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
