"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  useUserApi,
  type LastMatch,
  type SavedSearch,
} from "@/lib/user-api";
import insights from "@/data/insights.json";
import ClerkWelcomeName from "@/app/components/ClerkWelcomeName";

const EASE = [0.16, 1, 0.3, 1] as const;

/* Animated score ring */
function ScoreRing({ score }: { score: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ * (1 - pct / 100);

  return (
    <svg width="136" height="136" viewBox="0 0 136 136" style={{ display: "block" }}>
      {/* Track */}
      <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
      {/* Arc */}
      <motion.circle
        ref={ref}
        cx="68" cy="68" r={r}
        fill="none"
        stroke="#4F6EF7"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={inView ? { strokeDashoffset: offset } : { strokeDashoffset: circ }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "68px 68px" }}
      />
      {/* Label */}
      <text x="68" y="64" textAnchor="middle" fill="var(--color-ink)" fontSize="22" fontWeight="500" fontFamily="Inter, sans-serif">{pct}%</text>
      <text x="68" y="82" textAnchor="middle" fill="var(--color-muted)" fontSize="11" fontFamily="Inter, sans-serif">match</text>
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const api = useUserApi();
  const [role, setRole] = useState("");
  const [lastMatch, setLastMatch] = useState<LastMatch | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [match, searches] = await Promise.all([
        api.getLastMatch(),
        api.getSavedSearches(),
      ]);
      if (cancelled) return;
      setLastMatch(match);
      setSaved(searches);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = role.trim();
    router.push(q ? `/search?role=${encodeURIComponent(q)}` : "/search");
  }

  const gaps = (lastMatch?.gaps || []).slice(0, 3);
  const sponsors = (lastMatch?.sponsors || []).slice(0, 3);
  const topSkill = (lastMatch?.requirement_frequencies || [])[0];
  const scotland = insights.regions.find((r) => r.region === "Scotland");
  const london = insights.regions.find((r) => r.region === "London");
  const score = lastMatch?.score != null ? Math.round(lastMatch.score) : null;

  return (
    <main style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-line)", marginBottom: "2rem" }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(1.4rem,3vw,1.875rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)" }}>
          Welcome back, <ClerkWelcomeName />
        </h1>
        <div style={{ marginTop: "0.625rem", display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>
          <span>
            Match score:{" "}
            <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>
              {score != null ? `${score}%` : "N/A"}
            </strong>
            {lastMatch?.role ? ` for ${lastMatch.role}` : ""}
          </span>
          <span>
            Saved searches: <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>{saved.length}</strong>
          </span>
          <span style={{ color: "var(--color-muted)" }}>Email alerts: not sending yet</span>
        </div>
      </motion.header>

      {/* Search card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.07, ease: EASE }}
        aria-labelledby="search-mod"
        style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.5rem", marginBottom: "2rem" }}
      >
        <h2 id="search-mod" style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Search licensed sponsors
        </h2>
        <form onSubmit={onSearch} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }} className="sm:flex-row">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Data Analyst, Marketing Manager, Software Engineer"
            style={{
              flex: 1, minHeight: 44, borderRadius: "var(--radius-control)",
              border: "1px solid var(--color-line-hover)", background: "var(--color-canvas)",
              padding: "0 1rem", fontSize: "0.9375rem", color: "var(--color-ink)",
              boxSizing: "border-box", outline: "none",
              transition: "border-color 150ms, box-shadow 150ms",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--color-gold-dark)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.2)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--color-line-hover)"; e.target.style.boxShadow = "none"; }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="cta-primary" style={{ minHeight: 44, padding: "0 1.125rem", fontSize: "0.9375rem", fontWeight: 500, border: 0, cursor: "pointer", flexShrink: 0 }}>
              Search
            </button>
            <Link href="/search" style={{
              display: "inline-flex", alignItems: "center", minHeight: 44,
              borderRadius: "var(--radius-control)", border: "1px solid var(--color-line-hover)",
              padding: "0 1rem", fontSize: "0.9375rem", fontWeight: 500,
              color: "var(--color-ink-soft)", textDecoration: "none", flexShrink: 0,
              transition: "border-color 150ms, color 150ms",
            }}>
              Upload CV
            </Link>
          </div>
        </form>
        {saved[0] ? (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
            Quick action:{" "}
            <Link
              href={`/search?role=${encodeURIComponent(saved[0].role)}${saved[0].experience ? `&experience=${saved[0].experience}` : ""}`}
              style={{ fontWeight: 500, color: "var(--color-link)" }}
            >
              Re-run {saved[0].role}
            </Link>
          </p>
        ) : null}
      </motion.section>

      {/* Match overview */}
      <section style={{ marginBottom: "2rem" }} aria-labelledby="match-overview">
        <h2 id="match-overview" style={{ margin: "0 0 1rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          {lastMatch?.score != null && lastMatch.role
            ? `You match ${Math.round(lastMatch.score)}% of requirements for ${lastMatch.role}`
            : "Your match overview"}
        </h2>
        {loading ? (
          <p style={{ color: "var(--color-muted)", fontSize: "0.9375rem" }}>Loading your last search…</p>
        ) : !lastMatch ? (
          <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "2rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-gold-pale)", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                <circle cx="13" cy="13" r="9" stroke="#4F6EF7" strokeWidth="1.75"/>
                <path d="M20 20L25 25" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-ink)", fontSize: "0.9375rem" }}>Run your first search</p>
            <p style={{ margin: "0.5rem 0 1.25rem", maxWidth: "36ch", marginLeft: "auto", marginRight: "auto", color: "var(--color-ink-soft)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              See a match score, priority skill gaps, and top sponsors here.
            </p>
            <Link href="/search" className="cta-primary" style={{ display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 1.125rem", fontSize: "0.9375rem", fontWeight: 500, textDecoration: "none" }}>
              Start a search
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr" }} className="md:grid-cols-[auto_1fr]">
            {/* Score ring card */}
            <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", minWidth: 200 }}>
              <ScoreRing score={score ?? 0} />
              {lastMatch.role && (
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", textAlign: "center" }}>for {lastMatch.role}</p>
              )}
              <Link href="/results" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-link)" }}>
                Open full results â†’
              </Link>
            </div>

            {/* Gap + sponsors */}
            <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr" }} className="sm:grid-cols-2">
              {/* Missing skills */}
              <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
                  Missing skills
                </p>
                <ul style={{ listStyle: "none", margin: "0.875rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {gaps.length ? (
                    gaps.map((g) => (
                      <li key={g.skill} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", color: "var(--color-ink)" }}>
                          {g.skill}
                          {g.frequency_pct != null ? (
                            <span style={{ color: "var(--color-muted)" }}> · {g.frequency_pct}%</span>
                          ) : null}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>No gaps stored yet</li>
                  )}
                </ul>
              </div>
              {/* Top sponsors */}
              <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
                  Top sponsors
                </p>
                <ul style={{ listStyle: "none", margin: "0.875rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {sponsors.length ? (
                    sponsors.map((s, i) => (
                      <li key={`${s.company}-${i}`} style={{ fontSize: "0.875rem", color: "var(--color-ink)" }}>
                        <span style={{ fontWeight: 500 }}>{s.company}</span>
                        {s.stability_band ? (
                          <span style={{ color: "var(--color-muted)" }}> · {s.stability_band}</span>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>No sponsors stored yet</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Insights strip */}
      <section style={{ marginBottom: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }} aria-labelledby="insights-strip">
        <h2 id="insights-strip" style={{ margin: "0 0 1rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Insights & data
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr" }} className="md:grid-cols-3">
          <li style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
            {topSkill ? (
              <>
                <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500, color: "var(--color-gold-dark)", letterSpacing: "-0.02em" }}>{topSkill.share_pct}%</p>
                <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)", lineHeight: 1.5 }}>
                  of ads in your last search required <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>{topSkill.skill}</strong>
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-ink-soft)", lineHeight: 1.6 }}>
                Skill demand charts appear after you search a role.
              </p>
            )}
          </li>
          <li style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.02em" }}>
              {london?.exit_rate_pct}% <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", fontWeight: 400 }}>vs {scotland?.exit_rate_pct}%</span>
            </p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)", lineHeight: 1.5 }}>
              London vs Scotland register exit rates. Tenure is a tiebreaker, not a veto.
            </p>
          </li>
          <li style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.02em" }}>
              {insights.headline.pct_2023_cohort_exited}%
            </p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)", lineHeight: 1.5 }}>
              of 2023-first-seen sponsors later left the register.
            </p>
            <Link href="/insights" style={{ display: "inline-block", marginTop: "0.625rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-link)" }}>
              Open insights â†’
            </Link>
          </li>
        </ul>
      </section>

      {/* Saved searches */}
      <section style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)", marginBottom: "2rem" }} aria-labelledby="saved">
        <h2 id="saved" style={{ margin: "0 0 0.875rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Saved searches
        </h2>
        {saved.length === 0 ? (
          <p style={{ color: "var(--color-ink-soft)", fontSize: "0.9375rem" }}>
            Save a search from your results page to re-run it here.
          </p>
        ) : (
          <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {saved.map((s, i) => (
                <li
                  key={s.id}
                  style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.875rem 1.25rem", borderBottom: i < saved.length - 1 ? "1px solid var(--color-line)" : "none" }}
                >
                  <span style={{ fontWeight: 500, color: "var(--color-ink)", fontSize: "0.9375rem" }}>{s.role}</span>
                  <Link
                    href={`/search?role=${encodeURIComponent(s.role)}${s.experience ? `&experience=${s.experience}` : ""}${s.min_salary != null ? `&min_salary=${s.min_salary}` : ""}`}
                    className="cta-primary"
                    style={{ display: "inline-flex", alignItems: "center", minHeight: 36, padding: "0 0.875rem", fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none" }}
                  >
                    Run
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }} aria-labelledby="quick">
        <h2 id="quick" style={{ margin: "0 0 1rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Quick actions
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr" }} className="sm:grid-cols-3">
          {[
            {
              href: "/solutions/cv-guide",
              title: "Improve your CV",
              sub: "CV guide",
              icon: <path d="M5 3h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM7 7h6M7 10h6M7 13h4" stroke="#4F6EF7" strokeWidth="1.25" strokeLinecap="round"/>,
            },
            {
              href: "/solutions/sponsorship-checker",
              title: "Check a company",
              sub: "Sponsorship checker",
              icon: <><circle cx="9" cy="9" r="6" stroke="#4F6EF7" strokeWidth="1.25"/><path d="M13.5 13.5L17 17" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/></>,
            },
            {
              href: "/solutions/immigration-guide",
              title: "Visa routes",
              sub: "Immigration guide",
              icon: <><path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Z" stroke="#4F6EF7" strokeWidth="1.25"/><path d="M2 10h16M10 2c-2 2.5-3 5-3 8s1 5.5 3 8" stroke="#4F6EF7" strokeWidth="1" strokeLinecap="round"/></>,
            },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} style={{ display: "block", background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem", textDecoration: "none", transition: "border-color 150ms" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>{item.icon}</svg>
                </div>
                <span style={{ display: "block", fontWeight: 500, color: "var(--color-ink)", fontSize: "0.9375rem" }}>{item.title}</span>
                <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--color-muted)" }}>{item.sub}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
