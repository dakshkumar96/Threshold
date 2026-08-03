"use client";

import type { ReactNode } from "react";
import type { AnalyzeResponse } from "@/lib/api";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import InfoTip from "../InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";
import {
  MATCH_TARGET,
  SW_THRESHOLD,
  bandCounts,
  confidenceCounts,
  type MatchHistoryPoint,
  type Sponsor,
  weeksEstimate,
} from "@/lib/results-utils";

const GRID = "rgba(99,102,241,0.12)";
const TICK = "#6B7280";

function Panel({
  title,
  metric,
  metricHint,
  children,
  wide,
}: {
  title: string;
  metric?: string;
  metricHint?: string;
  children?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`dash-bento${wide ? " dash-bento--wide" : ""}`}>
      <div className="dash-bento__head">
        <h3>{title}</h3>
        {metric ? (
          <p className="dash-bento__metric">
            {metric}
            {metricHint ? <span>{metricHint}</span> : null}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function matchedSkillSet(data: AnalyzeResponse): Set<string> {
  return new Set((data.matched_skills || []).map((s) => s.skill.toLowerCase()));
}

export default function DashboardGrid({
  data,
  history,
}: {
  data: AnalyzeResponse;
  history: MatchHistoryPoint[];
}) {
  const sponsors = data.sponsors || [];
  const conf = confidenceCounts(sponsors);
  const bands = bandCounts(sponsors);
  const have = matchedSkillSet(data);
  const threshold = data.skilled_worker_salary_threshold ?? SW_THRESHOLD;
  const salaryTip = VISA_CONTENT.salaryThreshold;
  const weeks = weeksEstimate(data);
  const belowPay = sponsors.filter((s: Sponsor) => s.salary_vs_threshold === "below").length;

  const skillDemand = (data.requirement_frequencies || [])
    .slice(0, 6)
    .map((r) => ({
      skill: r.skill.length > 14 ? `${r.skill.slice(0, 12)}…` : r.skill,
      full: r.skill,
      share: Math.round(r.share_pct),
      have: have.has(r.skill.toLowerCase()),
    }));

  const salaries = sponsors
    .map((s) => s.salary_max ?? s.salary_min)
    .filter((n): n is number => typeof n === "number" && n > 0);

  const buckets = [
    { label: "<35k", min: 0, max: 35000 },
    { label: "35–42k", min: 35000, max: 42000 },
    { label: "42–50k", min: 42000, max: 50000 },
    { label: "50–65k", min: 50000, max: 65000 },
    { label: "65k+", min: 65000, max: Infinity },
  ].map((b) => ({
    label: b.label,
    count: salaries.filter((n) => n >= b.min && n < b.max).length,
  }));

  const confTotal = Math.max(conf.total, 1);
  const confSegments = [
    { key: "v", count: conf.verified, color: "var(--color-signal-primary)" },
    { key: "l", count: conf.likely, color: "var(--color-gold)" },
    { key: "p", count: conf.possible, color: "#F59E0B" },
  ];

  const bandData = [
    { name: "Est.", count: bands.Established },
    { name: "Mod.", count: bands.Moderate },
    { name: "New", count: bands["Newly registered"] },
  ];

  const roleHistory = history.filter(
    (h) => h.role.toLowerCase() === (data.role || "").toLowerCase(),
  );
  const trendPoints =
    roleHistory.length > 0
      ? roleHistory.slice(-8).map((h, i) => ({
          i: i + 1,
          score: h.score,
          label: new Date(h.at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
        }))
      : data.score != null
        ? [{ i: 1, score: data.score, label: "Now" }]
        : [];

  const topSkill = skillDemand[0];

  return (
    <section className="market-dash" aria-label="Market dashboard">
      <div className="market-dash__intro">
        <h2>Market snapshot</h2>
        <p>From this search only</p>
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Readiness"
          metric={
            data.has_cv && data.score != null
              ? `${Math.round(data.score)}%`
              : "N/A"
          }
          metricHint={
            data.has_cv
              ? weeks
                ? `~${weeks} wks to close top gaps`
                : "Match to scanned ads"
              : "Add a CV"
          }
        >
          <div className="dash-bento__progress">
            <span
              style={{
                width: `${data.has_cv && data.score != null ? Math.min(100, data.score) : 0}%`,
              }}
            />
          </div>
        </Panel>

        <Panel
          title="Top skill demand"
          metric={topSkill ? `${topSkill.share}%` : "N/A"}
          metricHint={topSkill?.full || "No JD depth"}
          wide
        >
          {skillDemand.length ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDemand} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: TICK }} unit="%" axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="skill" width={64} tick={{ fontSize: 10, fill: TICK }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v}% of roles`, "Share"]}
                    labelFormatter={(_, p) => (p?.[0]?.payload?.full as string) || ""}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", fontSize: 12 }}
                  />
                  <Bar dataKey="share" radius={[0, 6, 6, 0]} barSize={12}>
                    {skillDemand.map((d) => (
                      <Cell
                        key={d.full}
                        fill={d.have ? "var(--color-signal-primary)" : "var(--color-gold)"}
                        fillOpacity={d.have ? 0.85 : 0.55}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="dash-bento__empty">No skill frequencies</p>
          )}
        </Panel>

        <Panel
          title="Salary bands"
          metric={salaries.length ? String(salaries.length) : "N/A"}
          metricHint={
            salaries.length
              ? `${belowPay} below £${threshold.toLocaleString()}`
              : "No stated pay"
          }
          wide
        >
          <div className="mb-2 flex items-center gap-1 text-[11px] text-muted">
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
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: TICK }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: TICK }} width={24} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--color-gold)" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="dash-bento__empty">No salaries to chart</p>
          )}
        </Panel>

        <Panel title="Confidence mix" metric={`${conf.verified}`} metricHint="verified">
          <div className="segment-bar segment-bar--tall">
            {confSegments.map((s) =>
              s.count > 0 ? (
                <span
                  key={s.key}
                  style={{
                    width: `${(s.count / confTotal) * 100}%`,
                    background: s.color,
                  }}
                />
              ) : null,
            )}
          </div>
          <ul className="dash-bento__legend">
            <li>
              <i style={{ background: "var(--color-signal-primary)" }} />
              Verified {conf.verified}
            </li>
            <li>
              <i style={{ background: "var(--color-gold)" }} />
              Likely {conf.likely}
            </li>
            <li>
              <i style={{ background: "#F59E0B" }} />
              Possible {conf.possible}
            </li>
          </ul>
        </Panel>

        <Panel
          title="Licence tenure"
          metric={String(bands.Established)}
          metricHint="established"
        >
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: TICK }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={36} tick={{ fontSize: 10, fill: TICK }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", fontSize: 12 }} />
                <Bar dataKey="count" fill="#818CF8" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Match trend"
          metric={
            trendPoints.length
              ? `${Math.round(trendPoints[trendPoints.length - 1].score)}%`
              : "N/A"
          }
          metricHint={trendPoints.length > 1 ? `${trendPoints.length} runs` : "This run"}
        >
          {trendPoints.length ? (
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendPoints} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: TICK }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: TICK }} width={24} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", fontSize: 12 }} />
                  <ReferenceLine y={MATCH_TARGET} stroke={GRID} strokeDasharray="4 4" />
                  <Bar dataKey="score" fill="var(--color-gold)" radius={[6, 6, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="dash-bento__empty">Upload a CV to start a trend</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
