"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  motion,
  useInView,
} from "framer-motion";
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
import { CURRENT_SPONSORS, REGISTER_EDITION, formatCount } from "@/lib/register";
import Logo from "@/app/components/Logo";
import HeroDashboard from "@/app/components/landing/HeroDashboard";
import LandingChart from "@/app/components/landing/LandingChart";
import IntegrationsHub from "@/app/components/landing/IntegrationsHub";

/* ─── Scroll-reveal wrapper: fades/slides content in once as it enters view ── */
function Reveal({
  children,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15, margin: "-40px" });
  const dirClass = direction === "left" ? "reveal-left" : direction === "right" ? "reveal-right" : "";
  return (
    <div
      ref={ref}
      className={`reveal ${dirClass} ${inView ? "is-visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/* ─── Hero headline: words materialise in, key phrase gets a drawn underline ─*/
function HeroHeadline() {
  return (
    <h1 className="hero-headline">
      You&apos;ve been applying
      <br />
      to jobs that can&apos;t
      <br />
      <span className="headline-accent">sponsor you.</span>
    </h1>
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
    a: "We compare every employer in a job ad against the current Home Office register of licensed sponsors. If the company's own careers page shows the same job, we mark it as verified, because then we know the employer is who we think it is. If we can only match the company by its name, we mark it as likely or possible and show how close the match was, so you can decide how much to trust it.",
  },
  {
    q: "What does job analysis cover?",
    a: "For each search we read the job descriptions and count which skills come up most often. We also note when a skill is called essential and when it is only nice to have. Then we compare the salary in the ad with the minimum a sponsored job has to pay. If you add a CV, we show which of those skills you already have and which ones are missing.",
  },
  {
    q: "What's in the roadmap?",
    a: "The roadmap lists the skills you are missing, starting with the ones that will help you most, and gives a rough number of weeks each one takes to learn. It also suggests how to reword weak lines on your CV and which roles to apply for now, and which to leave until you have closed a gap.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "A general chatbot gives advice that sounds right but is not based on the jobs you are actually going for. Threshold starts from real, current job ads and the official sponsor register. Every skill percentage and every sponsor label comes from that data, and the AI review of your CV is checked against what your CV really says.",
  },
  {
    q: "What happens to my CV?",
    a: "Your CV is read once to make your results. The text is sent to the AI service that writes the review, and we do not keep a copy of it afterwards. You can also search without an account and without uploading anything at all. The CV is only needed for your personal score and roadmap.",
  },
  {
    q: "How up to date is the register?",
    a: `We use the Home Office register from ${REGISTER_EDITION}, which lists ${formatCount(CURRENT_SPONSORS)} licensed sponsors. We update it by hand, so a licence given or taken away after that date will not show yet. We also keep 10 earlier copies going back to 2023. They show how long a company has held its licence, and a company that has held one for years is usually a safer bet than one that was added recently. A company that has dropped off the register is never shown as a sponsor.`,
  },
  {
    q: "Why does salary matter?",
    a: "A Skilled Worker visa needs a job that pays at least £41,700 a year or the going rate for that type of job, whichever is higher. If you are under 26, or switching from a Student or Graduate visa, a lower new entrant rate of £33,400 can apply. We flag jobs that pay less than the threshold so you do not spend time on an offer that cannot be sponsored.",
  },
  {
    q: "Do I need to upload a CV?",
    a: "No. You can search for a role and see sponsors, salaries and the skills employers ask for without uploading anything. Adding a CV unlocks your personal match score, the list of skills you are missing, the AI review and the roadmap. It also lets us show roles that fit your level, so a graduate is not shown lead or principal jobs.",
  },
  {
    q: "How accurate is the sponsor matching?",
    a: "Jobs we verify on a company's own careers page are certain. Jobs matched by company name alone were right about 59 times in 100 in our tests, which is why they are labelled likely or possible. Always check the employer yourself before you apply. The full method is written up on our methodology page.",
  },
];

const FOOTER_LINKS = [
  ["/search", "Search"],
  ["/#solutions", "Solutions"],
  ["/insights", "Insights"],
  ["/about", "About"],
  ["/methodology", "Methodology"],
] as const;

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

  return (
    <main className="pb-0">
      <section className="hero-bento section-orb full-bleed" style={{ position: "relative" }}>
        <div className="hero-bento__scale">
          <div className="hero-bento__top">
            <div className="hero-bento__copy" style={{ position: "relative" }}>
              <span className="hero-eyebrow">
                Home Office sponsor register from {REGISTER_EDITION}
              </span>
              <HeroHeadline />

              <p
                style={{
                  margin: "1.1rem 0 0",
                  maxWidth: "42ch",
                  fontSize: "clamp(0.95rem, 1.3vw, 1.0625rem)",
                  lineHeight: 1.55,
                  color: "rgba(255, 255, 255, 0.64)",
                }}
              >
                We check every job ad against the {formatCount(CURRENT_SPONSORS)} licensed
                sponsors on the Home Office register, so you only apply where a visa is
                actually possible.
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
                <div className="cta-primary-wrapper" style={{ borderRadius: 999 }}>
                  <Link
                    href="/search"
                    className="cta-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 1.3rem",
                      fontWeight: 500,
                      fontSize: "0.9375rem",
                      textDecoration: "none",
                      borderRadius: 999,
                    }}
                  >
                    Search without signing up
                  </Link>
                </div>
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

              <p className="hero-trust-line">
                Search without an account. Upload a CV and we read it once, then forget it.
              </p>
            </div>

            <motion.div
              className="hero-bento__visual"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroDashboard />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="section-orb" style={{ padding: "4.5rem 0 2rem" }} aria-labelledby="what-it-does">
        <Reveal className="section-header">
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
        </Reveal>

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
                    <Icon size={18} color="#1d4ed8" weight="duotone" />
                  </span>
                </div>

                <div className="feature-tile__visual">
                  {i === 0 ? (
                    <div style={{ display: "grid", gap: "0.55rem" }}>
                      {[
                        { name: "Monzo", label: "Verified", color: "#065F46", bg: "rgba(209,250,229,0.95)", fill: "#10B981", pct: 92 },
                        { name: "Deliveroo", label: "Likely", color: "#3730A3", bg: "rgba(224,231,255,0.95)", fill: "#1d4ed8", pct: 68 },
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
                          <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(29, 78, 216,0.12)" strokeWidth="8" />
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            fill="none"
                            stroke="#1d4ed8"
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

      <div className="section-divider" />

      <section className="section-orb" style={{ padding: "3rem 0" }} aria-labelledby="see-working">
        <Reveal className="section-header">
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
        </Reveal>

        <div className="demo-grid demo-grid--glass" style={{ marginTop: "1.75rem" }}>
          <Reveal className="reveal-delay-1">
          <article className="dash-card dash-card--texture">
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
            <div className="dash-card__rows">
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
          </Reveal>

          <Reveal className="reveal-delay-2">
          <article className="dash-card dash-card--texture">
            <div className="dash-card__head">
              <span className="dash-card-icon" aria-hidden>
                <MagnifyingGlass size={16} color="#1d4ed8" weight="duotone" />
              </span>
              <h3>Skills</h3>
              <span className="dash-card__menu" aria-hidden>· · ·</span>
            </div>
            <div className="dash-card__metrics dash-card__metrics--two">
              <div>
                <p className="dash-metric">71%</p>
                <p className="dash-label">SQL</p>
              </div>
              <div>
                <p className="dash-metric">23%</p>
                <p className="dash-label">Power BI</p>
              </div>
            </div>
            <div className="mini-bars mini-bars--tall mini-bars--glow" aria-hidden>
              {[40, 68, 32, 84, 52, 61, 45, 73].map((h, idx) => (
                <span key={idx} className="mini-bars__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </article>
          </Reveal>

          <Reveal className="reveal-delay-3">
          <article className="dash-card dash-card--texture">
            <div className="dash-card__head">
              <span className="dash-card-icon dash-card-icon--violet" aria-hidden>
                <ChartLineUp size={16} color="#1e3a8a" weight="duotone" />
              </span>
              <h3>Tenure</h3>
              <span className="dash-card__menu" aria-hidden>· · ·</span>
            </div>
            <div className="dash-card__rows">
              {insights.tenure_bands.map((b) => {
                const tone =
                  b.band === "Established"
                    ? "mint"
                    : b.band === "Moderate"
                      ? "indigo"
                      : "amber";
                return (
                  <div key={b.band} className={`dash-row dash-row--${tone}`}>
                    <div className="dash-row__band">
                      <span className={`dash-row__dot dash-row__dot--${tone}`} aria-hidden />
                      <span className="dash-row__band-label">{b.band}</span>
                    </div>
                    <strong className="dash-row__meta">{b.label}</strong>
                  </div>
                );
              })}
            </div>
          </article>
          </Reveal>
        </div>
      </section>

      <div className="section-divider" />

      <section id="how-it-works" className="section-orb" style={{ padding: "2rem 0 3.5rem" }} aria-labelledby="how-heading">
        <div className="how-steps-wrap">
          <Reveal className="how-steps-wrap__intro">
            <h2 id="how-heading" className="how-steps-wrap__title">
              How it works
            </h2>
            <p className="how-steps-wrap__body">
              From a job title to a sponsored shortlist.
            </p>
          </Reveal>

          <ol className="how-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} className={i > 0 ? `reveal-delay-${Math.min(i, 4)}` : ""}>
                <li className="how-step">
                  <div className="how-step__top">
                    <p className="how-step__num">{s.n}</p>
                    {i < STEPS.length - 1 ? (
                      <span className="how-step__arrow" aria-hidden />
                    ) : null}
                  </div>
                  <h3 className="how-step__label">{s.t}</h3>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <IntegrationsHub />

      <div className="section-divider" />

      <section id="solutions" className="section-glass-bg" aria-labelledby="solutions-heading">
        <div className="section-inner">
          <Reveal className="section-header">
            <h2
              id="solutions-heading"
              className="section-glass-bg__title"
            >
              Solutions
            </h2>
            <p className="section-glass-bg__body">
              Guides around the search.
            </p>
          </Reveal>
          <ul className="solutions-row">
            {SOLUTIONS.map((item, i) => (
              <Reveal key={item.href} className={i > 0 ? `reveal-delay-${Math.min(i, 4)}` : ""}>
                <li>
                  <Link href={item.href} className={`solution-tile solution-tile--${item.tone}`}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500, color: "var(--color-ink)" }}>
                      {item.title}
                    </h3>
                    <p style={{ margin: "0.7rem 0 0", fontSize: "0.875rem", lineHeight: 1.55, color: "var(--color-ink-soft)", flex: 1 }}>
                      {item.body}
                    </p>
                    <span style={{ marginTop: "1.15rem", fontSize: "0.8125rem", fontWeight: 500, color: "#1d4ed8" }}>
                      Open →
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-orb compare-section" style={{ padding: "0 0 4rem" }} aria-labelledby="difference">
        <Reveal className="section-header">
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
        </Reveal>
        <div className="compare-grid">
          <Reveal direction="left">
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
          </Reveal>
          <Reveal direction="right">
          <div className="compare-ours">
            <div className="compare-head">
              <span className="compare-badge compare-badge--brand">After</span>
              <p className="compare-title compare-title--brand">With Threshold</p>
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
          </Reveal>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "0 0 4rem" }} aria-labelledby="stories">
        <Reveal>
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
            color="rgba(29, 78, 216,0.14)"
            weight="duotone"
            aria-hidden
            style={{ position: "absolute", top: 12, right: 16 }}
          />
          <h2 id="stories" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500, maxWidth: "36ch", letterSpacing: "-0.02em" }}>
            Still early. If this helped you land something, tell us.
          </h2>
          <p style={{ margin: "0.9rem 0 0" }}>
            <a
              href="mailto:dakshkumar2k2@gmail.com?subject=My%20Threshold%20story"
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
        </Reveal>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "0 0 4rem" }} aria-labelledby="faq">
        <Reveal className="section-header">
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
          <p
            style={{
              margin: "0.65rem 0 0",
              maxWidth: "36ch",
              fontSize: "1rem",
              lineHeight: 1.5,
              color: "var(--color-ink-soft)",
            }}
          >
            Straight answers about how the matching works, what happens to
            your CV, and why this beats scrolling job boards alone.
          </p>
        </Reveal>
        <div style={{ marginTop: "1.35rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {FAQ_ITEMS.map((item, i) => {
            const open = faqOpen === i;
            return (
              <Reveal key={item.q} className={`reveal-delay-${Math.min(i % 4, 4)}`}>
              <div
                className={`demo-panel faq-item${open ? " demo-panel--open faq-item--open" : ""}`}
                style={{
                  padding: "0.35rem 1.15rem",
                  boxShadow: open ? "0 12px 32px rgba(29, 78, 216,0.1)" : "0 6px 20px rgba(29, 78, 216,0.05)",
                  transition: "box-shadow 0.2s ease",
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
                  <span
                    aria-hidden
                    style={{
                      color: "#1d4ed8",
                      display: "inline-block",
                      fontSize: "1.1rem",
                      transform: open ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    ›
                  </span>
                </button>
                <div className="faq-body">
                  <div>
                    <p
                      style={{
                        margin: "0 0 1rem",
                        maxWidth: "62ch",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "var(--color-ink-soft)",
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <footer className="full-bleed site-footer">
        <div className="footer-inner">
          <div className="footer-cta-row">
            <div className="footer-cta-copy">
              <h2>You&apos;ve read enough. Try a search.</h2>
              <p>No sign-up. It takes about 30 seconds. Your CV is not kept after your results.</p>
            </div>
            <div className="footer-cta-actions">
              <Link href="/search" className="cta-primary footer-cta-button">
                Search a role
              </Link>
              <Link href="/sign-up" className="footer-cta-secondary">
                Create a free account
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <div className="footer-nav-row">
            <div className="footer-brand">
              <p className="footer-brand__name">
                <Logo height={24} tone="light" />
                Threshold
              </p>
              <p className="footer-brand__tagline">
                For international students trying to find work in the UK.
              </p>
            </div>

            <nav className="footer-col" aria-label="Site">
              {FOOTER_LINKS.map(([href, label]) => (
                <Link key={label} href={href} className="footer-link">
                  {label}
                </Link>
              ))}
            </nav>

            <div className="footer-col">
              <p className="footer-col__title">Contact</p>
              <a href="mailto:dakshkumar2k2@gmail.com" className="footer-link">
                dakshkumar2k2@gmail.com
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>Built by an international student, for international students.</p>
            <p className="footer-bottom__links">
              <Link href="/terms" className="footer-link">
                Terms
              </Link>
              <Link href="/privacy" className="footer-link">
                Privacy
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
