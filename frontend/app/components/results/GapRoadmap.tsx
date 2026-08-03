"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/api";
import { estimatedMatchLift, weeksEstimate } from "@/lib/results-utils";

type Tab = "have" | "need" | "plan";

type SkillRow = {
  skill: string;
  frequency_pct?: number | null;
  ease_weeks?: number | null;
  start?: number;
  end?: number;
  span?: number;
};

export default function GapRoadmap({ data }: { data: AnalyzeResponse }) {
  const [tab, setTab] = useState<Tab>("have");
  const have = data.matched_skills || [];
  const gaps = data.gaps || [];
  const need = data.skills_to_learn?.length
    ? data.skills_to_learn
    : gaps.map((g) => ({
        skill: g.skill,
        frequency_pct: g.frequency_pct,
        ease_weeks: g.ease_weeks,
        note: null as string | null,
      }));

  const plan = useMemo(() => {
    let week = 1;
    return need.slice(0, 6).map((s) => {
      const w = Math.max(1, Math.round(s.ease_weeks ?? 3));
      const start = week;
      const end = week + w - 1;
      week = end + 1;
      return { ...s, start, end, span: w };
    });
  }, [need]);

  const liftTo = estimatedMatchLift(data);
  const from = data.score != null ? Math.round(data.score) : null;
  const weeks = weeksEstimate(data);
  const strongMatch =
    data.score != null && data.score >= 85 && gaps.length <= 2;

  const topHave = have
    .slice()
    .sort((a, b) => (b.frequency_pct || 0) - (a.frequency_pct || 0))[0];
  const topNeed = need
    .slice()
    .sort((a, b) => (b.frequency_pct || 0) - (a.frequency_pct || 0))[0];
  const denom = have.length + need.length;
  const coveragePct = denom ? Math.round((have.length / denom) * 100) : 0;
  const maxFreq = Math.max(
    1,
    ...have.map((s) => s.frequency_pct || 0),
    ...need.map((s) => s.frequency_pct || 0),
  );
  const planTotalWeeks = plan.length
    ? plan[plan.length - 1].end
    : null;

  if (!data.has_cv) return null;

  return (
    <section className="skill-strip" aria-label="Skill roadmap">
      <div className="skill-strip__head">
        <h2>Skill roadmap</h2>
        <div className="skill-strip__tabs" role="tablist">
          {(
            [
              ["have", "Have", have.length],
              ["need", "Need", need.length],
              ["plan", "Plan", plan.length],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              data-active={tab === id ? "true" : "false"}
              onClick={() => setTab(id)}
            >
              {label}
              <em>{count}</em>
            </button>
          ))}
        </div>
        {from != null && liftTo != null ? (
          <p className="skill-strip__lift">
            <strong>{from}%</strong>
            <span aria-hidden>→</span>
            <strong>~{liftTo}%</strong>
          </p>
        ) : null}
      </div>

      <div className="skill-strip__analytics" aria-label="Coverage summary">
        <div className="skill-strip__metric">
          <span className="skill-strip__metric-label">Coverage</span>
          <strong className="skill-strip__metric-value">{coveragePct}%</strong>
          <div className="skill-strip__meter" aria-hidden>
            <i style={{ width: `${coveragePct}%` }} data-tone="signal" />
          </div>
          <span className="skill-strip__metric-detail">
            {have.length} of {denom || 0} tracked skills
          </span>
        </div>
        <div className="skill-strip__metric">
          <span className="skill-strip__metric-label">Strongest match</span>
          <strong className="skill-strip__metric-value">
            {topHave ? `${Math.round(topHave.frequency_pct)}%` : "N/A"}
          </strong>
          <div className="skill-strip__meter" aria-hidden>
            <i
              style={{
                width: topHave
                  ? `${Math.min(100, Math.round(topHave.frequency_pct))}%`
                  : "0%",
              }}
              data-tone="indigo"
            />
          </div>
          <span className="skill-strip__metric-detail">
            {topHave ? topHave.skill : "No matched skills"}
          </span>
        </div>
        <div className="skill-strip__metric">
          <span className="skill-strip__metric-label">Priority gap</span>
          <strong className="skill-strip__metric-value">
            {topNeed?.frequency_pct != null
              ? `${Math.round(topNeed.frequency_pct)}%`
              : "N/A"}
          </strong>
          <div className="skill-strip__meter" aria-hidden>
            <i
              style={{
                width:
                  topNeed?.frequency_pct != null
                    ? `${Math.min(100, Math.round(topNeed.frequency_pct))}%`
                    : "0%",
              }}
              data-tone="warn"
            />
          </div>
          <span className="skill-strip__metric-detail">
            {topNeed
              ? `${topNeed.skill}${weeks != null ? ` · ~${weeks} wks` : ""}`
              : "No open gaps"}
          </span>
        </div>
      </div>

      {tab === "have" ? (
        <SkillAnalyticsList
          empty="No matched skills for this run."
          tone="good"
          maxFreq={maxFreq}
          rows={have.slice(0, 10).map((s) => ({
            skill: s.skill,
            frequency_pct: s.frequency_pct,
          }))}
        />
      ) : null}

      {tab === "need" ? (
        strongMatch ? (
          <div className="skill-strip__strong">
            <p>
              You cover the majority of what this role asks for. Remaining gaps
              are desirable rather than essential, or appear in fewer than 5% of
              ads. Focus on applying to your shortlist.
            </p>
            {have.length > 0 ? (
              <ul className="skill-strip__strong-chips">
                {have.slice(0, 3).map((s) => (
                  <li key={s.skill}>
                    {s.skill}
                    <em>{Math.round(s.frequency_pct)}%</em>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <SkillAnalyticsList
            empty="No high-priority gaps."
            tone="gap"
            maxFreq={maxFreq}
            rows={need.slice(0, 10).map((s) => ({
              skill: s.skill,
              frequency_pct: s.frequency_pct,
              ease_weeks: s.ease_weeks,
            }))}
          />
        )
      ) : null}

      {tab === "plan" ? (
        plan.length === 0 ? (
          <p className="skill-strip__empty">No plan from this run.</p>
        ) : (
          <ol className="skill-strip__plan">
            {plan.map((s) => (
              <li key={s.skill}>
                <span className="skill-strip__wk">
                  W{s.start}
                  {s.end > s.start ? `–${s.end}` : ""}
                </span>
                <div className="skill-strip__plan-main">
                  <div className="skill-strip__plan-top">
                    <strong>{s.skill}</strong>
                    <span>
                      {s.frequency_pct != null
                        ? `${Math.round(s.frequency_pct)}% of ads`
                        : ""}
                      {s.span != null ? ` · ${s.span}w` : ""}
                    </span>
                  </div>
                  <div className="skill-strip__plan-track" aria-hidden>
                    <i
                      style={{
                        width: planTotalWeeks
                          ? `${Math.max(12, (s.span! / planTotalWeeks) * 100)}%`
                          : "40%",
                        marginLeft: planTotalWeeks
                          ? `${((s.start! - 1) / planTotalWeeks) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )
      ) : null}
    </section>
  );
}

function SkillAnalyticsList({
  rows,
  empty,
  tone,
  maxFreq,
}: {
  rows: SkillRow[];
  empty: string;
  tone: "good" | "gap";
  maxFreq: number;
}) {
  if (!rows.length) {
    return <p className="skill-strip__empty">{empty}</p>;
  }

  return (
    <ul className="skill-strip__rows" data-tone={tone}>
      {rows.map((s) => {
        const pct = s.frequency_pct != null ? Math.round(s.frequency_pct) : null;
        const bar = pct != null ? Math.max(8, (pct / maxFreq) * 100) : 0;
        return (
          <li key={s.skill}>
            <div className="skill-strip__row-top">
              <strong>{s.skill}</strong>
              <span className="skill-strip__row-meta">
                {pct != null ? `${pct}% of ads` : "N/A"}
                {s.ease_weeks != null ? ` · ~${s.ease_weeks}w` : ""}
              </span>
            </div>
            <div className="skill-strip__row-bar" aria-hidden>
              <i style={{ width: `${bar}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
