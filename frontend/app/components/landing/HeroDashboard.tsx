"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

const SKILLS = [
  { name: "SQL", pct: 71 },
  { name: "Power BI", pct: 23 },
  { name: "Tableau", pct: 18 },
];

function WindowChrome({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.45rem 0.7rem",
        borderBottom: "1px solid rgba(99,102,241,0.1)",
      }}
    >
      <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--color-ink)" }}>{title}</span>
      <span style={{ display: "flex", gap: 4 }} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i === 0 ? "#F87171" : i === 1 ? "#FBBF24" : "#34D399",
            }}
          />
        ))}
      </span>
    </div>
  );
}

function ScreenShell({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.95)",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 16px 40px rgba(79,110,247,0.14)",
        ...style,
      }}
    >
      <div
        style={{
          height: 2,
          background: "linear-gradient(90deg, #818CF8, #4F6EF7, #7C3AED)",
        }}
      />
      {children}
    </div>
  );
}

function ResultsScreen({ ready }: { ready: boolean }) {
  return (
    <ScreenShell>
      <WindowChrome title="Results · Data Analyst" />
      <div style={{ padding: "0.65rem", display: "grid", gap: "0.55rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.35rem" }}>
          {[
            { n: "200", l: "ads" },
            { n: "47", l: "sponsors" },
            { n: "3", l: "verified" },
            { n: "72%", l: "match" },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                textAlign: "center",
                padding: "0.35rem 0.2rem",
                borderRadius: 8,
                background: "rgba(238,242,255,0.85)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, color: "#4F6EF7" }}>{s.n}</p>
              <p style={{ margin: 0, fontSize: "0.5rem", color: "var(--color-muted)" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "0.55rem 0.65rem",
            borderRadius: 10,
            background: "rgba(236,253,245,0.7)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500 }}>Monzo</p>
              <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--color-ink-soft)" }}>Data Analyst</p>
            </div>
            <span
              style={{
                fontSize: "0.5625rem",
                fontWeight: 500,
                padding: "0.15rem 0.4rem",
                borderRadius: 999,
                background: "rgba(209,250,229,0.95)",
                color: "#065F46",
              }}
            >
              Verified
            </span>
          </div>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.625rem", color: "var(--color-signal)", fontWeight: 500 }}>
            £45,000–£55,000
          </p>
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          {SKILLS.map((s) => (
            <div key={s.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: "0.5625rem", color: "var(--color-ink-soft)" }}>{s.name}</span>
                <span style={{ fontSize: "0.5625rem", color: "var(--color-muted)" }}>{s.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: "rgba(99,102,241,0.12)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: ready ? `${s.pct}%` : "0%",
                    background: "var(--gradient-skill)",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function SkillsScreen() {
  return (
    <ScreenShell>
      <WindowChrome title="Market skills" />
      <div style={{ padding: "0.7rem", display: "grid", gap: "0.55rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <p style={{ margin: 0, fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.03em", color: "#4F6EF7" }}>
            71%
          </p>
          <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--color-muted)" }}>SQL in ads</p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 72 }}>
          {[42, 68, 35, 84, 56, 71, 48, 62].map((h, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: "6px 6px 4px 4px",
                background: i === 5 ? "#4F6EF7" : "rgba(129,140,248,0.45)",
              }}
            />
          ))}
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          {["SQL", "Python", "dbt"].map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.35rem 0.5rem",
                borderRadius: 8,
                background: "rgba(238,242,255,0.75)",
                fontSize: "0.625rem",
                fontWeight: 500,
              }}
            >
              <span>{s}</span>
              <span style={{ color: "#4F6EF7" }}>{["71%", "44%", "28%"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function RoadmapScreen() {
  return (
    <ScreenShell>
      <WindowChrome title="Your roadmap" />
      <div style={{ padding: "0.7rem", display: "grid", gap: "0.45rem" }}>
        {[
          { n: "01", t: "Learn SQL", m: "~3 weeks", tone: "#10B981" },
          { n: "02", t: "Rewrite summary", m: "CV fix", tone: "#4F6EF7" },
          { n: "03", t: "Target verified", m: "Apply now", tone: "#7C3AED" },
        ].map((row) => (
          <div
            key={row.n}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.5rem 0.55rem",
              borderRadius: 10,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(99,102,241,0.1)",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: `${row.tone}22`,
                color: row.tone,
                display: "grid",
                placeItems: "center",
                fontSize: "0.5625rem",
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {row.n}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 500 }}>{row.t}</p>
              <p style={{ margin: 0, fontSize: "0.5625rem", color: "var(--color-muted)" }}>{row.m}</p>
            </div>
          </div>
        ))}
        <div
          style={{
            marginTop: "0.15rem",
            padding: "0.55rem",
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(238,242,255,0.95), rgba(245,243,255,0.9))",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 500, letterSpacing: "-0.03em", color: "#4F6EF7" }}>
            72
          </p>
          <p style={{ margin: "0.1rem 0 0", fontSize: "0.5625rem", color: "var(--color-muted)" }}>CV match score</p>
        </div>
      </div>
    </ScreenShell>
  );
}

export default function HeroDashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <motion.div
      aria-hidden
      className="hero-screen-stack"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="hero-screen hero-screen--back">
        <RoadmapScreen />
      </div>
      <div className="hero-screen hero-screen--mid">
        <SkillsScreen />
      </div>
      <div className="hero-screen hero-screen--front">
        <ResultsScreen ready={ready} />
      </div>
    </motion.div>
  );
}
