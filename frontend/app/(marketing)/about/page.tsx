import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
};

const STATS = [
  { value: "133,979", label: "licensed sponsors tracked" },
  { value: "200+", label: "live UK ads per search" },
  { value: "59%", label: "name-match precision, documented" },
];

const WHAT_IT_DOES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M13.5 13.5L17 17" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    heading: "Pull live ads",
    body: "200 live UK job ads, every search. Reed and Adzuna, filtered to UK only.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M7 9h6M7 12h4" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    heading: "Check every employer",
    body: "Every employer checked against the 133,979-company Home Office sponsor register.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10h12M10 4v12" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="8" stroke="#f5a623" strokeWidth="1.5"/>
      </svg>
    ),
    heading: "Score your CV",
    body: "Compare your CV against real market data — skills, gaps, what to learn first.",
  },
];

export default function AboutPage() {
  return (
    <main className="pb-20">
      {/* Hero */}
      <div className="motion-enter" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-gold-dark)" }}>
          About Sponsor Signal
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "14ch", lineHeight: 1.12 }}>
          You&apos;ve probably done this.
        </h1>
      </div>

      {/* Opening story with pull-quote styling */}
      <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "1fr" }} className="md:grid-cols-[3px_1fr]">
        <div className="hidden md:block" style={{ background: "var(--color-gold)", borderRadius: 999 }} />
        <div style={{ maxWidth: "62ch", display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "1.0625rem", lineHeight: 1.75, color: "var(--color-ink-soft)" }}>
          <p style={{ margin: 0 }}>
            You applied to a job you were qualified for. You got to interview. You got
            to offer. HR asked about your right to work. You explained your visa. The
            offer went silent.
          </p>
          <p style={{ margin: 0 }}>
            Or maybe earlier. You clicked &quot;visa sponsorship available&quot; on Indeed and
            half the results turned out to not sponsor. You downloaded the Home Office
            register — 130,000 companies, alphabetical, unsearchable. You gave up.
          </p>
          <p style={{ margin: 0, fontStyle: "italic", color: "var(--color-ink)" }}>
            I built Sponsor Signal because I was that person. I&apos;m on the Graduate
            visa. I&apos;ve had the HR conversation. I know what it feels like to spend
            two months on a job application that was never going to work out.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ margin: "3.5rem 0", background: "linear-gradient(135deg, #fff3dc 0%, #fff8ed 100%)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "var(--radius-card)", padding: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" }} className="grid-cols-1 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 500, color: "var(--color-gold-dark)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-gold-dark)", opacity: 0.75 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What this does */}
      <div style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-muted)" }}>
          What this actually does
        </p>
        <h2 style={{ margin: "0 0 1.75rem", fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
          You type a role. We do the rest.
        </h2>

        {/* Feature cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.875rem", marginBottom: "1.5rem" }} className="md:grid-cols-3">
          {WHAT_IT_DOES.map((item) => (
            <div key={item.heading} style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.875rem" }}>
                {item.icon}
              </div>
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>{item.heading}</h3>
              <p style={{ margin: "0.375rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>{item.body}</p>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
          If you upload your CV, we compare it against the actual market data from your
          search — not a generic template — and give you a full roadmap. The skills to
          learn first. The CV lines to rewrite. The sponsored jobs to apply to.
        </p>
      </div>

      {/* What this isn't */}
      <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
          What this isn&apos;t
        </h2>
        {/* Honest callout card */}
        <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
          <div style={{ background: "var(--color-gold-pale)", borderBottom: "1px solid rgba(245,166,35,0.2)", padding: "0.75rem 1.25rem" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gold-dark)" }}>
              Honest disclaimer
            </p>
          </div>
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
              This isn&apos;t a guarantee. Companies on the register can revoke a role. Our
              sponsor name-matching is 59% precise — that&apos;s the honest number, tested and
              documented. The roadmap is a starting point, not a promise.
            </p>
            <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink)", fontWeight: 500 }}>
              I&apos;m not going to tell you this fixes your job hunt. I&apos;m going to tell
              you it removes the guessing.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: "2rem", marginBottom: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
        Built by an international student, for international students.
      </p>
      <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.875rem", alignItems: "center" }}>
        <Link href="/search" className="cta-primary inline-flex min-h-11 items-center px-5 no-underline" style={{ fontWeight: 500 }}>
          Search a role
        </Link>
        <Link href="/methodology" style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-link)" }}>
          Read the methodology →
        </Link>
      </div>
    </main>
  );
}
