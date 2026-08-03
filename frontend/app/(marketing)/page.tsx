"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartLineUp,
  CheckCircle,
  MagnifyingGlass,
  Path,
  SealCheck,
  Student,
  XCircle,
} from "@phosphor-icons/react";
import insights from "@/data/insights.json";
import HeroDashboard from "@/app/components/landing/HeroDashboard";
import LandingChart from "@/app/components/landing/LandingChart";
import IntegrationsHub from "@/app/components/landing/IntegrationsHub";

function SectionOrb({
  variant,
  side,
}: {
  variant: "blue" | "violet" | "sky";
  side: "left" | "right";
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onScroll = () => setOffset(window.scrollY * 0.3);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className={`orb orb-${variant}`}
      style={{
        width: variant === "blue" ? 700 : 600,
        height: variant === "blue" ? 700 : 600,
        top: side === "left" ? "-120px" : "40px",
        left: side === "left" ? "-220px" : "auto",
        right: side === "right" ? "-220px" : "auto",
        filter: "blur(60px)",
        transform: `translate3d(0, ${offset * (side === "left" ? 0.15 : -0.1)}px, 0)`,
      }}
    />
  );
}

const FEATURES = [
  {
    t: "Sponsor check",
    d: "Live register match. Verified, likely, or possible.",
    tone: "mint" as const,
    Icon: SealCheck,
  },
  {
    t: "Skill demand",
    d: "What ads ask for, held against your CV.",
    tone: "indigo" as const,
    Icon: MagnifyingGlass,
  },
  {
    t: "Learning path",
    d: "Skills first, then CV lines, then roles.",
    tone: "violet" as const,
    Icon: Path,
  },
  {
    t: "CV score",
    d: "Five recruiter checks. One fix that matters.",
    tone: "sky" as const,
    Icon: Student,
  },
];

const STEPS = [
  { n: "01", t: "Search a role" },
  { n: "02", t: "Check sponsors" },
  { n: "03", t: "Read every JD" },
  { n: "04", t: "Get the roadmap" },
];

const FAQ_ITEMS = [
  {
    q: "How do you check sponsor licences?",
    a: "Against the current Home Office register. Verified on the careers page, or name-matched with a confidence score.",
  },
  {
    q: "What does job analysis cover?",
    a: "Skills, essential vs desirable language, and salary against the visa threshold. Upload a CV to compare.",
  },
  {
    q: "What's in the roadmap?",
    a: "Prioritised gaps, weeks to learn, CV rewrites, and which roles to target now.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "Grounded in skill frequencies from your specific search, not generic advice.",
  },
  {
    q: "What happens to my CV?",
    a: "Read in memory, used for the assessment, then gone. Not stored or trained on.",
  },
  {
    q: "Is the register current?",
    a: "Yes, as of 28 July 2026. Refreshed monthly, with 10 snapshots since 2023.",
  },
  {
    q: "Why does salary matter?",
    a: "Skilled Worker needs £38,700 or the going rate, whichever is higher.",
  },
  {
    q: "Do I need to upload a CV?",
    a: "No. A CV opens the personal gap analysis and roadmap.",
  },
];

const NOW_HUNT = [
  "Guess who can sponsor",
  "Guess if your CV fits",
  "Apply for an hour",
  "Hit a visa wall",
  "Start again",
];

const WITH_US = [
  "Search once",
  "Sponsors labelled",
  "Gaps ranked",
  "CV scored",
  "Apply with a plan",
];

const SOLUTIONS = [
  {
    href: "/search",
    title: "Sponsor search",
    body: "Search UK roles and match them to licensed sponsors.",
    tone: "indigo" as const,
  },
  {
    href: "/solutions/immigration-guide",
    title: "Immigration guide",
    body: "Skilled Worker and Graduate routes, with GOV.UK links.",
    tone: "violet" as const,
  },
  {
    href: "/solutions/sponsorship-checker",
    title: "Sponsorship checker",
    body: "Look up a company before you invest an hour.",
    tone: "blue" as const,
  },
  {
    href: "/solutions/cv-guide",
    title: "CV guide",
    body: "Write for sponsor-market ads. Score against live demand.",
    tone: "indigo" as const,
  },
];

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const sponsors = insights.headline.sponsors_tracked;

  return (
    <main className="pb-0">
      <section className="hero-bento section-orb" style={{ position: "relative" }}>
        <SectionOrb variant="violet" side="left" />
        <SectionOrb variant="blue" side="right" />
        <div
          aria-hidden
          className="orb orb-sky"
          style={{
            width: 650,
            height: 650,
            bottom: "-20%",
            left: "30%",
            filter: "blur(60px)",
          }}
        />

        <div className="hero-bento__top">
          <div className="hero-bento__copy">
            <h1
              className="motion-enter"
              style={{
                margin: 0,
                maxWidth: "16ch",
                fontSize: "clamp(2.15rem, 4.2vw, 3.25rem)",
                fontWeight: 500,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "var(--color-ink)",
              }}
            >
              You&apos;ve been applying to jobs that can&apos;t sponsor you.
            </h1>

            <p
              style={{
                margin: "1.1rem 0 0",
                maxWidth: "40ch",
                fontSize: "clamp(0.95rem, 1.3vw, 1.0625rem)",
                lineHeight: 1.55,
                color: "var(--color-ink-soft)",
              }}
            >
              Type a role. We check sponsors, map skill gaps, and give you a clear next step.
            </p>

            <div
              style={{
                marginTop: "1.35rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.65rem",
                alignItems: "center",
              }}
            >
              <Link
                href="/search"
                className="cta-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 46,
                  padding: "0 1.35rem",
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  borderRadius: 999,
                }}
              >
                Search without signing up
              </Link>
              <a
                href="#how-it-works"
                className="cta-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 46,
                  padding: "0 1.2rem",
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  borderRadius: 999,
                }}
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="hero-bento__visual">
            <HeroDashboard />
          </div>
        </div>

        <div className="hero-bento__bottom">
          <div
            className="hero-stat hero-stat--wide"
            style={{
              background:
                "radial-gradient(ellipse 80% 90% at 90% 40%, rgba(79,110,247,0.5) 0%, transparent 55%), linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
              color: "#fff",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.4,
                }}
              >
                Register data updated 28 July 2026 · {sponsors.toLocaleString()} sponsors checked
              </p>
              <p
                style={{
                  margin: "0.55rem 0 0",
                  fontSize: "clamp(1.75rem, 3vw, 2.35rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {sponsors.toLocaleString()}
              </p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>
                Sponsor licences checked per search
              </p>
            </div>
          </div>

          <div
            className="hero-stat"
            style={{
              background: "rgba(238,242,255,0.95)",
              border: "1px solid rgba(199,210,254,0.9)",
              backdropFilter: "blur(12px)",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--color-gold)",
              }}
            >
              59%
            </p>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)", lineHeight: 1.3 }}>
              Name-match precision, tested on 100 samples
            </p>
          </div>

          <div
            className="hero-stat"
            style={{
              background: "var(--gradient-cta)",
              color: "#fff",
              boxShadow: "0 8px 28px rgba(79,110,247,0.28)",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              200
            </p>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.8125rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>
              Live job descriptions analysed per search
            </p>
          </div>
        </div>
      </section>

      <div className="marquee-wrap full-bleed" style={{ padding: "0.85rem 0", background: "var(--gradient-marquee)" }}>
        <div
          className="marquee-track"
          style={{
            display: "flex",
            gap: "3rem",
            whiteSpace: "nowrap",
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>Built for international students.</span>
          ))}
        </div>
      </div>

      <section className="section-orb" style={{ padding: "4.5rem 0 2rem" }} aria-labelledby="what-it-does">
        <SectionOrb variant="blue" side="right" />
        <h2
          id="what-it-does"
          style={{
            margin: 0,
            fontSize: "clamp(1.85rem, 3.4vw, 2.5rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--color-ink)",
          }}
        >
          What you get
        </h2>
        <p
          style={{
            margin: "0.65rem 0 0",
            maxWidth: "36ch",
            fontSize: "1rem",
            lineHeight: 1.5,
            color: "var(--color-ink-soft)",
          }}
        >
          Four signals. No job-board noise.
        </p>

        <div className="feature-bento" style={{ marginTop: "1.85rem" }}>
          {FEATURES.map((f, i) => {
            const Icon = f.Icon;
            return (
              <motion.article
                key={f.t}
                className={`feature-tile feature-tile--${f.tone}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "clamp(1.15rem, 1.5vw, 1.35rem)",
                      fontWeight: 500,
                      lineHeight: 1.2,
                      letterSpacing: "-0.02em",
                      color: "var(--color-ink)",
                    }}
                  >
                    {f.t}
                  </h3>
                  <span className="dash-card-icon" aria-hidden>
                    <Icon size={18} color="#4F6EF7" weight="duotone" />
                  </span>
                </div>

                <div className="feature-tile__visual">
                  {i === 0 ? (
                    <div style={{ display: "grid", gap: "0.55rem" }}>
                      {[
                        { name: "Monzo", label: "Verified", color: "#065F46", bg: "rgba(209,250,229,0.95)", fill: "#10B981", pct: 92 },
                        { name: "Deliveroo", label: "Likely", color: "#3730A3", bg: "rgba(224,231,255,0.95)", fill: "#4F6EF7", pct: 68 },
                        { name: "LocalCo", label: "Possible", color: "#92400E", bg: "rgba(254,243,199,0.95)", fill: "#F59E0B", pct: 34 },
                      ].map((b) => (
                        <div key={b.label}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-ink)" }}>{b.name}</span>
                            <span
                              style={{
                                fontSize: "0.625rem",
                                fontWeight: 500,
                                padding: "0.18rem 0.45rem",
                                borderRadius: 999,
                                background: b.bg,
                                color: b.color,
                              }}
                            >
                              {b.label}
                            </span>
                          </div>
                          <div className="abs-track">
                            <div className="abs-track__fill" style={{ width: `${b.pct}%`, background: b.fill }} />
                            <span className="abs-track__thumb" style={{ left: `${b.pct}%`, background: b.fill }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {i === 1 ? (
                    <div className="mini-bars" aria-hidden>
                      {[44, 72, 38, 86, 55, 64, 48].map((h, idx) => (
                        <span
                          key={idx}
                          className="mini-bars__bar"
                          style={{ height: `${h}%`, opacity: 0.45 + idx * 0.07 }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {i === 2 ? (
                    <div style={{ display: "grid", gap: "0.7rem" }}>
                      {[
                        { skill: "SQL", pct: 71 },
                        { skill: "Power BI", pct: 23 },
                        { skill: "dbt", pct: 18 },
                      ].map((row) => (
                        <div key={row.skill}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{row.skill}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{row.pct}%</span>
                          </div>
                          <div className="abs-track">
                            <div className="abs-track__fill" style={{ width: `${row.pct}%` }} />
                            <span className="abs-track__thumb" style={{ left: `${row.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {i === 3 ? (
                    <div className="score-ring-wrap">
                      <div className="hero-score-ring" aria-hidden>
                        <svg viewBox="0 0 96 96" width="96" height="96">
                          <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(79,110,247,0.12)" strokeWidth="8" />
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            fill="none"
                            stroke="#4F6EF7"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 36 * 0.72} ${2 * Math.PI * 36}`}
                            transform="rotate(-90 48 48)"
                          />
                          <text
                            x="48"
                            y="48"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="var(--color-ink)"
                            fontSize="22"
                            fontWeight="600"
                            style={{ letterSpacing: "-0.04em" }}
                          >
                            72%
                          </text>
                        </svg>
                      </div>
                      <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "var(--color-muted)", textAlign: "center" }}>
                        Match score
                      </p>
                    </div>
                  ) : null}
                </div>

                <p style={{ margin: "auto 0 0", fontSize: "0.8125rem", lineHeight: 1.45, color: "var(--color-muted)" }}>
                  {f.d}
                </p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <LandingChart />

      <section className="section-orb" style={{ padding: "3rem 0" }} aria-labelledby="see-working">
        <SectionOrb variant="violet" side="left" />
        <h2
          id="see-working"
          style={{
            margin: 0,
            fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--color-ink)",
          }}
        >
          See it working
        </h2>
        <p
          style={{
            margin: "0.75rem 0 0",
            maxWidth: "40ch",
            fontSize: "1.0625rem",
            lineHeight: 1.55,
            color: "var(--color-ink-soft)",
          }}
        >
          Data Analyst search, condensed.
        </p>

        <div className="demo-grid" style={{ marginTop: "1.75rem" }}>
          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card-icon dash-card-icon--mint" aria-hidden>
                <SealCheck size={16} color="#065F46" weight="fill" />
              </span>
              <h3>Sponsors</h3>
              <span className="dash-card__menu" aria-hidden>· · ·</span>
            </div>
            <div className="dash-card__metrics">
              <div>
                <p className="dash-metric">47</p>
                <p className="dash-label">Sponsors</p>
              </div>
              <div>
                <p className="dash-metric">3</p>
                <p className="dash-label">Verified</p>
              </div>
              <div>
                <p className="dash-metric">200</p>
                <p className="dash-label">Ads scanned</p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
              {[
                { label: "Verified", detail: "Monzo · Data Analyst", tone: "mint" },
                { label: "Likely", detail: "SQL gap · 71% of ads", tone: "indigo" },
                { label: "Possible", detail: "Rewrite summary first", tone: "amber" },
              ].map((row) => (
                <div key={row.label} className={`dash-row dash-row--${row.tone}`}>
                  <span>{row.label}</span>
                  <strong>{row.detail}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card-icon" aria-hidden>
                <MagnifyingGlass size={16} color="#4F6EF7" weight="duotone" />
              </span>
              <h3>Skills</h3>
              <span className="dash-card__menu" aria-hidden>· · ·</span>
            </div>
            <div className="dash-card__metrics">
              <div>
                <p className="dash-metric">71%</p>
                <p className="dash-label">SQL</p>
              </div>
              <div>
                <p className="dash-metric">23%</p>
                <p className="dash-label">Power BI</p>
              </div>
            </div>
            <div className="mini-bars mini-bars--tall" aria-hidden style={{ marginTop: "1.1rem" }}>
              {[40, 68, 32, 84, 52, 61, 45, 73].map((h, idx) => (
                <span key={idx} className="mini-bars__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </article>

          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card-icon dash-card-icon--violet" aria-hidden>
                <ChartLineUp size={16} color="#5B21B6" weight="duotone" />
              </span>
              <h3>Tenure</h3>
              <span className="dash-card__menu" aria-hidden>· · ·</span>
            </div>
            <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.35rem" }}>
              {insights.tenure_bands.map((b) => {
                const color = b.band === "Established" ? "#10B981" : b.band === "Moderate" ? "#4F6EF7" : "#F59E0B";
                return (
                  <div key={b.band} className="dash-row" style={{ background: "rgba(245,243,255,0.55)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} aria-hidden />
                      <span style={{ color: "var(--color-ink)", fontSize: "0.8125rem", fontWeight: 500 }}>{b.band}</span>
                    </div>
                    <strong style={{ color: "var(--color-muted)", fontWeight: 400, fontSize: "0.75rem" }}>{b.label}</strong>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="section-orb" style={{ padding: "2rem 0 3.5rem" }} aria-labelledby="how-heading">
        <SectionOrb variant="sky" side="right" />
        <div className="how-steps-wrap">
          <h2
            id="how-heading"
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--color-ink)",
              position: "relative",
            }}
          >
            How it works
          </h2>
          <p
            style={{
              margin: "0.65rem 0 0",
              maxWidth: "36ch",
              fontSize: "1.0625rem",
              lineHeight: 1.5,
              color: "var(--color-ink-soft)",
              position: "relative",
            }}
          >
            From a job title to a sponsored shortlist.
          </p>

          <ol className="how-steps" style={{ listStyle: "none", margin: "2.25rem 0 0", padding: 0, position: "relative" }}>
            {STEPS.map((s) => (
              <li key={s.n} className="how-step">
                <div className="how-step__top">
                  <p className="how-step__num">{s.n}</p>
                  <span className="how-step__arrow" aria-hidden />
                </div>
                <h3 className="how-step__label">{s.t}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <IntegrationsHub />

      <section id="solutions" style={{ padding: "3.5rem 0" }} aria-labelledby="solutions-heading">
        <h2
          id="solutions-heading"
          style={{
            margin: 0,
            fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--color-ink)",
          }}
        >
          Solutions
        </h2>
        <p
          style={{
            margin: "0.75rem 0 0",
            maxWidth: "42ch",
            fontSize: "1.0625rem",
            lineHeight: 1.55,
            color: "var(--color-ink-soft)",
          }}
        >
          Guides around the search.
        </p>
        <ul className="solutions-row">
          {SOLUTIONS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`solution-tile solution-tile--${item.tone}`}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500, color: "var(--color-ink)" }}>
                  {item.title}
                </h3>
                <p style={{ margin: "0.7rem 0 0", fontSize: "0.875rem", lineHeight: 1.55, color: "var(--color-ink-soft)", flex: 1 }}>
                  {item.body}
                </p>
                <span style={{ marginTop: "1.15rem", fontSize: "0.8125rem", fontWeight: 500, color: "#4F6EF7" }}>
                  Open →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section-orb compare-section" style={{ padding: "0 0 4rem" }} aria-labelledby="difference">
        <SectionOrb variant="violet" side="right" />
        <h2
          id="difference"
          style={{
            margin: 0,
            fontSize: "clamp(1.85rem, 3.4vw, 2.5rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--color-ink)",
          }}
        >
          The difference
        </h2>
        <div className="compare-grid">
          <div className="compare-other">
            <div className="compare-head">
              <span className="compare-badge compare-badge--muted">Before</span>
              <p className="compare-title">How you&apos;re hunting now</p>
            </div>
            <ul className="compare-list">
              {NOW_HUNT.map((line) => (
                <li key={line} className="compare-item compare-item--muted">
                  <XCircle size={18} weight="fill" className="compare-item__icon" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="compare-ours">
            <div className="compare-head">
              <span className="compare-badge compare-badge--brand">After</span>
              <p className="compare-title compare-title--brand">With Sponsor Signal</p>
            </div>
            <ul className="compare-list">
              {WITH_US.map((line) => (
                <li key={line} className="compare-item compare-item--brand">
                  <CheckCircle size={18} weight="fill" className="compare-item__icon" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 4rem" }} aria-labelledby="stories">
        <div
          className="demo-panel"
          style={{
            padding: "1.75rem 1.6rem",
            background: "linear-gradient(135deg, rgba(238,242,255,0.95), rgba(245,243,255,0.9))",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ChartLineUp
            size={72}
            color="rgba(79,110,247,0.14)"
            weight="duotone"
            aria-hidden
            style={{ position: "absolute", top: 12, right: 16 }}
          />
          <h2 id="stories" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500, maxWidth: "36ch", letterSpacing: "-0.02em" }}>
            Still early. If this helped you land something, tell us.
          </h2>
          <p style={{ margin: "0.9rem 0 0" }}>
            <a
              href="mailto:dakshkumar2k2@gmail.com?subject=My%20Sponsor%20Signal%20story"
              className="cta-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 1.25rem",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.9375rem",
              }}
            >
              Tell us your story
            </a>
          </p>
        </div>
      </section>

      <section style={{ padding: "0 0 4rem" }} aria-labelledby="faq">
        <h2
          id="faq"
          style={{
            margin: 0,
            fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--color-ink)",
          }}
        >
          Things people ask
        </h2>
        <div style={{ marginTop: "1.35rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {FAQ_ITEMS.map((item, i) => {
            const open = faqOpen === i;
            return (
              <motion.div
                key={item.q}
                layout
                className="demo-panel"
                style={{
                  padding: "0.35rem 1.15rem",
                  boxShadow: open ? "0 12px 32px rgba(79,110,247,0.1)" : "0 6px 20px rgba(79,110,247,0.05)",
                }}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setFaqOpen(open ? null : i)}
                  style={{
                    width: "100%",
                    minHeight: 52,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    border: 0,
                    background: "transparent",
                    padding: 0,
                    textAlign: "left",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                    cursor: "pointer",
                  }}
                >
                  {item.q}
                  <motion.span
                    aria-hidden
                    animate={{ rotate: open ? 90 : 0 }}
                    style={{ color: "#4F6EF7", display: "inline-block", fontSize: "1.1rem" }}
                  >
                    ›
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.p
                      key="a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        margin: "0 0 1rem",
                        maxWidth: "62ch",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "var(--color-ink-soft)",
                        overflow: "hidden",
                      }}
                    >
                      {item.a}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="full-bleed site-footer">
        <Link
          href="/"
          className="site-footer__logo"
          aria-label="Sponsor Signal home"
        >
          <svg width="28" height="28" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M9 1v16M1 9h16M3.1 3.1l11.8 11.8M14.9 3.1L3.1 14.9"
              stroke="#A5B4FC"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Top CTA row: headline left, actions right */}
          <div
            className="footer-cta-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              paddingBottom: "2.75rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ flex: "1 1 240px", maxWidth: 520 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.2,
                }}
              >
                You&apos;ve read enough. Try a search.
              </h2>
              <p
                style={{
                  margin: "0.65rem 0 0",
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.5,
                }}
              >
                No sign-up. Takes 30 seconds. Your CV isn&apos;t stored.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Link
                href="/search"
                className="cta-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 44,
                  padding: "0 1.35rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  borderRadius: 999,
                }}
              >
                Search a role
              </Link>
              <Link
                href="/sign-up"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  minHeight: 44,
                  padding: "0 1.25rem",
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                Search a role
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* Brand left + link columns right */}
          <div
            className="footer-nav-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "2.5rem",
              paddingTop: "2.75rem",
            }}
          >
            <div style={{ flex: "1 1 220px", maxWidth: 320 }}>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                Sponsor Signal
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                For international students trying to find work in the UK.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2.5rem 3.5rem",
                flex: "2 1 360px",
                justifyContent: "flex-end",
              }}
            >
              <div>
                {[
                  ["/search", "Search"],
                  ["/#solutions", "Solutions"],
                  ["/insights", "Insights"],
                  ["/about", "About"],
                ].map(([href, label]) => (
                  <Link
                    key={label}
                    href={href}
                    className="footer-link"
                    style={{
                      display: "block",
                      marginBottom: "0.55rem",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.65)",
                      textDecoration: "none",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <div>
                {[
                  ["/methodology", "Methodology"],
                ].map(([href, label]) => (
                  <Link
                    key={label}
                    href={href}
                    className="footer-link"
                    style={{
                      display: "block",
                      marginBottom: "0.55rem",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.65)",
                      textDecoration: "none",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <div>
                <p
                  style={{
                    margin: "0 0 0.55rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Contact
                </p>
                <a
                  href="mailto:dakshkumar2k2@gmail.com"
                  className="footer-link"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                  }}
                >
                  dakshkumar2k2@gmail.com
                </a>
              </div>
            </div>
          </div>

          <p
            style={{
              margin: "2.5rem 0 0",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Built by an international student, for international students.
          </p>
        </div>
      </footer>
    </main>
  );
}
