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
          Write a CV that matches the jobs you want
        </h1>
      </div>

      <div style={{ marginTop: "2rem", maxWidth: "62ch", display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
        <p style={{ margin: 0 }}>
          A recruiter spends only a few seconds on a CV. They look for the tools and
          results they already wrote down in the job ad. Your job is to make those
          matches easy to see without making up experience you do not have.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <li>Start with a job title and a set of tools that match the ads you want.</li>
          <li>
            Take the skills that come up most in your Threshold roadmap and show them
            inside project bullets with a result. A plain list of buzzwords does not
            prove anything.
          </li>
          <li>
            Show one finished piece of work, such as a code repository, a dashboard or a
            case study, instead of five vague course certificates.
          </li>
          <li>
            Be honest about where you live and your right to work. Do not claim a
            Certificate of Sponsorship you do not have.
          </li>
          <li>
            Never add a number or a result that is not true. Our review checks that any
            rewrite we suggest only uses facts already in your CV.
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          When you are ready, upload a text-based PDF on the search page. We compare
          your skills with live ads for that role and give you a ranked list of gaps.
          Then an AI review reads your CV like a hiring manager and tells you what is
          shown well, what is missing and what to fix first.
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
