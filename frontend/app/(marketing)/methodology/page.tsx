import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Threshold finds UK licensed sponsors, how sure we are about each match, and what the numbers do not mean.",
};

const PIPELINE = [
  {
    heading: "You name a role",
    body: "A UK job title is all we need. A CV is optional. Every result is in the UK, so we do not show roles you could not take on a UK visa.",
  },
  {
    heading: "We pull live ads",
    body: "We search Reed and Adzuna for that title and keep only UK locations. An ad that just says \"Remote\" is left out because it could be anywhere, but \"Remote, UK\" is kept.",
  },
  {
    heading: "We read the full descriptions",
    body: "For Reed ads we fetch the full job description. Adzuna only gives us a short snippet, so we can read fewer skills from that source.",
  },
  {
    heading: "Employers are matched to the register",
    body: "We compare each employer name with the Home Office Skilled Worker register, allowing for small spelling differences. Then we check the match in both directions, so two names that only share one word cannot count as a match. Recruitment agencies are never treated as confirmed sponsors.",
  },
  {
    heading: "Company job boards are added",
    body: "Some employers publish jobs on a hiring system we can read, such as Greenhouse, Ashby, Workable or Recruitee. When we find one, we fetch that board and add its roles. For those roles we are certain who the employer is. Employers we do not know yet are checked in the background after your results appear, so you never wait for it.",
  },
  {
    heading: "Skills are counted",
    body: "We count skills across every ad we could read in full, mostly Reed descriptions, plus Adzuna snippets where they help. Tools that clearly belong to a skill count for it, so GitHub Actions counts as CI/CD.",
  },
  {
    heading: "Results are ordered",
    body: "Verified sponsors come first. After that we order by how long the company has held its licence, then by how recent the ad is. The licence length comes from our own archive of past registers, which only goes back to 2023, so it shows how long we have seen a licence and not its true age.",
  },
  {
    heading: "Your CV is compared if you upload one",
    body: "We compare your CV with the skills asked for in this role's ads. An AI service then reads your CV like a hiring manager. For each top skill it decides whether you have really shown it in your work, even if you used different words, and it must quote the line from your CV that proves it. We check that the quote is really in your CV. The AI also decides which missing skills would actually stop you getting the role and which are only nice to have. It also works out your level, such as graduate or senior, so you are not shown jobs far above you. Your CV text is sent to the AI service to do this.",
  },
];

const CONFIDENCE = [
  {
    tier: "Verified",
    body: "The role came straight from the employer's own hiring board, so we are certain who the employer is.",
    color: "var(--color-signal)",
    bg: "var(--color-signal-soft)",
    dot: "#10B981",
  },
  {
    tier: "Likely",
    body: "The ad came from a job site, and the employer name matches the register at 90% or more and passes our two-way name check.",
    color: "var(--color-gold-dark)",
    bg: "var(--color-gold-pale)",
    dot: "#1e40af",
  },
  {
    tier: "Possible",
    body: "The name matches between 80% and 89%, or the employer looks like a recruitment agency. Treat it as a lead to look into and not as a fact.",
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
          How it works, and what the numbers do not mean
        </h1>
        <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-muted)" }}>
          Threshold shows evidence and does not make decisions. Nothing here tells you
          whether a company will sponsor you. It tells you who holds a licence, who is
          advertising, and how sure we are that the two are the same company.
        </p>
      </div>

      {/* Accuracy callout */}
      <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: "1 1 160px", background: "var(--color-gold-pale)", border: "1px solid rgba(29, 78, 216,0.25)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 500, color: "var(--color-gold-dark)", letterSpacing: "-0.03em", lineHeight: 1 }}>59%</p>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-gold-dark)", opacity: 0.8 }}>name matches right, out of 100 checked</p>
        </div>
        <div style={{ flex: "1 1 160px", background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>100%</p>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-muted)" }}>certain when read from the company's own board</p>
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
                  flexShrink: 0, boxShadow: "0 2px 8px rgba(29, 78, 216,0.35)",
                }}>
                  <span style={{ color: "#fff", fontSize: "0.8125rem", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                {/* Connector line */}
                {i < PIPELINE.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: "linear-gradient(to bottom, rgba(29, 78, 216,0.35), rgba(29, 78, 216,0.08))", marginTop: 4 }} />
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
          For roles taken from a company&apos;s own hiring board, we are certain who the
          employer is. For roles from job sites we work it out from the employer name.
          When we checked 100 of those by hand, the name match was right about{" "}
          <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>59 times in 100</strong>.
          An earlier check of 50 scored 68%. We show that number instead of hiding it,
          because a matching name is not proof.
        </p>
        <p style={{ margin: "1rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
          Skills in job ads are found by looking for the skill names and the tools that
          belong to them. This works well on full Reed descriptions and poorly on short
          Adzuna snippets, so a skill can be undercounted if it only appears deep in a
          cut-off description. The AI review of your CV can also be wrong about whether
          a skill is blocking, and it can give a slightly different answer if you run
          the same CV twice. Full figures are in our accuracy notes, called{" "}
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
          We can only verify an employer when it publishes roles on a hiring system we
          can read. That is common in technology, finance and fast-growing companies. It
          is rare in healthcare, hospitality, retail and the public sector, where
          employers use systems with no public job feed. Roles in those areas show up
          with a name match instead. So if your search has few verified roles, that may
          say more about the sector than about the sponsors in it.
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
