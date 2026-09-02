import type { Metadata } from "next";
import Link from "next/link";
import { VISA_CONTENT } from "@/lib/visa-content";

export const metadata: Metadata = {
  title: "Immigration guide",
};

export default function ImmigrationGuidePage() {
  const tips = [
    VISA_CONTENT.sponsorLicence,
    VISA_CONTENT.cos,
    VISA_CONTENT.salaryThreshold,
  ];

  return (
    <main className="pb-20 pt-10 md:pt-14">
      <div className="motion-enter">
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
          Solutions
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "20ch", lineHeight: 1.15 }}>
          UK immigration routes, without the jargon fog
        </h1>
        <p style={{ margin: "1rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
          This is orientation, not legal advice. Always confirm details on GOV.UK.
          thresholds and rules change.
        </p>
      </div>

      <section style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 500, color: "var(--color-ink)" }}>Graduate route</h2>
          <p style={{ margin: "0.625rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
            After eligible UK study you may be able to stay and work for a limited
            period without a sponsor. Many people use that window to find a Skilled
            Worker role. Check eligibility and length of stay on the official{" "}
            <a href="https://www.gov.uk/graduate-visa" target="_blank" rel="noreferrer">
              Graduate visa page
            </a>
            .
          </p>
        </div>
        <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 500, color: "var(--color-ink)" }}>Skilled Worker</h2>
          <p style={{ margin: "0.625rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
            You need a job offer from a licensed sponsor, a Certificate of
            Sponsorship, and to meet skill and salary rules for the role.
            Threshold helps you find licensed employers who are advertising. It
            does not guarantee a CoS or visa approval.
          </p>
        </div>
      </section>

      <section style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 500, color: "var(--color-ink)" }}>Key ideas we explain in-product</h2>
        <ul style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tips.map((t) => (
            <li key={t.label} style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.25rem" }}>
              <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500, color: "var(--color-ink)" }}>{t.label}</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>{t.body}</p>
              <a href={t.href} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "0.625rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-link)" }}>
                {t.linkLabel}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: "2.5rem", marginBottom: 0, display: "flex", flexWrap: "wrap", gap: "1rem 1.5rem", fontSize: "0.9375rem" }}>
        <Link href="/#solutions" style={{ fontWeight: 500, color: "var(--color-link)" }}>All solutions</Link>
        <Link href="/search" style={{ fontWeight: 500, color: "var(--color-link)" }}>Search sponsors</Link>
      </p>
    </main>
  );
}
