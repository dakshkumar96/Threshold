import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Guides that go with your search: immigration routes, the sponsorship checker and the CV guide.",
};

const SOLUTIONS = [
  { href: "/search", title: "Sponsor search", body: "Search UK roles and match them to licensed sponsors.", tone: "indigo" },
  { href: "/solutions/immigration-guide", title: "Immigration guide", body: "Skilled Worker and Graduate routes, with GOV.UK links.", tone: "violet" },
  { href: "/solutions/sponsorship-checker", title: "Sponsorship checker", body: "Look up a company before you invest an hour.", tone: "blue" },
  { href: "/solutions/cv-guide", title: "CV guide", body: "Write for sponsor-market ads. Score against live demand.", tone: "indigo" },
] as const;

export default function SolutionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 500, color: "var(--color-ink)" }}>Solutions</h1>
      <p style={{ margin: "0.4rem 0 1.5rem", color: "var(--color-ink-soft)" }}>Guides around the search.</p>
      <ul className="solutions-row" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {SOLUTIONS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={`solution-tile solution-tile--${item.tone}`}>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500, color: "var(--color-ink)" }}>{item.title}</h2>
              <p style={{ margin: "0.7rem 0 0", fontSize: "0.875rem", lineHeight: 1.55, color: "var(--color-ink-soft)", flex: 1 }}>{item.body}</p>
              <span style={{ marginTop: "1.15rem", fontSize: "0.8125rem", fontWeight: 500, color: "#1d4ed8" }}>Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
