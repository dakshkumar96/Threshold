import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions",
};

const ITEMS = [
  {
    href: "/solutions/immigration-guide",
    title: "Immigration guide",
    body: "Skilled Worker and Graduate routes in plain English, with links to GOV.UK.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2Z" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M2.5 11h17M11 2c-2 2.5-3.2 5.6-3.2 9s1.2 6.5 3.2 9M11 2c2 2.5 3.2 5.6 3.2 9S13 17.5 11 20" stroke="#f5a623" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/solutions/job-hunt-guide",
    title: "Job hunt guide",
    body: "A calm, practical sequence for searching and applying in the UK market.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="13" rx="2" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M7 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M7 11h8M7 14.5h5" stroke="#f5a623" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/solutions/sponsorship-checker",
    title: "Sponsorship checker",
    body: "Look up whether a company name matches the Skilled Worker sponsor register.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M15.5 15.5L19 19" stroke="#f5a623" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M7.5 10h5M10 7.5v5" stroke="#f5a623" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/solutions/cv-guide",
    title: "CV guide",
    body: "How to write for sponsor-market ads, then score your CV against live demand.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 3h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="#f5a623" strokeWidth="1.5"/>
        <path d="M8 7.5h6M8 11h6M8 14.5h4" stroke="#f5a623" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M14 14.5l1.5 1.5L18 13.5" stroke="#f5a623" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function SolutionsIndexPage() {
  return (
    <main className="pb-20 pt-10 md:pt-14">
      {/* Hero */}
      <div className="motion-enter">
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
          Solutions
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "18ch", lineHeight: 1.15 }}>
          Guides and tools for the sponsorship path
        </h1>
        <p style={{ margin: "1rem 0 0", maxWidth: "52ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
          Four resources — from understanding your visa route to writing a CV that gets past the sponsor filter.
        </p>
      </div>

      {/* Card grid */}
      <ul className="mt-10 grid list-none gap-4 p-0 md:grid-cols-2">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="surface-card block h-full p-6 no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-line-hover hover:shadow-sm"
            >
              {/* Icon container */}
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--color-gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                {item.icon}
              </div>
              <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
                {item.title}
              </h2>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>{item.body}</p>
              <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-gold-dark)" }}>Read guide</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="#d4860a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
