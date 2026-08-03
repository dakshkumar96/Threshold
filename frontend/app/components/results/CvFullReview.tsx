"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChartBar,
  Lightning,
  Path,
  Sparkle,
  Target,
  X,
} from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyzeResponse } from "@/lib/api";
import {
  buildSkillPlan,
  extractScoreLines,
  parseFullReport,
  parsePutForward,
  putForwardFromSummary,
  scoreTone,
  sectionTone,
  splitLeadBold,
  splitVerdictBullets,
  type PutForwardResult,
  type ScoreLine,
} from "@/lib/cv-report-utils";
import { estimatedMatchLift, weeksEstimate } from "@/lib/results-utils";
import ScoreRing from "./ScoreRing";

const TICK = "#6B7280";
const GRID = "rgba(99,102,241,0.1)";

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

function PutForwardBadge({ result }: { result: PutForwardResult }) {
  return (
    <div className="cv-put-forward" data-decision={result.decision}>
      <span className="cv-put-forward__pill">
        <span className="cv-put-forward__label">Put forward</span>
        <strong className="cv-put-forward__value">{result.label}</strong>
      </span>
      {result.reason ? (
        <p className="cv-put-forward__reason">{result.reason}</p>
      ) : null}
    </div>
  );
}

function ReportBodyText({ text }: { text: string }) {
  const put = parsePutForward(text);
  if (put) return <PutForwardBadge result={put} />;
  return (
    <p className="cv-full__report-line">
      <BoldLine text={text} />
    </p>
  );
}

function ReportBullet({ text }: { text: string }) {
  const put = parsePutForward(text);
  if (put) return <PutForwardBadge result={put} />;
  return (
    <li>
      <BoldLine text={text} />
    </li>
  );
}

export default function CvFullReview({
  data,
  onClose,
}: {
  data: AnalyzeResponse;
  onClose?: () => void;
}) {
  const fb = data.cv_feedback;
  const score = data.score ?? fb?.score_out_of_100 ?? null;
  const strengths = fb?.top_3_strengths || [];
  const gaps = fb?.top_3_gaps || [];
  const fixFirst = fb?.one_thing_to_fix_first || data.gap_suggestion;
  const snapshot = data.where_you_are || fb?.where_you_are;
  const plan = useMemo(() => buildSkillPlan(data), [data]);
  const reportSections = useMemo(
    () => (fb?.full_report ? parseFullReport(fb.full_report) : []),
    [fb?.full_report],
  );
  const liftTo = estimatedMatchLift(data);
  const from = score != null ? Math.round(score) : null;
  const weeks = weeksEstimate(data);
  const totalWeeks = plan.length ? plan[plan.length - 1].end : 0;
  const putForward = useMemo(() => {
    const fromJson = putForwardFromSummary(fb?.would_put_forward);
    if (fromJson) return fromJson;
    const sec = reportSections.find((s) => /put forward/i.test(s.title));
    if (!sec) return null;
    for (const line of [...sec.bullets, ...sec.paragraphs]) {
      const parsed = parsePutForward(line);
      if (parsed) return parsed;
    }
    return null;
  }, [fb, reportSections]);

  const timelineData = plan.map((s) => ({
    skill: s.skill.length > 16 ? `${s.skill.slice(0, 14)}…` : s.skill,
    full: s.skill,
    start: s.start,
    span: s.span,
    end: s.end,
    freq: s.frequency_pct != null ? Math.round(s.frequency_pct) : null,
  }));

  const scoreBreakdown = [
    { label: "Matched", value: data.matched_count ?? 0, color: "#10b981" },
    {
      label: "Gaps",
      value: (data.gaps?.length ?? data.skills_to_learn?.length) || 0,
      color: "#F59E0B",
    },
    {
      label: "JD depth",
      value: data.jobs_in_skill_analysis ?? data.jobs_scanned_for_skills ?? 0,
      color: "#818CF8",
    },
  ].filter((d) => d.value > 0);

  return (
    <motion.div
      className="cv-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <header className="cv-full__header">
        <div className="cv-full__header-left">
          {onClose ? (
            <button type="button" className="cv-full__back" onClick={onClose}>
              <ArrowLeft size={14} weight="bold" aria-hidden />
              Back to results
            </button>
          ) : (
            <Link href="/results" className="cv-full__back">
              <ArrowLeft size={14} weight="bold" aria-hidden />
              Back to results
            </Link>
          )}
          <div>
            <p className="cv-full__role">{data.role}</p>
            <h1 className="cv-full__title">Full CV review</h1>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            className="cv-full__close"
            aria-label="Close full review"
            onClick={onClose}
          >
            <X size={18} weight="bold" />
          </button>
        ) : (
          <Link href="/results" className="cv-full__close" aria-label="Close full review">
            <X size={18} weight="bold" />
          </Link>
        )}
      </header>

      <div className="cv-full__scroll">
        <section className="cv-full__hero">
          <div className="cv-full__hero-main">
            <div className="cv-full__score-block">
              <ScoreRing score={score} size={108} showValue />
              <div>
                <p className="cv-full__score-label">
                  {data.score_label || fb?.bucket || "Match score"}
                </p>
                {weeks ? (
                  <p className="cv-full__score-hint">~{weeks} wks to close top gaps</p>
                ) : null}
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
            {from != null && liftTo != null ? (
              <div className="cv-full__lift">
                <span>Plan estimate</span>
                <strong>
                  {from}% → ~{liftTo}%
                </strong>
                <span className="cv-full__lift-note">Not a hire guarantee</span>
              </div>
            ) : null}
            {putForward ? <PutForwardBadge result={putForward} /> : null}
          </div>

          {scoreBreakdown.length > 0 ? (
            <div className="cv-full__analytics">
              <h2>
                <ChartBar size={16} weight="duotone" aria-hidden />
                Run analytics
              </h2>
              <div className="cv-full__analytics-bars">
                {scoreBreakdown.map((d, i) => {
                  const delays = [0, 80, 180, 300, 440, 600, 780, 980];
                  const delay = delays[Math.min(i, delays.length - 1)];
                  const pct = Math.min(
                    100,
                    (d.value / Math.max(...scoreBreakdown.map((x) => x.value))) * 100,
                  );
                  return (
                    <div key={d.label} className="cv-full__analytics-row">
                      <span>{d.label}</span>
                      <div className="cv-full__analytics-track">
                        <span
                          className="cv-full__analytics-fill"
                          style={{
                            ["--bar-width" as string]: `${pct}%`,
                            ["--bar-delay" as string]: `${delay}ms`,
                            background: d.color,
                          }}
                        />
                      </div>
                      <strong>{d.value}</strong>
                    </div>
                  );
                })}
              </div>
              {fb?.jobs_reviewed ? (
                <p className="cv-full__analytics-meta">
                  {fb.jobs_reviewed} ads in CV context
                  {fb.jd_excerpts_used ? ` · ${fb.jd_excerpts_used} JD excerpts` : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="cv-full__tri">
          <InsightCard
            icon={Sparkle}
            title="Strengths"
            tone="good"
            items={strengths}
            empty="No strengths returned for this run."
          />
          <InsightCard
            icon={Target}
            title="Gaps"
            tone="gap"
            items={gaps}
            empty="No priority gaps flagged."
          />
          <InsightCard
            icon={Lightning}
            title="Fix first"
            tone="fix"
            text={fixFirst}
            empty="No single fix surfaced."
          />
        </section>

        {plan.length > 0 ? (
          <section className="cv-full__timeline">
            <div className="cv-full__section-head">
              <h2>
                <Path size={18} weight="duotone" aria-hidden />
                Learning timeline
              </h2>
              <p>
                {totalWeeks} weeks estimated · from skills_to_learn / ease_weeks
              </p>
            </div>
            <div className="cv-full__timeline-chart">
              <ResponsiveContainer width="100%" height={Math.max(180, plan.length * 36 + 40)}>
                <BarChart
                  data={timelineData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, Math.max(totalWeeks, 8)]}
                    tick={{ fontSize: 10, fill: TICK }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Weeks",
                      position: "insideBottomRight",
                      offset: -4,
                      fontSize: 10,
                      fill: TICK,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    width={88}
                    tick={{ fontSize: 11, fill: TICK }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(_, __, p) => [
                      `Wk ${(p?.payload as { start: number; end: number }).start}–${(p?.payload as { end: number }).end}`,
                      "Window",
                    ]}
                    labelFormatter={(_, p) => (p?.[0]?.payload?.full as string) || ""}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(99,102,241,0.15)",
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine x={8} stroke={GRID} strokeDasharray="4 4" />
                  <Bar dataKey="span" radius={[0, 6, 6, 0]} barSize={16}>
                    {timelineData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === 0
                            ? "var(--color-gold)"
                            : i === 1
                              ? "#818CF8"
                              : "#A78BFA"
                        }
                        fillOpacity={0.85 - i * 0.06}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="cv-full__plan-list">
              {plan.map((s) => (
                <li key={s.skill}>
                  <span className="cv-full__plan-weeks">
                    Wk {s.start}
                    {s.end > s.start ? `–${s.end}` : ""}
                  </span>
                  <span className="cv-full__plan-skill">{s.skill}</span>
                  {s.frequency_pct != null ? (
                    <span className="cv-full__plan-meta">{Math.round(s.frequency_pct)}%</span>
                  ) : null}
                  {s.note ? <p className="cv-full__plan-note">{s.note}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {reportSections.length > 0 ? (
          <section className="cv-full__report">
            <div className="cv-full__section-head">
              <h2>Detailed review</h2>
              <p>Structured from your full report</p>
            </div>
            <div className="cv-full__report-grid">
              {reportSections.map((sec) => {
                const { scores, leftoverBullets, leftoverParagraphs } =
                  extractScoreLines(sec);
                const isPutForward = /put forward/i.test(sec.title);
                const tone = isPutForward
                  ? "verdict"
                  : scores.length >= 2
                    ? "scores"
                    : sectionTone(sec.title);
                const putLines = isPutForward
                  ? [...leftoverBullets, ...leftoverParagraphs]
                      .map((line) => parsePutForward(line))
                      .filter(Boolean)
                  : [];
                return (
                  <article
                    key={sec.title}
                    className="cv-full__report-card"
                    data-tone={tone}
                    data-wide={scores.length >= 3 || isPutForward ? "true" : undefined}
                  >
                    <h3>{sec.title}</h3>
                    {scores.length > 0 ? <ScoreRows scores={scores} /> : null}
                    {isPutForward && putLines.length > 0 ? (
                      <div className="cv-full__put-stack">
                        {putLines.map((p, i) => (
                          <PutForwardBadge key={i} result={p!} />
                        ))}
                      </div>
                    ) : (
                      <>
                        {leftoverParagraphs.map((p) => {
                          const bits = splitVerdictBullets(p);
                          if (bits.length > 1 && !parsePutForward(p)) {
                            return (
                              <ul key={p.slice(0, 40)} className="cv-full__report-list">
                                {bits.map((b) => (
                                  <ReportBullet key={b.slice(0, 50)} text={b} />
                                ))}
                              </ul>
                            );
                          }
                          return <ReportBodyText key={p.slice(0, 40)} text={p} />;
                        })}
                        {leftoverBullets.length > 0 ? (
                          <ul className="cv-full__report-list">
                            {leftoverBullets.map((b) => (
                              <ReportBullet key={b.slice(0, 50)} text={b} />
                            ))}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ) : fb?.first_impression ? (
          <section className="cv-full__report">
            <article className="cv-full__report-card" data-tone="neutral">
              <h3>First impression</h3>
              <p>{fb.first_impression}</p>
            </article>
          </section>
        ) : null}

        {data.llm_message && !fb?.full_report ? (
          <p className="cv-full__note">{data.llm_message}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function ScoreRows({ scores }: { scores: ScoreLine[] }) {
  const total = scores.reduce((a, s) => a + s.score, 0);
  const maxTotal = scores.reduce((a, s) => a + s.max, 0);

  return (
    <div className="cv-score-rows">
      {maxTotal > 0 ? (
        <div className="cv-score-rows__total">
          <span>Total</span>
          <strong>
            {total}
            <em>/{maxTotal}</em>
          </strong>
        </div>
      ) : null}
      <ul>
        {scores.map((s) => {
          const pct = s.max > 0 ? Math.round((s.score / s.max) * 100) : 0;
          return (
            <li key={s.label} data-tone={scoreTone(s.score, s.max)}>
              <div className="cv-score-row__top">
                <strong className="cv-score-row__label">{s.label}</strong>
                <span className="cv-score-row__value">
                  {s.score}
                  <em>/{s.max}</em>
                </span>
              </div>
              <div className="cv-score-row__track" aria-hidden>
                <i style={{ width: `${pct}%` }} />
              </div>
              {s.note ? <p className="cv-score-row__note">{s.note}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  tone,
  items,
  text,
  empty,
}: {
  icon: typeof Sparkle;
  title: string;
  tone: "good" | "gap" | "fix";
  items?: string[];
  text?: string | null;
  empty: string;
}) {
  const hasItems = items && items.length > 0;
  return (
    <article className="cv-full__insight" data-tone={tone}>
      <header>
        <Icon size={18} weight="duotone" aria-hidden />
        <h2>{title}</h2>
      </header>
      {hasItems ? (
        <ul>
          {items!.map((s) => (
            <li key={s.slice(0, 60)}>
              <BoldLine text={s} />
            </li>
          ))}
        </ul>
      ) : text ? (
        <p>
          <BoldLine text={text} />
        </p>
      ) : (
        <p className="cv-full__insight-empty">{empty}</p>
      )}
    </article>
  );
}
