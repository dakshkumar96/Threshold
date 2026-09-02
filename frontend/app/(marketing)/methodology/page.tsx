import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Threshold finds UK licensed sponsors, how confident each match is, and what the numbers do not mean.",
};

const PIPELINE = [
  {
    heading: "You name a role",
    body: "A UK job title is all that is required. A CV is optional. Every result is UK-only; we do not show roles you cannot take on a UK visa.",
  },
  {
    heading: "We pull live ads",
    body: "Reed and Adzuna are queried for that title, then filtered to UK locations only. A bare \"Remote\" is excluded because it may be anywhere; \"Remote, UK\" is kept.",
  },
  {
    heading: "Descriptions are expanded",
    body: "Reed job IDs are expanded to full descriptions. Adzuna's public API only returns truncated snippets, which limits how many skills we can read from that source.",
  },
  {
    heading: "Employers are matched to the register",
    body: "Each employer name is fuzzy-matched against the Home Office Skilled Worker register, then re-checked with a symmetric name test so a partial word overlap cannot pass as a match. Recruitment agencies are never treated as confirmed sponsors.",
  },
  {
    heading: "Company job boards are merged in",
    body: "Where an employer is mapped to a supported applicant tracking system (Greenhouse, Ashby, Workable, Recruitee) we fetch that board and merge those roles in. Employer identity is certain for those rows. Unknown employers are probed in the background after your results are returned, never while you wait.",
  },
  {
    heading: "Skills are counted",
    body: "Skills are counted across every ad we could read in full, primarily Reed full-text descriptions, with Adzuna snippets included where available.",
  },
  {
    heading: "Results are ordered",
    body: "Sponsors are sorted verified first, then by licence tenure band, then by an optional survival score and recency. Tenure bands use observed register tenure in our archive, which is left-truncated, so they describe how long we have seen a licence rather than its true age.",
  },
  {
    heading: "Your CV is compared, if you upload one",
    body: "We score your CV against the skill list built from this role's ads and return a match score plus prioritised gaps. A free LLM then writes a recruiter-style review from those aggregates and short skill excerpts. Your CV text may be sent to a third-party LLM provider.",
  },
];

const CONFIDENCE = [
  {
    tier: "Verified",
    body: "Fetched directly from the employer's own applicant tracking system. Employer identity is certain.",
    color: "var(--color-signal)",
    bg: "var(--color-signal-soft)",
    dot: "#10B981",
  },
  {
    tier: "Likely",
    body: "Aggregator ad whose employer name matches the register at 90% or above and passes the symmetric name check.",
    color: "var(--color-gold-dark)",
    bg: "var(--color-gold-pale)",
    dot: "#3B55E6",
  },
  {
    tier: "Possible",
    body: "Name match between 80% and 89%, or an employer that looks like a recruitment agency. Treat as a lead to research, not a fact.",
    color: "var(--color-warning)",
    bg: "var(--color-warning-soft)",
    dot: "#c55a0a",
  },
];

export default function MethodologyPage() {
  return (
    <main className="pb-20 pt-10 md:pt-14">
      {/* Header */}
      <div className="motion-enter">
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
          How this works
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "24ch", lineHeight: 1.15 }}>
          Methodology, and what the numbers do not mean
        </h1>
        <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-muted)" }}>
          Threshold shows evidence, not decisions. Nothing here tells you whether a
          company will sponsor you. It tells you who holds a licence, who is advertising,
          and how sure we are that the two are the same company.
        </p>
      </div>

      {/* Accuracy callout */}
      <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: "1 1 160px", background: "var(--color-gold-pale)", border: "1px solid rgba(79,110,247,0.25)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 500, color: "var(--color-gold-dark)", letterSpacing: "-0.03em", lineHeight: 1 }}>59%</p>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-gold-dark)", opacity: 0.8 }}>name-match precision, n=100</p>
        </div>
        <div style={{ flex: "1 1 160px", background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>100%</p>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-muted)" }}>verified via direct ATS board fetch</p>
        </div>
        <div style={{ flex: "1 1 160px", background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>200+</p>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-muted)" }}>live UK ads per search</p>
        </div>
      </div>

      {/* Pipeline */}
      <section aria-labelledby="pipeline" style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <h2 id="pipeline" style={{ margin: 0, fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)" }}>
          The pipeline
        </h2>
        <ol style={{ listStyle: "none", margin: "2rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0" }}>
          {PIPELINE.map(({ heading, body }, i) => (
            <li key={heading} style={{ display: "flex", gap: "1.25rem", padding: "0 0 2.25rem 0", position: "relative" }}>
              {/* Step circle */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: "0 2px 8px rgba(79,110,247,0.35)",
                }}>
                  <span style={{ color: "#fff", fontSize: "0.8125rem", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                {/* Connector line */}
                {i < PIPELINE.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: "linear-gradient(to bottom, rgba(79,110,247,0.35), rgba(79,110,247,0.08))", marginTop: 4 }} />
                )}
              </div>
              <div style={{ paddingTop: "0.6rem" }}>
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>{heading}</h3>
                <p style={{ margin: "0.5rem 0 0", maxWidth: "62ch", fontSize: "0.875rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Confidence tiers */}
      <section aria-labelledby="confidence" style={{ marginTop: "1rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <h2 id="confidence" style={{ margin: 0, fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)" }}>
          What each confidence tier means
        </h2>
        <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr", gap: "0.875rem" }} className="md:grid-cols-3">
          {CONFIDENCE.map(({ tier, body, color, bg, dot }) => (
            <div key={tier} style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
              {/* Color strip header */}
              <div style={{ background: bg, borderBottom: `1px solid ${color}22`, padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: dot, display: "inline-block", boxShadow: `0 0 0 3px ${dot}33`, flexShrink: 0 }} />
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color }}>{tier}</h3>
              </div>
              <div style={{ padding: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Honest accuracy */}
      <section aria-labelledby="accuracy" style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <h2 id="accuracy" style={{ margin: 0, fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)" }}>
          Honest accuracy
        </h2>
        <p style={{ margin: "1rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
          For roles fetched from a company&apos;s own applicant tracking system,
          employer identity is certain. For aggregator-sourced roles it is inferred from
          the employer name, and on hand-reviewed samples that inference is right about{" "}
          <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>59% of the time</strong> (n=100; an
          earlier n=50 sample scored 68%). We show that number rather than hide it,
          because a name match is not proof.
        </p>
        <p style={{ margin: "1rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
          Skill extraction is keyword-based. It reads Reed full text well and Adzuna
          snippets poorly, so a skill can be under-counted if it only appears deep in a
          truncated description. Full figures live in{" "}
          <code style={{ borderRadius: 4, border: "1px solid var(--color-line)", background: "var(--color-elevated)", padding: "0.125rem 0.375rem", fontSize: "0.85em" }}>
            ACCURACY.md
          </code>
          .
        </p>
      </section>

      {/* Thin coverage */}
      <section aria-labelledby="coverage" style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <h2 id="coverage" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
          Where verified coverage is thin
        </h2>
        <p style={{ margin: "1rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
          Verified identity only exists where a company publishes roles through a
          supported applicant tracking system. That is common in technology, fintech,
          and scale-ups, and rare in healthcare, hospitality, retail, and the public
          sector, where employers use systems with no public job feed. Roles in those
          sectors appear with name-matched confidence instead, so a thin verified count
          in your search may say more about the sector than about the sponsors in it.
        </p>
      </section>

      {/* Footer links */}
      <p style={{ marginTop: "3rem", marginBottom: 0, display: "flex", flexWrap: "wrap", gap: "1rem 1.5rem", fontSize: "0.9375rem" }}>
        <Link href="/" style={{ fontWeight: 500, color: "var(--color-link)" }}>Search a role</Link>
        <Link href="/insights" style={{ color: "var(--color-link)" }}>Insights</Link>
      </p>
    </main>
  );
}
