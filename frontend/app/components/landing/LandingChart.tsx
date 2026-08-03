"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import insights from "@/data/insights.json";

function CountUp({ to, duration = 2500 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{n.toLocaleString()}</span>;
}

function GlassTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(79,110,247,0.25)",
        borderRadius: 10,
        padding: "0.5rem 0.75rem",
        fontSize: "0.75rem",
        color: "var(--color-ink)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "0.2rem 0 0", color: "var(--color-ink-soft)" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export default function LandingChart() {
  const h = insights.headline;
  const chartData = insights.regions.map((r) => ({
    name: r.region
      .replace("Northern Ireland", "N. Ireland")
      .replace("Rest of England", "England"),
    Sponsors: r.n,
    "Exit rate %": r.exit_rate_pct,
  }));

  return (
    <section className="section-orb landing-numbers" style={{ padding: "4rem 0" }} aria-labelledby="numbers">
      <div
        aria-hidden
        className="orb orb-indigo"
        style={{ width: 700, height: 700, top: -80, right: -240, filter: "blur(60px)" }}
      />
      <div className="landing-chart-split">
        <div className="landing-chart-copy">
          <h2 id="numbers" className="landing-chart-copy__title">
            The numbers behind this
          </h2>
          <p className="landing-chart-copy__body">
            Documented figures from the register archive.
          </p>
          <Link href="/methodology" className="landing-chart-copy__link">
            Read the methodology
          </Link>
        </div>

        <div className="landing-chart-panel glass-elevated">
          <div className="landing-chart-panel__head">
            <div className="landing-chart-panel__kpi">
              <strong className="landing-chart-panel__value">
                <CountUp to={h.sponsors_tracked} />
              </strong>
              <span className="landing-chart-panel__desc">
                Sponsor licences checked per search
              </span>
            </div>
            <p className="landing-chart-panel__caption">Sponsors by region</p>
          </div>
          <div className="landing-chart-panel__plot">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id="fillSponsors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F6EF7" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#4F6EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(99,102,241,0.045)"
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748B", fontSize: 12.5, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip content={<GlassTip />} />
                <Area
                  type="monotone"
                  dataKey="Sponsors"
                  stroke="#4F6EF7"
                  fill="url(#fillSponsors)"
                  strokeWidth={3.25}
                  animationBegin={200}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{ r: 5, fill: "#4F6EF7" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="metric-chip-row landing-numbers__chips">
        {[
          { n: String(h.snapshots), l: "Register snapshots since 2023" },
          { n: h.still_active.toLocaleString(), l: "Still active at latest snapshot" },
          { n: "200", l: "Live ads analysed per search" },
          { n: "59%", l: "Name-match precision (100 samples)" },
        ].map((s) => (
          <div key={s.l} className="metric-chip">
            <p className="metric-chip__value">{s.n}</p>
            <p className="metric-chip__label">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
