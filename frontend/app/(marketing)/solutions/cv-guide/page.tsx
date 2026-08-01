import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CV guide",
};

export default function CvGuidePage() {
  return (
    <main className="pb-20 pt-10 md:pt-14">
      <div className="motion-enter">
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
          Solutions
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "18ch", lineHeight: 1.15 }}>
          Write a CV that maps to sponsor-market ads
        </h1>
      </div>

      <div style={{ marginTop: "2rem", maxWidth: "62ch", display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
        <p style={{ margin: 0 }}>
          Employers skim for tools and outcomes they already listed. Your job is to
          make those matches obvious without inventing experience.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <li>Lead with a role title and stack that match the ads you want.</li>
          <li>
            Put high-frequency skills from your Sponsor Signal roadmap into project
            bullets with a result, not a buzzword list.
          </li>
          <li>
            Prefer one shipped artefact (repo, dashboard, case study) over five vague
            course certificates.
          </li>
          <li>
            Keep location and right-to-work wording honest. Do not claim a CoS you do
            not have.
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          When you are ready, upload a text-based PDF on search. We score skills
          against live ads for that role and return a prioritised gap list — then an
          optional LLM note grounded in those frequencies.
        </p>
      </div>

      <p style={{ marginTop: "2.5rem", marginBottom: 0 }}>
        <Link href="/search" className="cta-primary inline-flex min-h-11 items-center px-4 no-underline" style={{ fontWeight: 500 }}>
          Score my CV against a role
        </Link>
      </p>
    </main>
  );
}
