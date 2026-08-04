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
    <div className="section-dark-chart-tip">
      <p className="section-dark-chart-tip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="section-dark-chart-tip__row">
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
    <section
      className="section-dark-bg landing-numbers"
      aria-labelledby="numbers"
    >
      <div className="section-dark-orb-left" aria-hidden />
      <div className="section-dark-orb-right" aria-hidden />
      <div className="section-dark-dots" aria-hidden />

      <div className="section-inner">
        <div className="landing-chart-split">
          <div className="landing-chart-copy">
            <h2 id="numbers" className="landing-chart-copy__title">
              The numbers
              <br />
              behind this
            </h2>
            <p className="landing-chart-copy__body">
              Documented figures from the register archive.
            </p>
            <Link href="/methodology" className="landing-chart-copy__link">
              Read the methodology
            </Link>
          </div>

          <div className="landing-chart-panel chart-card-dark">
            <div className="landing-chart-panel__head">
              <div className="landing-chart-panel__kpi">
                <strong className="landing-chart-panel__value chart-headline">
                  <CountUp to={h.sponsors_tracked} />
                </strong>
                <span className="landing-chart-panel__desc chart-sublabel">
                  Sponsor licences checked per search
                </span>
              </div>
              <p className="landing-chart-panel__caption chart-section-label">
                Sponsors by region
              </p>
            </div>
            <div className="landing-chart-panel__plot">
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 2 }}>
                  <defs>
                    <linearGradient id="fillSponsorsDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(165,180,252,0.90)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="rgba(165,180,252,0.90)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(165,180,252,0.08)"
                    strokeDasharray="4 6"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.40)", fontSize: 12.5, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <Tooltip content={<GlassTip />} />
                  <Area
                    type="monotone"
                    dataKey="Sponsors"
                    stroke="rgba(165,180,252,0.90)"
                    fill="url(#fillSponsorsDark)"
                    strokeWidth={3.25}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={false}
                    activeDot={{ r: 5, fill: "rgba(165,180,252,0.95)" }}
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
            <div key={s.l} className="metric-chip stat-card-dark">
              <p className="metric-chip__value stat-number">{s.n}</p>
              <p className="metric-chip__label stat-label">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
