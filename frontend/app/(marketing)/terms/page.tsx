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
    "The rules for using Threshold, what the product does, what it does not promise, and what we ask of you.",
};

const GLANCE = [
  "We give evidence, not guarantees. A sponsor match is not a hiring promise.",
  "This is not immigration advice. Use official guidance or a registered adviser.",
  "Name matching is right about 59% of the time, and we show that openly in the methodology.",
  "You control your account and can ask us to delete your data at any time.",
];

const SECTIONS = [
  {
    Icon: Compass,
    heading: "What Threshold is",
    body: [
      "Threshold is a search tool. You give it a UK job title, and a CV if you want, and it shows live job ads checked against the Home Office Skilled Worker sponsor register. It also shows which skills the market asks for and gives feedback on your CV, written with the help of an AI service run by another company.",
      "It is not a recruiter, an immigration adviser, or a guarantee of anything. The methodology page explains how matches are made and how sure we are about each one.",
    ],
  },
  {
    Icon: WarningCircle,
    heading: "No visa or hiring guarantee",
    body: [
      "A company having a sponsor licence does not mean it is hiring right now, that it will sponsor you, or that it will reply to your application. Licence length, confidence labels and match scores are evidence and not predictions.",
      "Threshold does not give immigration advice. If you have questions about your visa or your application, use the official guidance linked in the app or talk to a registered immigration adviser.",
    ],
  },
  {
    Icon: ChartBar,
    heading: "Accuracy",
    body: [
      "We are only certain who the employer is when a role comes straight from the company's own hiring board. Those roles are marked Verified. Every other match is worked out by comparing company names with the sponsor register. In our own testing on 100 reviewed examples, that was right about 59 times in 100. This is written up in our accuracy notes and on the methodology page.",
      "Job data comes from Reed, Adzuna and a small number of employer careers pages. We do not control that data, so we cannot promise it is up to date, complete or free of mistakes made by the source.",
    ],
  },
  {
    Icon: UserCircle,
    heading: "Your account",
    body: [
      "Sign-in is handled by Clerk. If you create an account, you are responsible for keeping your login details safe and for what you save, such as searches, preferences and an optional CV file name.",
      "You can stop using the product and ask us to delete your account data at any time. The privacy policy explains how.",
    ],
  },
  {
    Icon: FileText,
    heading: "CV uploads",
    body: [
      "If you upload a CV, we use its text to work out a skill match score. We also send it to an AI service run by another company so it can write feedback. Please do not upload a CV that contains anything you would not want that company to process. The privacy policy explains exactly what is sent and what is kept.",
      "Please do not upload someone else's CV without their permission.",
    ],
  },
  {
    Icon: ShieldCheck,
    heading: "Acceptable use",
    body: [
      "Please use the search and CV features the way a normal person would. Do not scrape them, automate them, try to get around the limits, or use the product to build a rival copy of the sponsor register. That data is already public on gov.uk.",
    ],
  },
  {
    Icon: Scales,
    heading: "No warranty, limited liability",
    body: [
      "Threshold is provided as it is, with no warranty of any kind. As far as the law allows, we are not responsible for decisions you make based on what the product shows, including job applications, career changes and visa decisions.",
    ],
  },
  {
    Icon: ArrowsClockwise,
    heading: "Changes",
    body: [
      "These terms may change as the product changes. If something important changes, we will update this page and its date.",
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
                <ShieldCheck size={18} weight="fill" color="#1d4ed8" aria-hidden />
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
        <Link href="/privacy" style={{ fontWeight: 500, color: "var(--color-link)" }}>Privacy Policy</Link>
        <Link href="/methodology" style={{ color: "var(--color-link)" }}>Methodology</Link>
        <Link href="/" style={{ color: "var(--color-link)" }}>Search a role</Link>
      </p>
    </main>
  );
}
