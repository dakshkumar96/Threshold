"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type SkillItem = {
  skill: string;
  frequency_pct?: number | null;
  ease_weeks?: number | null;
  note?: string | null;
  priority_score?: number | null;
};

const DEFAULT_HINT =
  "Add one concrete project or course outcome you can show on your CV within the estimated weeks.";

function suggestionFor(skill: string, note?: string | null): string {
  if (note && note.trim()) return note.trim();
  const key = skill.toLowerCase();
  if (key.includes("python") || key.includes("sql") || key.includes("excel")) {
    return `Ship a small portfolio piece that uses ${skill} end-to-end, then name the outcome in your summary.`;
  }
  if (key.includes("aws") || key.includes("azure") || key.includes("cloud")) {
    return `Complete a guided lab in ${skill} and document the architecture in 5 bullets on your CV.`;
  }
  if (key.includes("communication") || key.includes("stakeholder")) {
    return "Rewrite one CV bullet to show a decision you influenced and the measurable result.";
  }
  return DEFAULT_HINT;
}

function SkillBar({ pct, delay }: { pct: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="skill-bar" style={{ marginTop: "0.5rem" }}>
      <motion.div
        className="skill-bar__fill"
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
    </div>
  );
}

export default function SkillRoadmap({
  score,
  skills,
  emptyHint,
}: {
  score: number | null;
  skills: SkillItem[];
  emptyHint?: string;
}) {
  const pct = score != null ? Math.round(score) : null;

  return (
    <section aria-labelledby="roadmap-heading">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.75rem 1.5rem" }}>
        <h2
          id="roadmap-heading"
          style={{ margin: 0, fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)" }}
        >
          {pct != null
            ? `Your route from ${pct}% toward a stronger match`
            : "Skills employers ask for most"}
        </h2>
        {pct != null && (
          <span style={{ fontSize: "2rem", fontWeight: 500, color: "var(--color-gold)", letterSpacing: "-0.03em" }}>
            {pct}%
          </span>
        )}
      </div>
      <p style={{ margin: "0.5rem 0 0", maxWidth: "62ch", fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.6 }}>
        Priority actions ranked by how often the skill appears in ads and how long it typically
        takes to learn. This is a plan, not a judgment.
      </p>

      {skills.length === 0 ? (
        <p style={{ marginTop: "1.5rem", color: "var(--color-muted)" }}>
          {emptyHint || "No priority skills to show for this search yet."}
        </p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0" }}>
          {skills.slice(0, 8).map((s, i) => (
            <motion.li
              key={s.skill}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--color-line)",
                padding: "1rem 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem 0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-gold)", fontVariantNumeric: "tabular-nums", minWidth: "1.5rem" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)", flex: "1 1 auto" }}>
                  {s.skill}
                </h3>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)", flexShrink: 0 }}>
                  {s.frequency_pct != null ? `${s.frequency_pct}% of ads` : ""}
                  {s.frequency_pct != null && s.ease_weeks != null ? " · " : ""}
                  {s.ease_weeks != null ? `~${s.ease_weeks}w` : ""}
                </span>
              </div>

              {s.frequency_pct != null && (
                <SkillBar pct={Math.min(s.frequency_pct, 100)} delay={i * 0.06} />
              )}

              <p style={{ margin: "0.5rem 0 0", maxWidth: "62ch", fontSize: "0.825rem", color: "var(--color-ink-soft)", lineHeight: 1.6 }}>
                {suggestionFor(s.skill, s.note)}
              </p>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}
