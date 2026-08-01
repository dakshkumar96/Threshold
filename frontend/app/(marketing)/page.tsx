"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import insights from "@/data/insights.json";

const TICKS = [
  "Every job description analysed against your CV — so you know exactly what's missing, not what a template thinks",
  "Full roadmap to close the gap and get the job — the skills to learn first, the CV lines to rewrite, the roles to target",
  "Sponsor licence checked for every employer against 133,979 companies on the Home Office register — 59% name-match precision, measured and documented",
];

const FEATURES = [
  {
    t: "Not every company on a job board can sponsor a visa.",
    d: "You've had the conversation with HR. You've had the polite rejection after the offer. Sponsor Signal checks every employer in your search against the current Home Office sponsor register — 133,979 companies. If they can sponsor, we show you. If we verified the job on the company's own careers page, it gets a green badge. If we matched by name, we tell you the confidence level — because a name match is a guess, and we don't pretend otherwise.",
  },
  {
    t: "We read every job description so you don't have to guess what's missing.",
    d: "Every JD in your search gets scanned for skills, seniority signals, and language patterns. Then we hold that against your CV and tell you the exact gap — SQL appearing in 71% of these ads but not on your CV, or Power BI marked essential in 12 of 20 ads and missing from your skills section. You're not guessing what employers want anymore. You're seeing it, ad by ad.",
  },
  {
    t: "Knowing the gap doesn't help. Closing it does.",
    d: "After we find your gap, we build the roadmap. The skills to learn first, in the order that gives you the highest return. Weeks to learn each one. The CV lines that need rewriting. The roles you should be targeting given your current profile. The ones you should skip until you've closed the gap. It's not advice. It's a sequence. You know exactly what to do next.",
  },
  {
    t: "A recruiter reads your CV in 7 seconds. This tells you what they see.",
    d: "You get a score out of 100 across five categories a real recruiter uses — whether it survives the seven-second scan, whether the impact is real or hand-wavey, whether it sounds like you or like ChatGPT wrote it, whether the skills match what employers are asking for, whether it stands out. Then a full CV guide grounded in your specific search — the one line to fix first, the summary rewritten as an example, the sections that are working, the sections that aren't. Not twenty changes. The specific ones that move the needle.",
  },
];

const TABS = [
  {
    id: "jd",
    label: "Every JD analysed",
    title:
      "Before you apply, you know exactly what each employer wants — and what's missing from your CV.",
    body: "Every job description in your search is scanned. Every skill mentioned is counted. Every employer is checked against the sponsor register with a confidence tier. Salary is compared against the £38,700 Skilled Worker threshold. You see the full picture per job — not just a list of results.",
  },
  {
    id: "roadmap",
    label: "Full roadmap",
    title: "You learn what to do next, not just what's wrong.",
    body: "Skill gaps are ranked by priority — how often they appear in your search divided by how long they take to learn. So Excel ranks above Kubernetes even if both are mentioned equally. You get weeks to learn each one, in the order that gets you interview-ready fastest.",
  },
  {
    id: "cv",
    label: "CV guide",
    title: "The CV guide isn't generic. It's built from the exact ads in your search.",
    body: 'The feedback is grounded in the real skill frequencies from your specific role search. When it says "your CV is missing SQL, which appears in 71% of these ads" — that number is from this search. When it says the impact language is weak, it points at a specific line. When it says the summary sounds generic, it rewrites it.',
  },
] as const;

const STEPS = [
  {
    n: "01",
    t: "You type a role.",
    d: "Any UK job title. Data Analyst. Marketing Manager. Software Engineer. We pull up to 200 live ads from Reed and Adzuna.",
  },
  {
    n: "02",
    t: "We check every sponsor licence.",
    d: "Every employer in those ads gets cross-referenced against 133,979 licensed UK sponsors. Verified via the company's own careers page, or name-matched with a confidence score. You see which is which.",
  },
  {
    n: "03",
    t: "We analyse every job description.",
    d: "Every JD is scanned. Every skill is counted. Every salary is checked against the visa threshold. The result is a picture of what the market for this specific role is actually asking for — right now, not last year.",
  },
  {
    n: "04",
    t: "You get the roadmap.",
    d: "Upload your CV and you get a match score, prioritised skill gaps with weeks-to-learn estimates, a full CV guide with the one thing to fix first, and a shortlist of the sponsored jobs you should apply to. Without a CV you still see the sponsors and the market picture — the CV unlocks the personal roadmap.",
  },
];

const FAQ_ITEMS = [
  {
    q: "How do you check if a company has a sponsor licence?",
    a: "We cross-reference every employer against the current Home Office sponsor register — the same list the government publishes. If they're on it, they hold a licence. If we verified the job on the company's own careers page, we mark it Verified. If we name-matched them to the register, we give you a confidence score.",
  },
  {
    q: "What does it mean when you say you analyse every job description?",
    a: "Every JD in your search gets read by our system. We pull out skills mentioned, count how often each appears across the batch, flag which are marked essential vs desirable, and check the salary against the visa threshold. Then we compare all of that against your CV if you upload one.",
  },
  {
    q: "What's in the roadmap?",
    a: "Prioritised skill gaps — the top skills to learn ranked by how often they appear in your search divided by how long they take to learn. Weeks to learn each one. The CV sections that need rewriting with examples. The roles you should be targeting now vs the ones to skip until you've closed the gap.",
  },
  {
    q: "How is the CV guide different from ChatGPT feedback?",
    a: "ChatGPT gives you generic advice. Our CV guide is grounded in the specific skill frequencies from your specific role search. When it says a skill is missing, it's a skill that actually appears in the ads you just searched — not a guess. When it rewrites your summary, it uses language that matches what employers in your search are writing.",
  },
  {
    q: "What happens to my CV after I upload it?",
    a: "Read in-memory, sent to the LLM for the recruiter assessment, then gone. Not stored, not trained on, not shared.",
  },
  {
    q: "Is this the current register or old data?",
    a: "Current, updated 28 July 2026. Refreshed monthly. We also keep 10 historical snapshots since September 2023 — that's what the licence stability feature is built on.",
  },
  {
    q: "Why does salary matter?",
    a: "The Skilled Worker visa has a minimum salary of £38,700, or the going rate for the role — whichever is higher. If a job pays below that, sponsorship isn't legally possible even if the company holds a licence. That's why we check every ad.",
  },
  {
    q: "Do I have to upload my CV to use this?",
    a: "No. Without a CV you see the sponsored jobs, the market skill picture, and the licence stability data. Uploading a CV unlocks the personal gap analysis, the roadmap, and the CV guide.",
  },
];

const NOW_HUNT = [
  "You find a job on Reed or LinkedIn",
  "You guess whether the company can sponsor",
  "You guess whether your CV matches what they want",
  "You spend an hour on the application",
  "You get to interview or offer",
  "HR asks about your visa",
  "You never hear back",
  "You start again",
];

const WITH_US = [
  "You search a role once",
  "Every job description gets analysed",
  "Every employer's sponsor licence gets checked",
  "Your CV gets scored against the actual market data",
  "You get a roadmap — skills to learn, CV lines to rewrite, roles to target",
  "You apply to the sponsored jobs that fit your profile",
];

const SOLUTIONS = [
  {
    href: "/solutions/immigration-guide",
    title: "Immigration guide",
    body: "Skilled Worker and Graduate routes in plain English, with links to GOV.UK — not a solicitor, just the map.",
  },
  {
    href: "/solutions/job-hunt-guide",
    title: "Job hunt guide",
    body: "A calm sequence for searching and applying when the clock on your visa is already running.",
  },
  {
    href: "/solutions/sponsorship-checker",
    title: "Sponsorship checker",
    body: "Look up a company name against the sponsor register before you invest an hour in the application.",
  },
  {
    href: "/solutions/cv-guide",
    title: "CV guide",
    body: "How to write for sponsor-market ads, then score your CV against live demand for your role.",
  },
];

export default function LandingPage() {
  const [role, setRole] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("jd");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const sponsors = insights.headline.sponsors_tracked;
  const snapshots = insights.headline.snapshots;
  const searchHref = role.trim()
    ? `/search?role=${encodeURIComponent(role.trim())}`
    : "/search";

  function onSearch(e: FormEvent) {
    e.preventDefault();
    window.location.href = searchHref;
  }

  return (
    <main className="pb-0">
      <section className="hero-split">
        <div>
          <p
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              margin: "0 0 1.25rem",
              background: "var(--color-gold-pale)",
              border: "1px solid rgba(245,166,35,0.25)",
              borderRadius: 999,
              padding: "0.35rem 0.9rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--color-gold-dark)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-gold)",
              }}
            />
            Register data updated 28 July 2026 · {sponsors.toLocaleString()} sponsors
            checked
          </p>

          <h1
            className="motion-enter"
            style={{
              margin: 0,
              maxWidth: "16ch",
              fontSize: "clamp(2rem, 4.5vw, 3.15rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--color-ink)",
            }}
          >
            You&apos;ve been applying to jobs that can&apos;t sponsor you.
          </h1>

          <p
            style={{
              margin: "1.25rem 0 0",
              maxWidth: "42ch",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              color: "var(--color-ink-soft)",
            }}
          >
            Type a role. We analyse every job description, tell you exactly what
            you&apos;re falling behind on, check whether each employer can actually
            sponsor a Skilled Worker visa, and give you a full roadmap to get the
            job — including how to fix your CV.
          </p>

          <ul
            style={{
              listStyle: "none",
              margin: "1.5rem 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              maxWidth: "48ch",
            }}
          >
            {TICKS.map((line) => (
              <li
                key={line}
                style={{
                  display: "flex",
                  gap: "0.65rem",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  color: "var(--color-ink-soft)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    marginTop: 5,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-gold)",
                    flexShrink: 0,
                  }}
                />
                {line}
              </li>
            ))}
          </ul>

          <form
            onSubmit={onSearch}
            style={{
              marginTop: "1.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              maxWidth: 520,
            }}
          >
            <label className="sr-only" htmlFor="landing-role">
              Role
            </label>
            <input
              id="landing-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. data analyst, software engineer"
              style={{
                flex: "1 1 200px",
                minHeight: 48,
                borderRadius: "var(--radius-control)",
                border: "1px solid var(--color-line-hover)",
                background: "var(--color-paper)",
                padding: "0 1rem",
                fontSize: "1rem",
                color: "var(--color-ink)",
              }}
            />
            <button
              type="submit"
              className="cta-primary"
              style={{
                minHeight: 48,
                padding: "0 1.25rem",
                border: 0,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Search without signing up
            </button>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 48,
                padding: "0 0.5rem",
                fontWeight: 500,
                color: "var(--color-ink-soft)",
                textDecoration: "none",
              }}
            >
              See how it works
            </a>
          </form>
        </div>

        <div aria-hidden className="surface-card" style={{ padding: "1.25rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
            }}
          >
            Example roadmap (static mock)
          </p>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "2rem",
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            72%
            <span style={{ fontSize: "1rem", color: "var(--color-muted)" }}>
              {" "}
              match
            </span>
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--color-ink-soft)" }}>
            Data Analyst · mid-level UK ads
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: "1.1rem 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
            }}
          >
            <li
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: 8,
                border: "1px solid rgba(29,184,116,0.25)",
                background: "var(--color-signal-tint)",
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--color-signal)" }}>
                Verified sponsor
              </span>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem", fontWeight: 500 }}>
                Data Analyst, Lending
              </p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                Monzo Bank · Established
              </p>
            </li>
            <li
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: 8,
                border: "1px solid var(--color-line)",
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--color-gold-dark)" }}>
                Priority gap
              </span>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem", fontWeight: 500 }}>
                SQL · 71% of ads · ~3 weeks
              </p>
            </li>
            <li style={{ borderTop: "1px solid var(--color-line)", paddingTop: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 500, color: "var(--color-muted)" }}>
                One thing to fix first
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)" }}>
                Rewrite the summary so a recruiter sees SQL and dbt in seven seconds.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <div className="marquee-wrap full-bleed" style={{ borderTop: "1px solid var(--color-line)", borderBottom: "1px solid var(--color-line)", padding: "0.85rem 0", background: "var(--color-elevated)" }}>
        <div className="marquee-track" style={{ display: "flex", gap: "3rem", whiteSpace: "nowrap", fontSize: "0.85rem", color: "var(--color-muted)" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>Built for international students.</span>
          ))}
        </div>
      </div>

      <section style={{ padding: "4.5rem 0 2rem" }} aria-labelledby="what-it-does">
        <h2
          id="what-it-does"
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          What Sponsor Signal actually does
        </h2>
        <div
          style={{
            marginTop: "1.75rem",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {FEATURES.map((f) => (
            <article key={f.t} className="surface-card" style={{ padding: "1.25rem 1.35rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.35 }}>
                {f.t}
              </h3>
              <p style={{ margin: "0.85rem 0 0", fontSize: "0.9rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                {f.d}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ padding: "3.5rem 0" }} aria-labelledby="see-working">
        <h2
          id="see-working"
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          See it working
        </h2>
        <div
          role="tablist"
          aria-label="Product overview"
          style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              style={{
                minHeight: 40,
                padding: "0 0.95rem",
                borderRadius: 999,
                border: tab === t.id ? "1px solid var(--color-gold-dark)" : "1px solid var(--color-line)",
                background: tab === t.id ? "var(--color-gold-pale)" : "var(--color-paper)",
                color: tab === t.id ? "var(--color-gold-dark)" : "var(--color-ink-soft)",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="surface-card" style={{ marginTop: "1rem", padding: "1.35rem 1.5rem" }} role="tabpanel">
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500, maxWidth: "40ch" }}>
            {activeTab.title}
          </h3>
          <p style={{ margin: "0.85rem 0 0", maxWidth: "62ch", fontSize: "0.95rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
            {activeTab.body}
          </p>
        </div>
      </section>

      <section id="solutions" style={{ padding: "3.5rem 0" }} aria-labelledby="solutions-heading">
        <h2
          id="solutions-heading"
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          Solutions
        </h2>
        <p
          style={{
            margin: "0.75rem 0 0",
            maxWidth: "48ch",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "var(--color-ink-soft)",
          }}
        >
          Guides and tools for the bits around the search — visa context, how to hunt,
          checking a company, and writing a CV that matches what sponsors ask for.
        </p>
        <ul
          style={{
            listStyle: "none",
            margin: "1.75rem 0 0",
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {SOLUTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="surface-card"
                style={{
                  display: "block",
                  height: "100%",
                  padding: "1.25rem 1.35rem",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500, color: "var(--color-ink)" }}>
                  {item.title}
                </h3>
                <p
                  style={{
                    margin: "0.65rem 0 0",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "var(--color-ink-soft)",
                  }}
                >
                  {item.body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <p style={{ margin: "1.25rem 0 0" }}>
          <Link href="/solutions" className="text-link" style={{ fontWeight: 500 }}>
            All solutions
          </Link>
        </p>
      </section>

      <section id="how-it-works" style={{ padding: "3.5rem 0" }} aria-labelledby="how-heading">
        <h2
          id="how-heading"
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          How it works, actually
        </h2>
        <ol
          style={{
            listStyle: "none",
            margin: "1.75rem 0 0",
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {STEPS.map((s) => (
            <li key={s.n} className="surface-card" style={{ padding: "1.2rem 1.25rem" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, color: "var(--color-gold-dark)" }}>
                {s.n}
              </p>
              <h3 style={{ margin: "0.45rem 0 0", fontSize: "1rem", fontWeight: 500 }}>{s.t}</h3>
              <p style={{ margin: "0.55rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ padding: "2rem 0 4rem" }} aria-labelledby="numbers">
        <h2
          id="numbers"
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          The numbers behind this
        </h2>
        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {[
            { n: sponsors.toLocaleString(), l: "Sponsor licences checked per search" },
            { n: String(snapshots), l: "Snapshots of the register since September 2023" },
            { n: "200", l: "Live job descriptions analysed per search" },
            { n: "59%", l: "Name-match precision, tested on 100 samples" },
          ].map((s) => (
            <div key={s.l} className="stat-card">
              <p style={{ margin: 0, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 500, color: "var(--color-gold)", letterSpacing: "-0.03em" }}>
                {s.n}
              </p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.4 }}>
                {s.l}
              </p>
            </div>
          ))}
        </div>
        <p style={{ margin: "1rem 0 0", fontSize: "0.85rem", color: "var(--color-muted)" }}>
          Every number here is documented.{" "}
          <Link href="/methodology" className="text-link">
            Read the methodology
          </Link>
          .
        </p>
      </section>

      <section style={{ padding: "0 0 4rem" }} aria-labelledby="difference">
        <h2
          id="difference"
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          The difference
        </h2>
        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <div className="surface-card" style={{ padding: "1.35rem" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              How you&apos;re job hunting now
            </p>
            <ul style={{ listStyle: "none", margin: "1rem 0 0", padding: 0 }}>
              {NOW_HUNT.map((line) => (
                <li
                  key={line}
                  style={{
                    padding: "0.45rem 0",
                    borderTop: "1px solid var(--color-line)",
                    fontSize: "0.9rem",
                    color: "var(--color-muted)",
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="surface-card"
            style={{
              padding: "1.35rem",
              borderTop: "3px solid var(--color-gold)",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-gold-dark)" }}>
              How this changes it
            </p>
            <ul style={{ listStyle: "none", margin: "1rem 0 0", padding: 0 }}>
              {WITH_US.map((line) => (
                <li
                  key={line}
                  style={{
                    padding: "0.45rem 0",
                    borderTop: "1px solid var(--color-line)",
                    fontSize: "0.9rem",
                    color: "var(--color-ink-soft)",
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 4rem" }} aria-labelledby="stories">
        <div className="surface-card" style={{ padding: "1.5rem" }}>
          <h2 id="stories" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 500 }}>
            We&apos;re still early. If Sponsor Signal helped you land something, we&apos;d love to hear about it.
          </h2>
          <p style={{ margin: "0.75rem 0 0" }}>
            <a
              href="mailto:hello@sponsorsignal.com?subject=My%20Sponsor%20Signal%20story"
              className="text-link"
              style={{ fontWeight: 500 }}
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
            fontSize: "clamp(1.45rem, 2.8vw, 1.9rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          Things people actually ask
        </h2>
        <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {FAQ_ITEMS.map((item, i) => {
            const open = faqOpen === i;
            return (
              <div key={item.q} className="surface-card" style={{ padding: "0.25rem 1rem" }}>
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
                  <span aria-hidden style={{ color: "var(--color-muted)" }}>
                    {open ? "▴" : "▾"}
                  </span>
                </button>
                {open ? (
                  <p style={{ margin: "0 0 1rem", maxWidth: "65ch", fontSize: "0.9rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="full-bleed"
        style={{
          background: "var(--color-elevated)",
          borderTop: "1px solid var(--color-line)",
          padding: "3.5rem clamp(1rem, 4vw, 2.5rem)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 500, letterSpacing: "-0.02em" }}>
            You&apos;ve read enough. Try a search.
          </h2>
          <p style={{ margin: "0.75rem 0 0", color: "var(--color-ink-soft)" }}>
            No sign-up. Takes 30 seconds. Your CV isn&apos;t stored.
          </p>
          <Link
            href="/search"
            className="cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 48,
              marginTop: "1.35rem",
              padding: "0 1.5rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Search a role
          </Link>
        </div>
      </section>

      <footer
        className="full-bleed"
        style={{
          background: "#0F1117",
          padding: "3rem clamp(1rem, 4vw, 2.5rem) 2rem",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gap: "2rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-gold)" }} aria-hidden />
              <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#C8CCDB" }}>Sponsor Signal</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(200,204,219,0.65)", lineHeight: 1.55 }}>
              For international students trying to find work in the UK.
            </p>
          </div>
          <div>
            {[
              ["/search", "Search"],
              ["/solutions", "Solutions"],
              ["/insights", "Insights"],
              ["/about", "About"],
              ["/methodology", "Methodology"],
              ["/methodology#privacy", "Privacy"],
              ["mailto:hello@sponsorsignal.com", "Contact"],
            ].map(([href, label]) => (
              <Link
                key={label}
                href={href}
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.875rem",
                  color: "#C8CCDB",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <p
          style={{
            maxWidth: 1120,
            margin: "2rem auto 0",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.8rem",
            color: "rgba(200,204,219,0.45)",
          }}
        >
          Built by an international student, for international students.
        </p>
      </footer>
    </main>
  );
}
