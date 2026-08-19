"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SealCheck } from "@phosphor-icons/react";

const SKILLS = [
  { name: "SQL", pct: 71 },
  { name: "Power BI", pct: 23 },
  { name: "Tableau", pct: 18 },
];

const KPIS = [
  { n: "200", l: "ads" },
  { n: "47", l: "sponsors" },
  { n: "3", l: "verified" },
  { n: "72%", l: "match" },
];

/**
 * One deliberate card, not a stack of fake overlapping screens — the previous
 * three-layer "peek" version clipped its own title text (the back card's
 * chrome bar was taller than the space reserved for it to peek out of).
 * Depth now comes from a soft ambient glow behind the card plus a single
 * floating badge positioned outside the card's bounds, so nothing can clip.
 */
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
        className="hero-card"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="hero-card__head">
          <span className="hero-card__live-dot" aria-hidden />
          <span className="hero-card__label">Live preview · Data Analyst</span>
        </div>

        <div className="hero-card__kpis">
          {KPIS.map((s) => (
            <div key={s.l} className="hero-card__kpi">
              <p className="hero-card__kpi-n">{s.n}</p>
              <p className="hero-card__kpi-l">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="hero-card__job">
          <div className="hero-card__job-row">
            <div>
              <p className="hero-card__job-co">Monzo</p>
              <p className="hero-card__job-role">Data Analyst</p>
            </div>
            <span className="hero-card__job-badge">Verified</span>
          </div>
          <p className="hero-card__job-pay">£45,000–£55,000</p>
        </div>

        <div className="hero-card__skills">
          {SKILLS.map((s) => (
            <div key={s.name} className="hero-card__skill">
              <div className="hero-card__skill-row">
                <span>{s.name}</span>
                <span>{s.pct}%</span>
              </div>
              <div className="hero-card__skill-track">
                <div
                  className="hero-card__skill-fill"
                  style={{ width: ready ? `${s.pct}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="hero-card__float-chip"
        aria-hidden
        initial={{ opacity: 0, y: 8, rotate: -4 }}
        animate={{ opacity: 1, y: [0, -4, 0], rotate: -4 }}
        transition={{
          opacity: { duration: 0.5, delay: 0.6 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
        }}
      >
        <SealCheck size={14} weight="fill" color="#10B981" />
        <span>133,979 licences checked</span>
      </motion.div>
    </div>
  );
}
