import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowsClockwise,
  ChartBar,
  Compass,
  EnvelopeSimple,
  FileText,
  Scales,
  ShieldCheck,
  UserCircle,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Threshold: what the product does, what it does not promise, and your responsibilities as a user.",
};

const GLANCE = [
  "Evidence, not guarantees. A sponsor match is not a hiring promise.",
  "Not immigration advice. Use official guidance or a registered adviser.",
  "59% name-match precision, shown openly in Methodology.",
  "You control your account and can request deletion at any time.",
];

const SECTIONS = [
  {
    Icon: Compass,
    heading: "What Threshold is",
    body: [
      "Threshold is a search tool. You provide a UK job title, and optionally a CV, and it returns live job ads cross-referenced against the UK Home Office Skilled Worker sponsor register, plus market skill data and CV feedback generated with a third-party LLM.",
      "It is not a recruiter, an immigration adviser, or a guarantee of anything. See Methodology for how matches are built and how confident each one is.",
    ],
  },
  {
    Icon: WarningCircle,
    heading: "No visa or hiring guarantee",
    body: [
      "An active sponsor licence does not mean that employer is currently hiring, will sponsor you specifically, or will respond to your application. Licence tenure, confidence tiers, and match scores are evidence, not predictions.",
      "Threshold does not provide immigration advice. For questions about your visa eligibility or application, use the official guidance linked in the app or consult a registered immigration adviser.",
    ],
  },
  {
    Icon: ChartBar,
    heading: "Accuracy",
    body: [
      "Employer identity is certain only for roles fetched directly from a company's own applicant tracking system, marked Verified. Every other match is inferred by name matching against the sponsor register. Our own testing puts that at roughly 59 percent precision on a 100-row reviewed sample, documented in ACCURACY.md and on the Methodology page.",
      "Job data comes from Reed, Adzuna, and a small number of employer career-page integrations. We do not control that data and cannot guarantee it is current, complete, or free of errors introduced by the source.",
    ],
  },
  {
    Icon: UserCircle,
    heading: "Your account",
    body: [
      "Sign-in is handled by Clerk. If you create an account, you are responsible for keeping your credentials secure and for the accuracy of anything you save, including searches, preferences, and an optional CV filename.",
      "You can stop using the product and request deletion of your account data at any time. See the Privacy Policy for how.",
    ],
  },
  {
    Icon: FileText,
    heading: "CV uploads",
    body: [
      "If you upload a CV, its text is used to compute a skill-match score and, only when you upload one, sent to a third-party LLM provider to generate narrative feedback. Do not upload a CV containing information you would not want processed by that third party. See the Privacy Policy for exactly what is sent and what is stored.",
      "Uploading someone else's CV without their consent is not a supported use.",
    ],
  },
  {
    Icon: ShieldCheck,
    heading: "Acceptable use",
    body: [
      "Do not scrape, automate, or abuse the search or CV endpoints beyond normal interactive use, attempt to bypass rate limits, or use the product to build a competing dataset of the sponsor register. That data is already public on gov.uk.",
    ],
  },
  {
    Icon: Scales,
    heading: "No warranty, limited liability",
    body: [
      "Threshold is provided as is, without warranty of any kind. To the extent permitted by law, we are not liable for decisions made based on information shown in the product, including job applications, career changes, and visa-related decisions.",
    ],
  },
  {
    Icon: ArrowsClockwise,
    heading: "Changes",
    body: [
      "These terms may change as the product changes. Material changes will be reflected here with an updated date.",
    ],
  },
  {
    Icon: EnvelopeSimple,
    heading: "Contact",
    body: ["Questions about these terms can be sent to dakshkumar2k2@gmail.com."],
  },
];

export default function TermsPage() {
  return (
    <main className="pb-24 pt-10 md:pt-14">
      <section className="about-hero" style={{ display: "grid", gap: "1.75rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
            Legal
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "24ch", lineHeight: 1.15 }}>
            Terms of Service
          </h1>
          <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-muted)" }}>
            Last updated 17 August 2026. These terms are written in plain language.
            If anything is unclear, email us.
          </p>
        </div>
        <aside className="about-hero__panel" aria-label="At a glance">
          <p className="about-panel-kicker">At a glance</p>
          <ul>
            {GLANCE.map((line) => (
              <li key={line}>
                <ShieldCheck size={18} weight="fill" color="#4F6EF7" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <div style={{ marginTop: "3rem", display: "grid", gap: "2.5rem" }}>
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
        <Link href="/privacy" style={{ fontWeight: 500, color: "var(--color-link)" }}>Privacy Policy</Link>
        <Link href="/methodology" style={{ color: "var(--color-link)" }}>Methodology</Link>
        <Link href="/" style={{ color: "var(--color-link)" }}>Search a role</Link>
      </p>
    </main>
  );
}
