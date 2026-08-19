"use client";

import type { ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyzeResponse } from "@/lib/api";
import InfoTip from "../InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";
import {
  SW_THRESHOLD,
  bandCounts,
  confidenceCounts,
  readinessLine,
  type Sponsor,
  weeksEstimate,
} from "@/lib/results-utils";
import ScoreRing from "./ScoreRing";
import { CaretUp, Warning } from "@phosphor-icons/react";

const TICK = "#6B7280";

function matchedSkillSet(data: AnalyzeResponse): Set<string> {
  return new Set((data.matched_skills || []).map((s) => s.skill.toLowerCase()));
}

function InsightChip({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="dash-insight-chip">{children}</p>;
}

function PanelShell({
  title,
  metric,
  children,
  className,
}: {
  title: string;
  metric?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `dash-panel ${className}` : "dash-panel"}>
      <div className="dash-panel__header">
        <span className="dash-panel__header-title">{title}</span>
        {metric ? <div className="dash-panel__header-kpi">{metric}</div> : null}
      </div>
      <div className="dash-panel__body">{children}</div>
    </div>
  );
}

export default function DataOverviewStrip({ data }: { data: AnalyzeResponse }) {
  const sponsors = data.sponsors || [];
  const conf = confidenceCounts(sponsors);
  const bands = bandCounts(sponsors);
  const have = matchedSkillSet(data);
  const threshold = data.skilled_worker_salary_threshold ?? SW_THRESHOLD;
  const salaryTip = VISA_CONTENT.salaryThreshold;
  const weeks = weeksEstimate(data);
  const unique = new Set(
    sponsors
      .map((s) => (s.matched_sponsor || s.company || "").trim().toLowerCase())
      .filter(Boolean),
  ).size;
  const abovePay = sponsors.filter((s: Sponsor) => s.salary_vs_threshold === "above").length;
  const belowPay = sponsors.filter((s: Sponsor) => s.salary_vs_threshold === "below").length;
  const score = data.has_cv && data.score != null ? Math.round(data.score) : null;

  const skillDemand = (data.requirement_frequencies || [])
    .slice(0, 10)
    .map((r) => ({
      skill: r.skill,
      share: Math.round(r.share_pct),
      have: have.has(r.skill.toLowerCase()),
    }))
    .sort((a, b) => b.share - a.share);

  const salaries = sponsors
    .map((s) => s.salary_max ?? s.salary_min)
    .filter((n): n is number => typeof n === "number" && n > 0);

  const buckets = [
    { label: "<35k", min: 0, max: 35000, mid: 17500 },
    { label: "35–42k", min: 35000, max: 42000, mid: 38500 },
    { label: "42–50k", min: 42000, max: 50000, mid: 46000 },
    { label: "50–65k", min: 50000, max: 65000, mid: 57500 },
    { label: "65k+", min: 65000, max: Infinity, mid: 75000 },
  ].map((b) => ({
    label: b.label,
    count: salaries.filter((n) => n >= b.min && n < b.max).length,
    above: b.mid >= threshold,
  }));

  const confTotal = Math.max(conf.total, 1);
  const donutData = [
    { key: "verified", name: "Verified", count: conf.verified, color: "rgba(5, 150, 105, 0.85)" },
    { key: "likely", name: "Likely", count: conf.likely, color: "rgba(79, 110, 247, 0.9)" },
    { key: "possible", name: "Possible", count: conf.possible, color: "rgba(180, 132, 52, 0.75)" },
  ].filter((d) => d.count > 0);

  const bandRows = (
    [
      ["Established", bands.Established, "est"],
      ["Moderate", bands.Moderate, "mod"],
      ["Newly registered", bands["Newly registered"], "new"],
    ] as const
  ).map(([name, count, tone]) => {
    const years = sponsors
      .filter((s) => (s.stability_band || "") === name && s.licence_years != null)
      .map((s) => s.licence_years as number);
    const avg =
      years.length > 0
        ? years.reduce((a, b) => a + b, 0) / years.length
        : null;
    return { name, count, tone, avg };
  });

  const topSkill = skillDemand[0];

  return (
    <section className="data-overview" aria-label="Search verdict">
      <div className="data-overview__verdict">
        <h2>
          {unique > 0 ? (
            <>
              {unique} licensed sponsor{unique === 1 ? "" : "s"} for{" "}
              <em>{data.role || "this role"}</em>
            </>
          ) : (
            <>No licensed sponsors for {data.role || "this role"}</>
          )}
        </h2>
        <p className="data-overview__meta">
          <span data-tone="signal">{conf.verified} verified</span>
          <span>{conf.likely} likely</span>
          <span data-tone="warn">{conf.possible} possible</span>
        </p>
        <p className="data-overview__readiness">{readinessLine(data)}</p>
        {data.accuracy_note ? (
          <p className="data-overview__accuracy">{data.accuracy_note}</p>
        ) : null}
        {data.opportunities_experience_filter_applied === false &&
        data.opportunities_experience_filter_note ? (
          <p className="data-overview__exp-note">
            <Warning size={13} weight="fill" aria-hidden />
            {data.opportunities_experience_filter_note}
          </p>
        ) : null}
        {!data.has_cv ? (
          <a href="/search" className="data-overview__link">
            Upload CV for a match score →
          </a>
        ) : null}
      </div>

      <div className="data-overview__pills" role="list">
        <div className="stat-pill" data-tone="indigo" role="listitem">
          <span className="stat-pill__label">Ads scanned</span>
          <strong className="stat-pill__value">
            {data.jobs_total != null ? String(data.jobs_total) : "N/A"}
          </strong>
          <span className="stat-pill__detail">
            {data.jobs_full_description != null
              ? `${data.jobs_full_description} with full JD text`
              : "Live UK job ads this run"}
          </span>
        </div>

        <div className="stat-pill" data-tone="indigo" role="listitem">
          <span className="stat-pill__label">Sponsors</span>
          <strong className="stat-pill__value">{unique}</strong>
          <span className="stat-pill__detail">
            {sponsors.length} roles · unique licensed employers
          </span>
        </div>

        <div className="stat-pill" data-tone="signal" role="listitem">
          <span className="stat-pill__label">Verified</span>
          <strong className="stat-pill__value">{conf.verified}</strong>
          <span className="stat-pill__detail">
            ATS careers pages · identity certain
          </span>
        </div>

        <div className="stat-pill stat-pill--score" data-tone="indigo" role="listitem">
          <span className="stat-pill__label">Match score</span>
          <div className="stat-pill__score-row">
            <ScoreRing score={score} size={36} showValue={false} />
            <strong className="stat-pill__value">
              {score != null ? `${score}%` : "N/A"}
            </strong>
          </div>
          <span className="stat-pill__detail">
            {score != null
              ? data.score_label || data.cv_feedback?.bucket || "Against market skills"
              : "Upload a CV to score"}
          </span>
        </div>

        <div className="stat-pill" data-tone="signal" role="listitem">
          <span className="stat-pill__label">Above threshold</span>
          <strong className="stat-pill__value">
            {abovePay}
            <span className="stat-pill__icon" aria-hidden>
              <CaretUp size={14} weight="bold" />
            </span>
          </strong>
          <span className="stat-pill__detail">
            Clears £{threshold.toLocaleString()}
            {data.is_new_entrant ? " new entrant" : " standard"}
          </span>
        </div>

        <div className="stat-pill" data-tone="danger" role="listitem">
          <span className="stat-pill__label">Below threshold</span>
          <strong className="stat-pill__value">
            {belowPay}
            <span className="stat-pill__icon" aria-hidden>
              <Warning size={14} weight="fill" />
            </span>
          </strong>
          <span className="stat-pill__detail">
            Stated pay under £{threshold.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="data-overview__panels">
        <PanelShell
          title="Top skill demand"
          metric={
            topSkill ? (
              <>
                <strong>{topSkill.share}%</strong>
                <span>{topSkill.skill}</span>
              </>
            ) : (
              <strong>N/A</strong>
            )
          }
        >
          {skillDemand.length ? (
            <div className="skill-heat">
              {skillDemand.map((d) => {
                const opacity = Math.max(0.1, Math.min(0.32, d.share / 100));
                return (
                  <div
                    key={d.skill}
                    className="skill-heat__chip"
                    data-have={d.have ? "true" : "false"}
                    style={{
                      background: d.have
                        ? `rgba(16, 185, 129, ${0.1 + opacity * 0.4})`
                        : `rgba(79, 110, 247, ${opacity})`,
                      color: d.have ? "var(--color-signal)" : "var(--color-gold-dark)",
                    }}
                    title={d.skill}
                  >
                    <span>{d.skill}</span>
                    <em>{d.share}%</em>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dash-panel__empty">No skill frequencies</p>
          )}
        </PanelShell>

        <PanelShell
          title="Salary bands"
          metric={
            <>
              <strong>{salaries.length ? String(salaries.length) : "N/A"}</strong>
              <span>
                {salaries.length
                  ? `${belowPay} below floor`
                  : "No stated pay"}
              </span>
            </>
          }
        >
          <div className="dash-panel__salary-tip">
            SW floor £{threshold.toLocaleString()}
            <InfoTip label={salaryTip.label}>
              <span className="block">{salaryTip.body}</span>
              <span className="mt-2 block">
                <a href={salaryTip.href} target="_blank" rel="noreferrer">
                  {salaryTip.linkLabel}
                </a>
              </span>
            </InfoTip>
          </div>
          {salaries.length ? (
            <div className="dash-panel__chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ left: 0, right: 4, top: 4, bottom: 0 }} barCategoryGap="18%">
                  <defs>
                    <linearGradient id="salaryAbove" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(79,110,247,0.72)" />
                      <stop offset="100%" stopColor="rgba(79,110,247,0.28)" />
                    </linearGradient>
                    <linearGradient id="salaryBelow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(185,28,28,0.45)" />
                      <stop offset="100%" stopColor="rgba(185,28,28,0.18)" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: TICK }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(99,102,241,0.15)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={36}>
                    {buckets.map((b) => (
                      <Cell
                        key={b.label}
                        fill={b.above ? "url(#salaryAbove)" : "url(#salaryBelow)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="dash-panel__empty">No salaries to chart</p>
          )}
        </PanelShell>

        <PanelShell
          className="dash-panel--confidence"
          title="Confidence mix"
          metric={
            <>
              <strong>{conf.verified}</strong>
              <span>verified</span>
            </>
          }
        >
          <div className="conf-donut">
            <div className="conf-donut__chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData.length ? donutData : [{ key: "empty", name: "N/A", count: 1, color: "rgba(156,163,175,0.35)" }]}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="55%"
                    outerRadius="98%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {(donutData.length ? donutData : [{ color: "rgba(156,163,175,0.35)" }]).map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(99,102,241,0.15)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="conf-donut__centre">
                <strong>{conf.total}</strong>
                <span>roles</span>
              </div>
            </div>
            <ul className="conf-donut__legend">
              {(
                [
                  ["Verified", conf.verified, "rgba(5, 150, 105, 0.85)"],
                  ["Likely", conf.likely, "rgba(79, 110, 247, 0.9)"],
                  ["Possible", conf.possible, "rgba(180, 132, 52, 0.75)"],
                ] as const
              ).map(([label, count, color]) => (
                <li key={label}>
                  <span className="conf-donut__key">
                    <i style={{ background: color }} aria-hidden />
                    {label}
                  </span>
                  <strong>{count}</strong>
                  <span className="conf-donut__pct">
                    {Math.round((count / confTotal) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </PanelShell>

        <PanelShell
          title="Licence tenure"
          metric={
            <>
              <strong>{bands.Established}</strong>
              <span>established</span>
            </>
          }
        >
          <div className="licence-bars">
            {bandRows.map((row) => (
              <div key={row.name} className="licence-bars__row" data-tone={row.tone} data-empty={row.count === 0 ? "true" : undefined}>
                <div className="licence-bars__label">{row.name}</div>
                <div className="licence-bars__track">
                  {row.count > 0 ? (
                    <div
                      className="licence-bars__fill"
                      style={{
                        width: `${Math.max(
                          10,
                          (row.count /
                            Math.max(...bandRows.map((r) => r.count), 1)) *
                            100,
                        )}%`,
                      }}
                    >
                      <span>{row.count}</span>
                    </div>
                  ) : (
                    <span className="licence-bars__zero">0</span>
                  )}
                </div>
                {row.avg != null ? (
                  <div className="licence-bars__avg">
                    <span>~{row.avg.toFixed(1)}y</span>
                  </div>
                ) : (
                  <div className="licence-bars__avg licence-bars__avg--empty">
                    <span>N/A</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {data.has_cv && weeks != null ? (
            <InsightChip>
              {score != null ? `${score}% match` : "CV scored"}
              {` · ~${weeks} wks on top gaps`}
            </InsightChip>
          ) : null}
        </PanelShell>
      </div>
    </section>
  );
}
