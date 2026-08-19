import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowsClockwise,
  Buildings,
  CheckCircle,
  CloudCheck,
  Database,
  Eye,
  FileText,
  Monitor,
  Scales,
  UserCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Threshold stores, what it sends to third parties, and what it never keeps, written from the actual code, not boilerplate.",
};

const GLANCE = [
  "No CV text or file is ever stored in our database.",
  "Signing in is optional. Searching works without an account.",
  "One third-party LLM call, only when you upload a CV.",
  "No analytics or ad-tracking scripts run in this app.",
];

const WE_STORE = [
  "Saved searches: role, experience level, minimum salary, timestamp",
  "Preferences: default experience, locations, alert setting, CV filename",
  "Your last search snapshot: match score, skill gaps, sponsor list, job counts",
  "Standard server logs: IP address, timestamp, requested path",
];

const WE_NEVER_STORE = [
  "Your CV file or its extracted text",
  "Your password. Clerk handles authentication",
  "Any third-party analytics or advertising identifiers",
  "Your search history beyond the single most recent snapshot",
];

const SECTIONS = [
  {
    Icon: UserCircle,
    heading: "Account data (Clerk)",
    body: [
      "Sign-in is handled by Clerk, a third-party authentication provider. Clerk stores your email and authentication details under its own privacy policy. We receive a user ID from Clerk and do not see or store your password.",
    ],
  },
  {
    Icon: Database,
    heading: "What we store, precisely",
    body: [
      "The summary above covers it. If you are signed in, we store your saved searches, your preferences, and a snapshot of your last search result so /insights and /home can show it back to you. None of that snapshot includes your CV text.",
    ],
  },
  {
    Icon: FileText,
    heading: "CV uploads",
    body: [
      "When you upload a CV, in PDF or plain text, it is parsed in memory for that single request to extract its text. That text is used to compute a deterministic skill-overlap score on our server and, only if configured, sent to a third-party LLM provider, currently Groq, an OpenAI-compatible API, to generate narrative feedback: strengths, gaps, and a recruiter-style review.",
      "That LLM call happens only when you upload a CV. The provider processes the text to generate a response and is not used by us for any other purpose. The CV file and extracted text are not written to disk or saved in our database beyond that request.",
    ],
  },
  {
    Icon: Buildings,
    heading: "Job and sponsor data",
    body: [
      "Job ads come from Reed and Adzuna's public APIs, and from employer applicant-tracking boards such as Greenhouse, Ashby, Workable, and Recruitee, where we have mapped an employer to one. Sponsor licence data comes from the UK Home Office's public Register of Licensed Sponsors. None of this is personal data about you. It is public information about employers and live job listings.",
    ],
  },
  {
    Icon: Monitor,
    heading: "What's stored in your browser",
    body: [
      "Your most recent search result is kept in sessionStorage on your device so results survive a page refresh. It clears when you close the tab. A small match-score history, role, score, and date only, is kept in localStorage on your device to draw the trend chart on /insights, and stays until you clear your browser storage.",
    ],
  },
  {
    Icon: XCircle,
    heading: "What we don't do",
    body: [
      "No third-party analytics or ad-tracking scripts run in this app. We do not sell data, and we do not use your CV or search history for anything beyond generating the result you asked for.",
    ],
  },
  {
    Icon: CloudCheck,
    heading: "Hosting and logs",
    body: [
      "The app runs on standard hosting infrastructure, currently Vercel for the frontend and a Python host for the API, which generates ordinary server logs, such as IP address, timestamp, and requested path, for operating and securing the service. These are not linked to your account beyond what is needed to debug an issue you report.",
    ],
  },
  {
    Icon: Scales,
    heading: "Your rights",
    body: [
      "You can request deletion of your saved searches, preferences, and last-match snapshot at any time. Email dakshkumar2k2@gmail.com and we will action it. This is a small, independently run product without a self-service deletion flow yet.",
    ],
  },
  {
    Icon: ArrowsClockwise,
    heading: "Changes",
    body: ["If what we store or send changes, this page changes with it. Check the date above."],
  },
];

export default function PrivacyPage() {
  return (
    <main className="pb-24 pt-10 md:pt-14">
      <section className="about-hero" style={{ display: "grid", gap: "1.75rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
            Legal
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "24ch", lineHeight: 1.15 }}>
            Privacy Policy
          </h1>
          <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-muted)" }}>
            Last updated 17 August 2026. This describes what the product
            actually does, checked against the code that runs it.
          </p>
        </div>
        <aside className="about-hero__panel" aria-label="At a glance">
          <p className="about-panel-kicker">At a glance</p>
          <ul>
            {GLANCE.map((line) => (
              <li key={line}>
                <Eye size={18} weight="fill" color="#4F6EF7" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="about-compare" aria-labelledby="store-heading" style={{ marginTop: "1.5rem" }}>
        <div>
          <h2 id="store-heading" style={{ margin: 0, fontSize: "clamp(1.45rem, 2.6vw, 1.85rem)", fontWeight: 500, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
            What we store, and what we never store
          </h2>
          <p style={{ margin: "0.7rem 0 0", maxWidth: "62ch", fontSize: "1rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
            The clearest way to explain a privacy policy is to show both lists
            side by side.
          </p>
        </div>
        <div className="about-compare__grid">
          <article className="about-compare__card about-compare__card--yes">
            <p className="about-compare__label">
              <CheckCircle size={18} weight="fill" color="#4F6EF7" aria-hidden />
              We store
            </p>
            <ul>
              {WE_STORE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article className="about-compare__card about-compare__card--no">
            <p className="about-compare__label">
              <XCircle size={18} weight="fill" color="#94A3B8" aria-hidden />
              We never store
            </p>
            <ul>
              {WE_NEVER_STORE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <div style={{ marginTop: "1rem", display: "grid", gap: "2.5rem" }}>
        {SECTIONS.map(({ Icon, heading, body }) => (
          <section key={heading} aria-labelledby={heading} style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="about-promise__icon" style={{ margin: 0 }} aria-hidden>
                <Icon size={20} weight="duotone" color="#4F6EF7" />
              </span>
              <h2 id={heading} style={{ margin: 0, fontSize: "1.15rem", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
                {heading}
              </h2>
            </div>
            {body.map((p) => (
              <p key={p.slice(0, 24)} style={{ margin: "1rem 0 0", maxWidth: "62ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p style={{ marginTop: "3rem", marginBottom: 0, display: "flex", flexWrap: "wrap", gap: "1rem 1.5rem", fontSize: "0.9375rem" }}>
        <Link href="/terms" style={{ fontWeight: 500, color: "var(--color-link)" }}>Terms of Service</Link>
        <Link href="/methodology" style={{ color: "var(--color-link)" }}>Methodology</Link>
        <Link href="/" style={{ color: "var(--color-link)" }}>Search a role</Link>
      </p>
    </main>
  );
}
