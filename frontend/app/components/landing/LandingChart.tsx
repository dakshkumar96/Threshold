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

/**
 * A number that counts up when it scrolls into view.
 *
 * It starts at the real value, so the page shows the right number without
 * JavaScript, to search engines and before the script loads. It only resets
 * and counts up when it is still below the screen, and never for visitors who
 * ask for reduced motion.
 */
function CountUp({ to, duration = 2500 }: { to: number; duration?: number }) {
  const [n, setN] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    setN(0);
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return <span ref={ref}>{n.toLocaleString("en-GB")}</span>;
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
      className="section-dark-bg landing-numbers full-bleed"
      aria-labelledby="numbers"
    >
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
                  <CountUp to={h.still_active} />
                </strong>
                <span className="landing-chart-panel__desc chart-sublabel">
                  Licensed sponsors on the latest register
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
                      <stop offset="0%" stopColor="rgba(96, 165, 250,0.90)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="rgba(96, 165, 250,0.90)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(96, 165, 250,0.08)"
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
                    stroke="rgba(96, 165, 250,0.90)"
                    fill="url(#fillSponsorsDark)"
                    strokeWidth={3.25}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={false}
                    activeDot={{ r: 5, fill: "rgba(96, 165, 250,0.95)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="metric-chip-row landing-numbers__chips">
          {[
            { n: String(h.snapshots), l: "Register snapshots since 2023" },
            { n: h.exits_observed.toLocaleString("en-GB"), l: "Sponsors that left the register since 2023" },
            { n: "200", l: "Live ads read per search, at most" },
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
