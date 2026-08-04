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
    <div className="hero-window-chrome">
      <span className="hero-window-chrome__title">{title}</span>
      <span className="hero-window-chrome__dots" aria-hidden>
        <i />
        <i />
        <i />
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
    <div className={`hero-screen-shell ${className ?? ""}`.trim()} style={style}>
      <div className="hero-screen-shell__accent" aria-hidden />
      {children}
    </div>
  );
}

function ResultsScreen({ ready }: { ready: boolean }) {
  return (
    <ScreenShell className="hero-screen-shell--front">
      <WindowChrome title="Results · Data Analyst" />
      <div className="hero-screen-body">
        <div className="hero-screen-kpis">
          {[
            { n: "200", l: "ads" },
            { n: "47", l: "sponsors" },
            { n: "3", l: "verified" },
            { n: "72%", l: "match" },
          ].map((s) => (
            <div key={s.l} className="hero-screen-kpi">
              <p className="hero-screen-kpi__n">{s.n}</p>
              <p className="hero-screen-kpi__l">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="hero-screen-job">
          <div className="hero-screen-job__row">
            <div>
              <p className="hero-screen-job__co">Monzo</p>
              <p className="hero-screen-job__role">Data Analyst</p>
            </div>
            <span className="hero-screen-job__badge">Verified</span>
          </div>
          <p className="hero-screen-job__pay">£45,000–£55,000</p>
        </div>
        <div className="hero-screen-skills">
          {SKILLS.map((s) => (
            <div key={s.name} className="hero-screen-skill">
              <div className="hero-screen-skill__row">
                <span>{s.name}</span>
                <span>{s.pct}%</span>
              </div>
              <div className="hero-screen-skill__track">
                <div
                  className="hero-screen-skill__fill"
                  style={{ width: ready ? `${s.pct}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function PeekCard({
  title,
  className,
}: {
  title: string;
  className: string;
}) {
  return (
    <div className={`hero-screen-peek ${className}`}>
      <WindowChrome title={title} />
      <div className="hero-screen-peek__body" />
    </div>
  );
}

export default function HeroDashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="hero-glass-frame">
      <div className="hero-mockup-shadow" aria-hidden />
      <motion.div
        aria-hidden
        className="hero-screen-stack"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <PeekCard title="Your roadmap" className="hero-screen--back" />
        <PeekCard title="Market skills" className="hero-screen--mid" />
        <div className="hero-screen hero-screen--front">
          <ResultsScreen ready={ready} />
        </div>
      </motion.div>
    </div>
  );
}
