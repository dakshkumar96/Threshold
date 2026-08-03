"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowRight, FileText } from "@phosphor-icons/react";
import type { AnalyzeResponse } from "@/lib/api";
import {
  extractScoreLines,
  parseFullReport,
  scoreTone,
  splitLeadBold,
  splitVerdictBullets,
} from "@/lib/cv-report-utils";
import ScoreRing from "./ScoreRing";

const SKILL_WORD =
  /\b(JavaScript|TypeScript|Python|Photoshop|Illustrator|Figma|React|Next\.?js|Node\.?js|Agile|Scrum|SQL|Excel|AWS|Azure|Docker|Kubernetes|Communication|Leadership)\b/gi;

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

function KeywordLine({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  const re = new RegExp(SKILL_WORD.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(<strong key={`${m.index}-${m[0]}`}>{m[0]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes.length ? nodes : text}</>;
}

export default function CvReviewTrigger({ data }: { data: AnalyzeResponse }) {
  const fb = data.cv_feedback;
  const score = data.score ?? fb?.score_out_of_100 ?? null;
  const snapshot = data.where_you_are || fb?.where_you_are;
  const fixFirst = fb?.one_thing_to_fix_first || data.gap_suggestion;
  const verdictBullets = snapshot ? splitVerdictBullets(snapshot) : [];
  const fixParts = fixFirst ? splitLeadBold(fixFirst) : null;

  const previewScores = useMemo(() => {
    if (!fb?.full_report) return [];
    const sections = parseFullReport(fb.full_report);
    const scoreSec =
      sections.find((s) => /score/i.test(s.title)) ||
      sections.find((s) => extractScoreLines(s).scores.length >= 3);
    if (!scoreSec) return [];
    return extractScoreLines(scoreSec).scores.filter((s) => s.max === 20).slice(0, 5);
  }, [fb?.full_report]);

  if (!data.has_cv) {
    return (
      <section className="cv-trigger" aria-label="CV panel">
        <div className="cv-trigger__head">
          <h2 className="cv-trigger__title">CV review</h2>
          <a href="/search" className="cv-trigger__open">
            Upload CV
            <ArrowRight size={14} weight="bold" aria-hidden />
          </a>
        </div>
        <p className="cv-trigger__empty">
          Upload a CV on search to get a match score and a hiring-style report.
        </p>
      </section>
    );
  }

  return (
    <section className="cv-trigger" aria-label="CV panel">
      <div className="cv-trigger__head">
        <h2 className="cv-trigger__title">CV review</h2>
        <div className="cv-trigger__score">
          <ScoreRing score={score} size={80} showValue />
          <div className="cv-trigger__score-copy">
            <p className="cv-trigger__score-label">
              {data.score_label || fb?.bucket || "Match score"}
            </p>
          </div>
        </div>
        <Link href="/results/cv-review" className="cv-trigger__open">
          <FileText size={15} weight="duotone" aria-hidden />
          {fb?.full_report ? "Open full review" : "CV review"}
          <ArrowRight size={13} weight="bold" aria-hidden />
        </Link>
      </div>

      <div
        className="cv-trigger__body"
        data-split={
          verdictBullets.length > 0 &&
          (fixFirst || previewScores.length > 0)
            ? "true"
            : undefined
        }
      >
        {verdictBullets.length > 0 ? (
          <div className="cv-verdict" data-tone="verdict">
            <p className="cv-verdict__label">Final verdict</p>
            {verdictBullets.length === 1 ? (
              <p className="cv-verdict__text">
                <KeywordLine text={verdictBullets[0]} />
              </p>
            ) : (
              <ul className="cv-verdict__list">
                {verdictBullets.map((b, i) => (
                  <li key={b.slice(0, 48)} data-lead={i === 0 ? "true" : undefined}>
                    <KeywordLine text={b} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {fixFirst || previewScores.length > 0 || (data.llm_message && !fb?.full_report) ? (
          <div className="cv-trigger__aside">
            {fixFirst ? (
              <div className="cv-trigger__fix">
                <strong className="cv-trigger__fix-label">Fix first</strong>
                <p className="cv-trigger__fix-body">
                  {fixParts ? (
                    <>
                      <span className="cv-trigger__fix-action">{fixParts.lead}</span>
                      {fixParts.rest ? (
                        <span className="cv-trigger__fix-note"> {fixParts.rest}</span>
                      ) : null}
                    </>
                  ) : (
                    <BoldLine text={fixFirst} />
                  )}
                </p>
              </div>
            ) : null}

            {previewScores.length > 0 ? (
              <ul className="cv-trigger__scores" aria-label="Rubric preview">
                {previewScores.map((s) => {
                  const pct = s.max > 0 ? Math.round((s.score / s.max) * 100) : 0;
                  return (
                    <li key={s.label} data-tone={scoreTone(s.score, s.max)}>
                      <div className="cv-trigger__score-row">
                        <strong>{s.label}</strong>
                        <span>
                          {s.score}
                          <em>/{s.max}</em>
                        </span>
                      </div>
                      <div className="cv-trigger__score-track" aria-hidden>
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {data.llm_message && !fb?.full_report ? (
              <p className="cv-trigger__note">{data.llm_message}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
