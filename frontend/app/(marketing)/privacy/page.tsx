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
    "What Threshold stores, what it sends to other companies, and what it never keeps, written from the real code and not copied from a template.",
};

const GLANCE = [
  "No CV text or file is ever stored in our database.",
  "Signing in is optional. Searching works without an account.",
  "One call to a third-party AI service, and only when you upload a CV.",
  "No analytics or ad-tracking scripts run in this app.",
];

const WE_STORE = [
  "Saved searches, which means the role, experience level, minimum salary and the time you searched",
  "Your preferences, which means your default level, locations, alert setting and CV file name",
  "A snapshot of your last search, which means your match score, skill gaps, sponsor list and job counts",
  "Normal server logs, which means your IP address, the time and the page you asked for",
];

const WE_NEVER_STORE = [
  "Your CV file or the text taken from it",
  "Your password, because Clerk handles sign-in",
  "Any third-party analytics or advertising identifiers",
  "Your search history beyond the single most recent snapshot",
];

const SECTIONS = [
  {
    Icon: UserCircle,
    heading: "Account data (Clerk)",
    body: [
      "Sign-in is handled by Clerk, a separate company that specialises in logging people in. Clerk keeps your email and sign-in details under its own privacy policy. We only receive a user ID from Clerk. We never see or store your password.",
    ],
  },
  {
    Icon: Database,
    heading: "What we store, precisely",
    body: [
      "The lists above cover it. If you are signed in, we keep your saved searches, your preferences and a snapshot of your last search, so the insights and home pages can show them back to you. The snapshot never includes your CV text.",
    ],
  },
  {
    Icon: FileText,
    heading: "CV uploads",
    body: [
      "When you upload a CV as a PDF or plain text, we read it in memory for that one request and pull out the text. We use the text on our server to work out your skill match score. We also send it to an AI service, currently Groq, which writes the review of your strengths, your gaps and how a recruiter might see your CV.",
      "That AI call only happens when you upload a CV. The provider uses the text to write its response, and we do not use it for anything else. Your CV file and its text are not saved to disk or to our database once the request is finished.",
    ],
  },
  {
    Icon: Buildings,
    heading: "Job and sponsor data",
    body: [
      "Job ads come from Reed and Adzuna, and from employer hiring boards such as Greenhouse, Ashby, Workable and Recruitee where we have linked an employer to one. Sponsor licence data comes from the Home Office's public Register of Licensed Sponsors. None of this is personal data about you. It is public information about employers and live job ads.",
    ],
  },
  {
    Icon: Monitor,
    heading: "What's stored in your browser",
    body: [
      "Your most recent search result is kept in your browser on your own device so it survives a page refresh. It clears when you close the tab. We also keep a small history of match scores in your browser, with only the role, the score and the date, so we can draw the trend chart on the insights page. That history stays until you clear your browser storage.",
    ],
  },
  {
    Icon: XCircle,
    heading: "What we don't do",
    body: [
      "No third-party analytics or ad-tracking scripts run in this app. We do not sell data. We do not use your CV or search history for anything except making the result you asked for.",
    ],
  },
  {
    Icon: CloudCheck,
    heading: "Hosting and logs",
    body: [
      "The app runs on normal hosting, currently Vercel for the website and a separate server for the API. These make ordinary logs, such as your IP address, the time and the page you asked for, so the service can run safely. We only link them to your account when we need to look into a problem you report.",
    ],
  },
  {
    Icon: Scales,
    heading: "Your rights",
    body: [
      "You can ask us to delete your saved searches, preferences and last search snapshot at any time. Email dakshkumar2k2@gmail.com and we will do it. This is a small product run by one person, so there is no delete button yet.",
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
            Last updated 17 August 2026. This explains what the product
            actually does, and we checked it against the code that runs it.
          </p>
        </div>
        <aside className="about-hero__panel" aria-label="At a glance">
          <p className="about-panel-kicker">At a glance</p>
          <ul>
            {GLANCE.map((line) => (
              <li key={line}>
                <Eye size={18} weight="fill" color="#1d4ed8" aria-hidden />
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
              <CheckCircle size={18} weight="fill" color="#1d4ed8" aria-hidden />
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
                <Icon size={20} weight="duotone" color="#1d4ed8" />
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
