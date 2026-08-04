"use client";

import { useEffect, useMemo, useState } from "react";
import insights from "@/data/insights.json";
import { useUserApi, type LastMatch } from "@/lib/user-api";

/* ─── Types ──────────────────────────────────────────────────────────────────*/
type TrafficLight = "green" | "amber" | "red";
type ChangelogFilter = "all" | TrafficLight;

/* ─── Static data ────────────────────────────────────────────────────────────*/
const CHANGELOG: {
  date: string; text: string; light: TrafficLight; sourceLabel: string; sourceUrl: string;
}[] = [
  { date: "January 1 2027 (upcoming)", text: "Graduate Route shortens to 18 months for bachelor's and master's graduates. Apply before this date to keep 2 years.", light: "red", sourceLabel: "freeths.co.uk", sourceUrl: "https://freeths.co.uk" },
  { date: "August 3 2026", text: "Graduate Route dependants update. Children born in UK to Graduate visa holders can now apply as dependants.", light: "amber", sourceLabel: "ukcisa.org.uk", sourceUrl: "https://ukcisa.org.uk" },
  { date: "July 2026", text: "Global Talent visa adds dedicated design industry pathway.", light: "amber", sourceLabel: "commonslibrary.parliament.uk", sourceUrl: "https://commonslibrary.parliament.uk" },
  { date: "April 2026", text: "Salary threshold rose to £41,700 (up from £38,700). ISC rose 32%. New pay-per-period rule: must clear threshold every pay period, not just annually.", light: "red", sourceLabel: "relocly.co.uk", sourceUrl: "https://relocly.co.uk" },
  { date: "January 8 2026", text: "English language requirement raised from B1 to B2 for new Skilled Worker applicants.", light: "red", sourceLabel: "immigrationbarrister.co.uk", sourceUrl: "https://immigrationbarrister.co.uk" },
  { date: "Q4 2025", text: "1,500+ sponsor licences revoked in a single quarter. The highest ever recorded.", light: "red", sourceLabel: "assessnow.co.uk", sourceUrl: "https://assessnow.co.uk" },
];

const ROLE_TABLE = [
  { role: "Data Analyst",       soc: "2433", going: 34000, wins: "general" },
  { role: "Software Developer", soc: "2134", going: 46000, wins: "going"   },
  { role: "Marketing Manager",  soc: "1132", going: 44000, wins: "going"   },
  { role: "Financial Analyst",  soc: "2422", going: 45000, wins: "going"   },
  { role: "Civil Engineer",     soc: "2121", going: 39000, wins: "general" },
  { role: "Product Manager",    soc: "2431", going: 48000, wins: "going"   },
  { role: "UX Designer",        soc: "2159", going: 38000, wins: "general" },
  { role: "Data Scientist",     soc: "2433", going: 46000, wins: "going"   },
  { role: "HR Manager",         soc: "1135", going: 43000, wins: "going"   },
  { role: "Accountant",         soc: "2421", going: 40000, wins: "general" },
];

const SECTORS = [
  { name: "Technology / Software", density: 92, salary: "£45k–£80k", sponsors: "8,000+", color: "#4f6ef7", risk: "low" },
  { name: "AI / Machine Learning",  density: 88, salary: "£60k–£100k+", sponsors: "3,200+", color: "#7c3aed", risk: "low" },
  { name: "Finance / Banking",      density: 82, salary: "£45k–£85k", sponsors: "4,500+", color: "#6366f1", risk: "low" },
  { name: "Consulting / Big Four",  density: 78, salary: "£45k–£65k", sponsors: "2,100+", color: "#0ea5e9", risk: "low" },
  { name: "Engineering",            density: 64, salary: "£40k–£70k", sponsors: "5,600+", color: "#10b981", risk: "low" },
  { name: "Retail / Hospitality",   density: 22, salary: "£22k–£35k", sponsors: "Active", color: "#ef4444", risk: "high" },
];

const LIGHT_META: Record<TrafficLight, { dot: string; label: string }> = {
  green: { dot: "#10b981", label: "Good news" },
  amber: { dot: "#f59e0b", label: "Watch" },
  red:   { dot: "#ef4444", label: "Bad for students" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────────*/
const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

/* ─── Design primitives ──────────────────────────────────────────────────────*/
function HiddenFact({
  children,
  sourceLabel,
  sourceUrl,
}: {
  children: React.ReactNode;
  sourceLabel?: string;
  sourceUrl?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(30,27,75,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: "var(--radius-card)",
        borderLeft: "3px solid #4f6ef7",
        padding: "1.125rem 1.25rem",
      }}
    >
      <p
        style={{
          margin: "0 0 0.5rem",
          fontSize: "0.625rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#FFCA6B",
        }}
      >
        Most students don&apos;t know this
      </p>
      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "#fff", lineHeight: 1.65 }}>
        {children}
      </p>
      {sourceLabel && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginTop: "0.625rem",
            fontSize: "0.6875rem",
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
          }}
        >
          Source: {sourceLabel} ↗
        </a>
      )}
    </div>
  );
}

function SourceChip({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.6rem",
        borderRadius: 999,
        background: "var(--color-line-hover)",
        color: "var(--color-muted)",
        fontSize: "0.6875rem",
        textDecoration: "none",
        marginTop: "0.5rem",
      }}
    >
      {label} ↗
    </a>
  );
}

function SectionNum({ n }: { n: string }) {
  return (
    <p
      style={{
        margin: "0 0 0.375rem",
        fontSize: "0.6875rem",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "var(--color-gold-dark)",
      }}
    >
      {n}
    </p>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ margin: 0, fontSize: "clamp(1.1rem,2vw,1.375rem)", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)", lineHeight: 1.2 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-soft)", maxWidth: "60ch" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ColHeader({ text, gradient }: { text: string; gradient: string }) {
  return (
    <div
      style={{
        background: gradient,
        borderRadius: "10px 10px 0 0",
        padding: "0.75rem 1.25rem",
        marginBottom: 0,
      }}
    >
      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "#fff" }}>{text}</p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────*/
export default function InsightsPage() {
  const api = useUserApi();
  const [lastMatch, setLastMatch] = useState<LastMatch | null>(null);
  const [under26, setUnder26] = useState(false);
  const [recentGrad, setRecentGrad] = useState(false);
  const [studentSwitch, setStudentSwitch] = useState(false);
  const [clFilter, setClFilter] = useState<ChangelogFilter>("all");

  useEffect(() => {
    void api.getLastMatch().then(setLastMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newEntrant = under26 || recentGrad || studentSwitch;
  const threshold = newEntrant ? 33400 : 41700;

  const filteredLog = useMemo(
    () => (clFilter === "all" ? CHANGELOG : CHANGELOG.filter((c) => c.light === clFilter)),
    [clFilter],
  );

  const topSkills = lastMatch?.requirement_frequencies?.slice(0, 3) ?? [];

  return (
    <main style={{ paddingBottom: "6rem" }}>

      {/* ── Page header ───────────────────────────────────────────────────────*/}
      <div style={{ paddingBottom: "1.75rem", borderBottom: "1px solid var(--color-line)", marginBottom: "2.5rem" }}>
        <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--color-muted)" }}>
          Market Intelligence
        </p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", lineHeight: 1.15 }}>
          What an immigration lawyer knows that you don&apos;t
        </h1>
        <p style={{ margin: "0.75rem 0 0", maxWidth: "60ch", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
          Ten sections. Every fact sourced. The numbers no one told you. About what your employer actually pays, why licences get revoked, and what the salary threshold really means.
        </p>
      </div>

      {/* ── Headline tiles ─────────────────────────────────────────────────────*/}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.75rem", marginBottom: "3rem" }} className="sm:grid-cols-4">
        {([
          { n: insights.headline.sponsors_tracked.toLocaleString("en-GB"), l: "licensed sponsors on the register", accent: true },
          { n: insights.headline.still_active.toLocaleString("en-GB"), l: "still active at latest snapshot" },
          { n: "3,100+", l: "licences revoked in 2025. The highest ever" },
          { n: "£41,700", l: "salary threshold from April 2026" },
        ] as { n: string; l: string; accent?: boolean }[]).map((s) => (
          <div key={s.l} className="surface-card" style={{ padding: "1.25rem" }}>
            <p style={{ margin: 0, fontSize: "clamp(1.35rem,2.2vw,1.75rem)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, color: s.accent ? "var(--color-gold)" : "var(--color-ink)", fontVariantNumeric: "tabular-nums" }}>
              {s.n}
            </p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", lineHeight: 1.4, color: "var(--color-muted)" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* ══ S1: Visa clock ═══════════════════════════════════════════════════*/}
      <section aria-labelledby="s1" style={{ marginBottom: "3rem", paddingTop: "0.5rem" }}>
        <SectionNum n="01" />
        <SectionHead
          title="Your visa clock"
          subtitle="How much time you actually have. And one date that changes everything."
        />
        <div className="surface-card" style={{ padding: "1.75rem" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left: timeline bars */}
            <div>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>Months available on Graduate Route</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  { label: "Graduate Route (applied before Jan 2027)", months: 24, max: 36, color: "#10b981", badge: "24 months", badgeStyle: { background: "#ecfdf5", color: "#065f46" } },
                  { label: "Graduate Route (applied from Jan 2027)", months: 18, max: 36, color: "#f59e0b", badge: "18 months. shortened", badgeStyle: { background: "#fffbeb", color: "#92400e" }, warn: true },
                  { label: "PhD Graduate Route", months: 36, max: 36, color: "#4f6ef7", badge: "36 months", badgeStyle: { background: "#eef2ff", color: "#2338c7" } },
                ].map((r) => (
                  <div key={r.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-ink)", lineHeight: 1.4, flex: 1 }}>{r.label}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.6875rem", fontWeight: 500, flexShrink: 0, ...r.badgeStyle }}>
                        {r.warn && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                            <path d="M5 1L9.5 9H0.5L5 1Z" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round"/>
                            <path d="M5 4v2M5 7.5v.3" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round"/>
                          </svg>
                        )}
                        {r.badge}
                      </span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: "var(--color-line-hover)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 999, background: r.color, width: `${(r.months / r.max) * 100}%` }} />
                      {r.warn && (
                        <div style={{ position: "absolute", left: `${(r.months / r.max) * 100}%`, top: 0, bottom: 0, right: 0, borderRadius: "0 999px 999px 0", backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(245,158,11,0.2) 4px,rgba(245,158,11,0.2) 6px)", border: "1px dashed #f59e0b", borderLeft: "none" }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: "1.25rem 0 0", fontSize: "0.6875rem", color: "var(--color-muted)" }}>Source: Home Office Statement of Changes · UKCISA · House of Commons Library</p>
            </div>

            {/* Right: insight cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <HiddenFact sourceLabel="UKCISA, October 2025" sourceUrl="https://ukcisa.org.uk">
                Applying before 31 December 2026 locks in your 2-year Graduate Route. Even if you graduate in 2027.
              </HiddenFact>
              <div className="surface-card" style={{ padding: "1rem 1.25rem" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                  PhD graduates are unaffected by the shortening. They keep their 3-year allowance regardless of when they apply.
                </p>
                <SourceChip label="House of Commons Library" url="https://commonslibrary.parliament.uk/research-briefings/cbp-10267" />
              </div>
              <HiddenFact sourceLabel="academicjobs.com / HESA Graduate Outcomes" sourceUrl="https://academicjobs.com">
                Only 4% of 2023 international students had transitioned to a Skilled Worker visa by end of 2024. The Graduate Route is a temporary right to work, not a path to settlement.
              </HiddenFact>
            </div>
          </div>
        </div>
      </section>

      {/* ══ S2: What sponsoring costs your employer ═══════════════════════════*/}
      <section aria-labelledby="s2" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="02" />
        <SectionHead
          title="What sponsoring you actually costs your employer"
          subtitle="This is why many SMEs say no even when they want to hire you. Show your employer you already understand."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Left: employer cost */}
          <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--color-line)" }}>
            <ColHeader text="What your employer pays to hire you" gradient="linear-gradient(135deg,#4f6ef7,#2338c7)" />
            <div style={{ background: "var(--color-paper)", padding: "1.25rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-line)" }}>
                    {["Fee", "Small employer", "Large employer"].map((h) => (
                      <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 500, color: "var(--color-muted)", fontSize: "0.75rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Sponsor licence (one-off)", "£611", "£1,682"],
                    ["Certificate of Sponsorship", "£525", "£525"],
                    ["Immigration Skills Charge /yr", "£480/yr", "£1,320/yr"],
                    ["Total for a 3-year hire", "~£2,576", "~£6,567"],
                  ].map(([fee, small, large], i) => (
                    <tr key={fee} style={{ borderBottom: "1px solid var(--color-line)", background: i % 2 === 0 ? "transparent" : "rgba(79,110,247,0.04)" }}>
                      <td style={{ padding: "0.625rem 0.75rem", color: i === 3 ? "var(--color-ink)" : "var(--color-ink-soft)", fontWeight: i === 3 ? 500 : 400 }}>{fee}</td>
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", fontWeight: i === 3 ? 500 : 400 }}>{small}</td>
                      <td style={{ padding: "0.625rem 0.75rem", color: i === 3 ? "var(--color-gold)" : "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", fontWeight: i === 3 ? 500 : 400 }}>{large}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ margin: "1rem 0 0", padding: "1rem", background: "rgba(79,110,247,0.06)", borderRadius: 10, border: "1px solid rgba(79,110,247,0.15)" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)", lineHeight: 1.6 }}>
                  A large employer sponsoring you for 3 years pays approximately <span style={{ color: "var(--color-gold)" }}>£6,500 in fees alone</span> before your salary. This is why many SMEs say no even when they want to hire you.
                </p>
              </div>
              <SourceChip label="getborderless.co.uk · ISC rose 32% on 16 Dec 2025" url="https://getborderless.co.uk" />
            </div>
          </div>

          {/* Right: employee cost */}
          <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--color-line)" }}>
            <ColHeader text="What you pay" gradient="linear-gradient(135deg,#7c3aed,#4f46e5)" />
            <div style={{ background: "var(--color-paper)", padding: "1.25rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-line)" }}>
                    {["Fee", "Amount"].map((h) => (
                      <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 500, color: "var(--color-muted)", fontSize: "0.75rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Visa application fee (3yr+ in-country)", "£1,872"],
                    ["Immigration Health Surcharge", "£1,035/year"],
                    ["Total for 3 years", "~£5,000"],
                  ].map(([fee, amount], i) => (
                    <tr key={fee} style={{ borderBottom: "1px solid var(--color-line)", background: i % 2 === 0 ? "transparent" : "rgba(124,58,237,0.04)" }}>
                      <td style={{ padding: "0.625rem 0.75rem", color: i === 2 ? "var(--color-ink)" : "var(--color-ink-soft)", fontWeight: i === 2 ? 500 : 400 }}>{fee}</td>
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums", fontWeight: i === 2 ? 500 : 400 }}>{amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <HiddenFact sourceLabel="recruitroo.com" sourceUrl="https://recruitroo.com">
                  The employer cannot legally recover the Certificate of Sponsorship fee or Immigration Skills Charge from you. Since December 2024, UKVI explicitly bans salary kickbacks and fee recovery from sponsored employees.
                </HiddenFact>
                <HiddenFact>
                  If a company asks you to contribute to the cost of your own sponsorship, that is a red flag and potentially illegal. Report it to the Home Office Sponsor Management System.
                </HiddenFact>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ S3: Three salary tests ════════════════════════════════════════════*/}
      <section aria-labelledby="s3" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="03" />
        <SectionHead
          title="The three salary tests (most students only know one)"
          subtitle="Your salary must clear all three simultaneously. The Home Office takes the highest as your effective threshold."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: "1rem" }}>
          {[
            {
              label: "Test 1", title: "General minimum", val: "£41,700", valNew: "£33,400", color: "#4f6ef7", bg: "#eef2ff",
              body: "£41,700 per year for most new applicants from April 2026. Or £33,400 if you qualify as a new entrant. graduated within 2 years, under 26, or switching from a Student visa.",
            },
            {
              label: "Test 2", title: "SOC going rate", val: "Varies", color: "#7c3aed", bg: "#f5f3ff",
              body: "Your occupation's specific going rate from Appendix Skilled Occupations. Software Developer: ~£46,000. Data Analyst: ~£34,000. Marketing Manager: ~£44,000.",
            },
            {
              label: "Test 3", title: "Hourly floor", val: "£15.88/hr", color: "#0ea5e9", bg: "#f0f9ff",
              body: "£15.88 per hour minimum regardless of contract type. This applies even if your annual salary clears the other two tests.",
            },
          ].map((t) => (
            <div key={t.label} style={{ border: `1px solid ${t.color}30`, borderRadius: "var(--radius-card)", overflow: "hidden" }}>
              <div style={{ background: t.bg, borderBottom: `1px solid ${t.color}20`, padding: "0.875rem 1.25rem" }}>
                <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: t.color }}>{t.label}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>{t.title}</p>
              </div>
              <div style={{ padding: "1.25rem", background: "var(--color-paper)" }}>
                <p style={{ margin: "0 0 0.875rem", fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 500, color: t.color, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{t.val}</p>
                <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>{t.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hidden fact spanning full width */}
        <HiddenFact sourceLabel="ukvisainfo.co.uk" sourceUrl="https://ukvisainfo.co.uk/blog/uk-skilled-worker-visa-salary-threshold-2026">
          A job paying £42,000 can still fail the visa threshold if the SOC going rate for that role is £46,000. The going rate overrides the general minimum when it is higher. Most students only check the £41,700 figure.
        </HiddenFact>

        {/* New entrant calculator */}
        <div
          style={{
            marginTop: "1.25rem",
            background: newEntrant ? "rgba(236,253,245,0.9)" : "rgba(238,242,255,0.6)",
            border: `1px solid ${newEntrant ? "rgba(16,185,129,0.3)" : "var(--color-line)"}`,
            borderRadius: "var(--radius-card)",
            padding: "1.5rem",
            transition: "background 200ms, border-color 200ms",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>New entrant rate checker</h3>
              <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)", maxWidth: "48ch", lineHeight: 1.5 }}>
                If you qualify, your threshold drops to <strong style={{ fontWeight: 500 }}>£33,400</strong>. Saving £8,300 per year on the general minimum.
              </p>
            </div>
            <div style={{ background: newEntrant ? "#10b981" : "var(--color-gold)", borderRadius: 12, padding: "0.875rem 1.375rem", textAlign: "center", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "1.625rem", fontWeight: 500, color: "#fff", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(threshold)}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.8)" }}>your effective threshold</p>
            </div>
          </div>
          <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
            <legend style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.75rem" }}>Do any of these apply?</legend>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "I am under 26 years old", val: under26, set: setUnder26 },
                { label: "I graduated within the last 2 years", val: recentGrad, set: setRecentGrad },
                { label: "I am switching from a UK Student visa", val: studentSwitch, set: setStudentSwitch },
              ].map((q) => (
                <label key={q.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.9375rem", color: "var(--color-ink-soft)" }}>
                  <input type="checkbox" checked={q.val} onChange={(e) => q.set(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--color-gold)", cursor: "pointer" }} />
                  {q.label}
                </label>
              ))}
            </div>
          </fieldset>
          <p style={{ margin: "0.875rem 0 0", fontSize: "0.8125rem", fontWeight: 500, color: newEntrant ? "#065f46" : "#92400e" }}>
            {newEntrant ? "You likely qualify for the new entrant rate of £33,400." : "Standard rate applies: £41,700 or your role's going rate, whichever is higher."}
          </p>
        </div>
      </section>

      {/* ══ S4: Licence revocations ═══════════════════════════════════════════*/}
      <section aria-labelledby="s4" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="04" />
        <SectionHead
          title="Licence revocations: the risk no one talks about"
          subtitle="The number of employers losing their licence is rising sharply. This affects you directly if it happens after you start."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left: stat trio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { stat: "3,100", label: "Sponsor licences revoked in 2025. The highest since records began in 2012.", sub: "In Q4 2025 alone, more than 1,500 licences were pulled.", source: "relocly.co.uk", url: "https://relocly.co.uk", dot: "#ef4444" },
              { stat: "8×", label: "The increase in revocations since 2022.", sub: "From 247 in 2022–23 to 1,948 in 2024–25. Approximately eight times the rate of three years ago.", source: "assessnow.co.uk", url: "https://assessnow.co.uk", dot: "#ef4444" },
              { stat: "60 days", label: "If your employer's licence is revoked after you start, you have 60 days to find a new sponsor.", sub: "No right to appeal. Immediate visa curtailment. All sponsored employment rights lost.", source: "centuroglobal.com", url: "https://centuroglobal.com", dot: "#f59e0b" },
            ].map((s) => (
              <div key={s.stat} className="surface-card" style={{ padding: "1.25rem", borderLeft: `3px solid ${s.dot}` }}>
                <p style={{ margin: 0, fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.stat}</p>
                <p style={{ margin: "0.5rem 0 0.25rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)", lineHeight: 1.5 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-ink-soft)", lineHeight: 1.55 }}>{s.sub}</p>
                <SourceChip label={s.source} url={s.url} />
              </div>
            ))}
          </div>

          {/* Right: insight cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <HiddenFact sourceLabel="Fragomen / Home Office transparency data" sourceUrl="https://relocly.co.uk">
              The sectors with the highest revocation rates are adult social care, hospitality, retail, and construction. Common issues: underpayment of staff, facilitating immigration rule circumvention, and failing to provide promised work.
            </HiddenFact>
            <HiddenFact sourceLabel="relocly.co.uk" sourceUrl="https://relocly.co.uk">
              The Home Office now uses HMRC and Companies House data to identify compliance problems without visiting the company. Problems can be flagged silently before the employer is even aware.
            </HiddenFact>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "#065f46" }}>This is why licence tenure data matters</p>
              </div>
              <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.65, color: "#065f46" }}>
                Sponsor Signal&apos;s <strong style={{ fontWeight: 500 }}>Established</strong> tier = 5+ years continuously on the register. That is not a guarantee, but it is a meaningful signal that the employer has been meeting compliance requirements over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ S5: Where the jobs are ═══════════════════════════════════════════*/}
      <section aria-labelledby="s5" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="05" />
        <SectionHead
          title="Where the sponsored jobs actually are"
          subtitle="Sector by sponsorship density, typical salary range, and revocation risk."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left: sector bars */}
          <div className="surface-card" style={{ padding: 0, overflow: "hidden" }}>
            {SECTORS.map((s, i) => (
              <div key={s.name} style={{ padding: "1rem 1.25rem", borderBottom: i < SECTORS.length - 1 ? "1px solid var(--color-line)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)" }}>{s.name}</p>
                    <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>{s.sponsors} sponsors · {s.salary}</p>
                  </div>
                  {s.risk === "high" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.55rem", borderRadius: 999, fontSize: "0.6875rem", fontWeight: 500, background: "#fff5f5", color: "#991b1b", flexShrink: 0 }}>
                      high revoc. risk
                    </span>
                  )}
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--color-line-hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, background: s.color, width: `${s.density}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Right: hidden fact cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <HiddenFact sourceLabel="ukvisajobs.com" sourceUrl="https://ukvisajobs.com">
              Junior tech roles fell approximately 46% and are projected to fall a further 53% in certain segments. Entry-level roles in technology and white-collar fields are being especially affected.
            </HiddenFact>
            <HiddenFact sourceLabel="tarve.co.uk" sourceUrl="https://tarve.co.uk">
              AI and machine learning roles command some of the highest salaries and clear the visa threshold most comfortably. Often £60,000–£100,000+. The government has specifically identified AI as a priority area for international talent attraction.
            </HiddenFact>
          </div>
        </div>

        {/* Competition reality. full width dark card */}
        <div style={{ marginTop: "1.25rem", background: "rgba(15,17,23,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: "var(--radius-card)", padding: "1.75rem", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)" }}>Competition reality</p>
          <p style={{ margin: 0, fontSize: "clamp(1rem,2vw,1.2rem)", fontWeight: 500, color: "#fff", lineHeight: 1.5 }}>
            Graduate employers received <span style={{ color: "#FFCA6B" }}>23% more applications</span> in the first half of 2025–2026. Graduate recruitment is at its lowest level since 2012.
          </p>
          <p style={{ margin: "0.875rem 0 0", fontSize: "0.875rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>
            The median graduate starting salary among UK leading employers remains £35,000 in 2026. Below the visa threshold for most applicants. In most cases, the challenge is finding employers willing to sponsor visas, not meeting salary thresholds.
          </p>
          <SourceChip label="High Fliers Research. The Graduate Market in 2026" url="https://highfliers.co.uk" />
        </div>
      </section>

      {/* ══ S6: SOC code explainer ═══════════════════════════════════════════*/}
      <section aria-labelledby="s6" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="06" />
        <SectionHead
          title="The SOC code: the number that decides your threshold"
          subtitle="Most students have never heard of it. Incorrect codes are now a leading cause of visa refusals."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left: three steps */}
          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { n: 1, head: "Your job title is not your SOC code.", body: "The SOC code is assigned based on actual job duties, not the title at the top of the advert. A Data Analyst and a Business Intelligence Analyst might have different codes with different going rates." },
                { n: 2, head: "Your SOC code sets your minimum salary.", body: "If the going rate for your SOC code is higher than £41,700, the going rate wins. Software Developers (SOC 2134) have a going rate of approximately £46,000. So the threshold for that role is £46,000, not £41,700." },
                { n: 3, head: "The wrong SOC code can get your visa refused.", body: "Incorrect codes are now a leading cause of refusals and licence action. Employers must match actual job duties, not job titles, and ensure the salary meets the correct going rate for the chosen code." },
              ].map((s) => (
                <div key={s.n} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 500 }}>0{s.n}</span>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 0.375rem", fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)", lineHeight: 1.3 }}>{s.head}</p>
                    <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <HiddenFact sourceLabel="GOV.UK Appendix Skilled Occupations" sourceUrl="https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-occupations">
                Ask your employer which SOC code they plan to assign before you accept an offer. If the salary meets £41,700 but not the going rate for that code, your application will be refused.
              </HiddenFact>
        </div>
      </div>

          {/* Right: lookup table */}
          <div className="surface-card" style={{ padding: 0, overflow: "auto" }}>
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-line)", background: "rgba(238,242,255,0.5)" }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-ink)" }}>Common roles. going rate vs threshold</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-line)" }}>
                  {["Role", "SOC", "Going rate", "Effective min"].map((h) => (
                    <th key={h} style={{ padding: "0.625rem 0.875rem", textAlign: "left", fontWeight: 500, color: "var(--color-muted)", fontSize: "0.6875rem", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLE_TABLE.map((r, i) => (
                  <tr key={r.role + i} style={{ borderBottom: i < ROLE_TABLE.length - 1 ? "1px solid var(--color-line)" : "none" }}>
                    <td style={{ padding: "0.625rem 0.875rem", color: "var(--color-ink)", whiteSpace: "nowrap", fontWeight: 500 }}>{r.role}</td>
                    <td style={{ padding: "0.625rem 0.875rem", color: "var(--color-muted)" }}>{r.soc}</td>
                    <td style={{ padding: "0.625rem 0.875rem", color: "var(--color-ink-soft)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.going)}</td>
                    <td style={{ padding: "0.625rem 0.875rem", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ color: r.wins === "going" ? "#4f6ef7" : "var(--color-ink-soft)", fontWeight: r.wins === "going" ? 500 : 400 }}>
                        {r.wins === "going" ? fmt(r.going) : fmt(41700)}
                      </span>
                      <span style={{ display: "block", fontSize: "0.6rem", color: r.wins === "going" ? "#4f6ef7" : "var(--color-muted)", marginTop: 2 }}>
                        {r.wins === "going" ? "going rate" : "general min"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--color-line)" }}>
              <SourceChip label="tarve.co.uk. 2026 going rates" url="https://tarve.co.uk/blog/uk-skilled-worker-going-rate-2026" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ S7: English language trap ════════════════════════════════════════*/}
      <section aria-labelledby="s7" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="07" />
        <SectionHead
          title="The English language trap"
          subtitle="A change most students don't know about. With a consequence that affects them directly."
        />
        <div className="surface-card" style={{ padding: "1.75rem" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left: the change */}
            <div>
              <h3 style={{ margin: "0 0 0.875rem", fontSize: "1rem", fontWeight: 500, color: "var(--color-ink)" }}>What changed from 8 January 2026</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.75, color: "var(--color-ink-soft)" }}>
                The English language requirement for new Skilled Worker, Scale-up, and High Potential Individual visa applicants increased from <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>B1 (GCSE level)</strong> to <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>B2 (A-level standard)</strong>.
              </p>
              <p style={{ margin: "0.875rem 0 0", fontSize: "0.9rem", lineHeight: 1.75, color: "var(--color-ink-soft)" }}>
                This change applies only to first-time applicants. Those already holding permission can extend without demonstrating the higher proficiency level.
              </p>
              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10 }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "#065f46" }}>B2 on CEFR = IELTS 5.5–6.0 overall, with no single band below 5.5. Check your current score before assuming you qualify.</p>
              </div>
            </div>

            {/* Right: hidden facts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <HiddenFact sourceLabel="immigrationbarrister.co.uk" sourceUrl="https://immigrationbarrister.co.uk/new-year-new-rules-key-uk-immigration-changes-for-2026">
                If you qualified for your Student visa at B1 English and now want to switch to Skilled Worker, you need a new B2 test. Your original IELTS score will not be enough.
              </HiddenFact>
              <HiddenFact>
                IELTS Academic and IELTS UKVI are different tests. Only IELTS UKVI is accepted for visa applications. Many students book the wrong one and must re-sit.
              </HiddenFact>
            </div>
          </div>
        </div>
      </section>

      {/* ══ S8: Changelog ════════════════════════════════════════════════════*/}
      <section aria-labelledby="s8" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="08" />
        <SectionHead title="What changed and when it affects you" />

        {/* Filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "0 0 1.5rem" }} role="group" aria-label="Filter changelog">
          {(["all", "red", "amber", "green"] as ChangelogFilter[]).map((f) => {
            const active = clFilter === f;
            const meta = f !== "all" ? LIGHT_META[f as TrafficLight] : null;
            const labels: Record<ChangelogFilter, string> = { all: "All", green: "Good news", amber: "Watch", red: "Bad for students" };
              return (
                <button
                key={f}
                  type="button"
                onClick={() => setClFilter(f)}
                aria-pressed={active}
                  style={{
                  minHeight: 36, padding: "0 0.875rem", borderRadius: 999,
                  border: active ? `1px solid ${meta?.dot ?? "var(--color-gold)"}44` : "1px solid var(--color-line)",
                  background: active ? (meta ? `${meta.dot}18` : "var(--color-gold-pale)") : "transparent",
                  color: active ? (meta?.dot ?? "var(--color-gold)") : "var(--color-ink-soft)",
                  fontSize: "0.8125rem", fontWeight: active ? 500 : 400,
                    cursor: "pointer", transition: "all 120ms",
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  }}
                >
                {meta && <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.dot }} aria-hidden />}
                {labels[f]}
                </button>
              );
            })}
          </div>

        <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
          <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: "var(--color-line-hover)", borderRadius: 999 }} aria-hidden />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredLog.map((item) => {
              const meta = LIGHT_META[item.light];
              return (
                <div key={item.date} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -23, top: 18, width: 12, height: 12, borderRadius: "50%", background: meta.dot, border: "2px solid var(--color-canvas)", boxShadow: `0 0 0 3px ${meta.dot}30` }} aria-hidden />
                  <div className="surface-card" style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-muted)" }}>{item.date}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.6875rem", fontWeight: 500,
                        background: item.light === "green" ? "#ecfdf5" : item.light === "amber" ? "#fffbeb" : "#fff5f5",
                        color: item.light === "green" ? "#065f46" : item.light === "amber" ? "#92400e" : "#991b1b",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} aria-hidden />
                        {meta.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.65, color: "var(--color-ink)" }}>{item.text}</p>
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.6875rem", color: "var(--color-link)" }}>
                      Read more. {item.sourceLabel} ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ S9: Settlement: the long game ════════════════════════════════════*/}
      <section aria-labelledby="s9" style={{ marginBottom: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="09" />
        <SectionHead
          title="Settlement: the long game"
          subtitle="What comes after the Skilled Worker visa. And the rules that just changed."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left: the standard route */}
          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>Standard route from graduation to ILR</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { step: "Step 1", label: "Graduate Route", duration: "2 years (18 months from Jan 2027)", color: "#10b981" },
                { step: "Step 2", label: "Skilled Worker visa", duration: "5 years required for settlement", color: "#4f6ef7" },
                { step: "Step 3", label: "Indefinite Leave to Remain", duration: "Requires 5 years continuous UK residence", color: "#7c3aed" },
              ].map((s, i) => (
                <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontSize: "0.6875rem", fontWeight: 500 }}>0{i + 1}</span>
                    </div>
                    {i < 2 && <div style={{ width: 2, flex: 1, minHeight: 32, background: `linear-gradient(to bottom, ${s.color}60, transparent)`, marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingBottom: i < 2 ? "1.25rem" : 0, paddingTop: "0.25rem" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: s.color }}>{s.step}</p>
                    <p style={{ margin: "0.125rem 0 0", fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>{s.label}</p>
                    <p style={{ margin: "0.125rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)" }}>{s.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(79,110,247,0.06)", borderRadius: 10, border: "1px solid rgba(79,110,247,0.15)" }}>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 500, color: "var(--color-ink)" }}>
                Minimum <span style={{ color: "var(--color-gold)" }}>7 years</span> from graduation to ILR
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--color-ink-soft)" }}>2 Graduate Route + 5 Skilled Worker, with continuous UK residence throughout</p>
            </div>
          </div>

          {/* Right: hidden facts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <HiddenFact sourceLabel="immigrationbarrister.co.uk" sourceUrl="https://immigrationbarrister.co.uk">
              The 10-year long residence route. Which let people aggregate time across different visa types. has been abolished. You can no longer count up years from different visas to reach settlement faster.
            </HiddenFact>
            <HiddenFact sourceLabel="immigrationbarrister.co.uk" sourceUrl="https://immigrationbarrister.co.uk">
              From April 2026, the standard settlement route extends to 10 years for most sponsored workers. Unless you earn above a high-earner threshold that qualifies you for faster settlement.
            </HiddenFact>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "#065f46" }}>PhD graduates. The immigration case is stronger than ever</p>
              </div>
              <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.65, color: "#065f46" }}>
                PhD graduates keep the 3-year Graduate Route and may qualify for the Global Talent visa pathway faster. If you are considering a PhD, the immigration case for it has strengthened significantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ S10: AI insights panel ════════════════════════════════════════════*/}
      <section aria-labelledby="s10" style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <SectionNum n="10" />
        <SectionHead
          title="Insights from your last search"
          subtitle="Generated from your search data combined with the published statistics above."
        />

        {lastMatch ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Left: search-specific insights */}
            <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--color-line)" }}>
              <ColHeader text={`Based on your search for ${lastMatch.role ?? "your role"}`} gradient="linear-gradient(135deg,#4f6ef7,#2338c7)" />
              <div style={{ background: "var(--color-paper)", padding: "1.25rem" }}>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden><path d="M2 5h6M5 2l3 3-3 3" stroke="#4f6ef7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                      The CV match score from your last search was <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>{lastMatch.match_score ?? "N/A"}%</strong>. Typical successful sponsored hire match scores exceed 70%.
                    </p>
                  </li>
                  {topSkills.length > 0 && (
                    <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden><path d="M2 5h6M5 2l3 3-3 3" stroke="#4f6ef7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                        <strong style={{ fontWeight: 500, color: "var(--color-ink)" }}>{topSkills[0]?.skill}</strong> appears in {topSkills[0]?.share_pct}% of ads in your search. The single highest-priority gap to close.
                      </p>
                    </li>
                  )}
                  <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden><path d="M2 5h6M5 2l3 3-3 3" stroke="#4f6ef7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                      Cross-reference your employer shortlist from that search against the licence revocation data above. especially any sponsors in hospitality, retail, or construction.
                    </p>
                  </li>
                </ul>
                </div>
                </div>

            {/* Right: market flags */}
            <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--color-line)" }}>
              <ColHeader text="What the market data suggests" gradient="linear-gradient(135deg,#7c3aed,#4f46e5)" />
              <div style={{ background: "var(--color-paper)", padding: "1.25rem" }}>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {[
                    "Sponsors in retail, hospitality, and adult social care carry the highest revocation risk in 2025 data. We flag these with a caution indicator in search results.",
                    "If any salary-stated ads in your search fell below £41,700, those roles cannot legally sponsor you unless you qualify for the new entrant discount above.",
                    "The 23% application volume surge means response rates are lower than historical data suggests. A strong CV match and verified sponsor are more important than ever.",
                  ].map((text, i) => (
                    <li key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden><path d="M2 5h6M5 2l3 3-3 3" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>{text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-card" style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="7" stroke="#4f6ef7" strokeWidth="1.5"/>
                <path d="M15.5 15.5L19 19" stroke="#4f6ef7" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>Run a search to see personalised insights</p>
            <p style={{ margin: "0.5rem 0 1.5rem", fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)", maxWidth: "40ch", marginLeft: "auto", marginRight: "auto" }}>
              Once you search a role, this panel combines your results with the published data above to surface role-specific flags.
            </p>
            <a href="/search" className="cta-primary" style={{ display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 1.25rem", fontSize: "0.9375rem", fontWeight: 500, textDecoration: "none" }}>
              Search a role
            </a>
        </div>
        )}

        <p style={{ margin: "1.25rem 0 0", fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.6 }}>
          Insights generated from your search data, combined with published Home Office and HESA statistics. Not legal advice. Sources: House of Commons Library, UKCISA, High Fliers Research 2026, HESA Graduate Outcomes, DLA Piper, Home Office Statement of Changes, GOV.UK Appendix Skilled Occupations.
        </p>
      </section>
    </main>
  );
}
