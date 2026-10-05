import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Job hunt guide",
};

const STEPS = [
  {
    t: "Pick a realistic target role",
    d: "Use a job title that employers really advertise. Run a Threshold search first and see how many sponsored roles come up. Do this before you rewrite your whole CV around a vague idea of what you want.",
  },
  {
    t: "Separate sponsored leads from noise",
    d: "Start with the verified and likely sponsors, because those are the ones we are most sure about. Treat possible matches as leads to look into, and check the company on the official register before you spend time on them.",
  },
  {
    t: "Close one skill gap that comes up a lot",
    d: "Look at your roadmap and pick the skill that appears in the most ads and can be learned in a few weeks. Build one small real project with it, then add it to your CV with a clear result.",
  },
  {
    t: "Apply with a direct link",
    d: "Use the Apply button on each card. Change three bullets on your CV so they match that job description. Do not send the same generic letter to fifty agencies.",
  },
  {
    t: "Track your applications and follow up calmly",
    d: "Write down where you applied and when. Follow up once if the process allows it, and keep searching while you wait. A quiet inbox is normal and it says nothing bad about you.",
  },
];

export default function JobHuntGuidePage() {
  return (
    <main className="pb-20 pt-10 md:pt-14">
      <div className="motion-enter">
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
          Solutions
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "18ch", lineHeight: 1.15 }}>
          A UK job hunt that respects your visa clock
        </h1>
        <p style={{ margin: "1rem 0 0", maxWidth: "60ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
          The pressure is real. These five steps are meant to stop you wasting time, not to make you work harder.
        </p>
      </div>

      <ol style={{ listStyle: "none", margin: "2.5rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid var(--color-line)" }}>
        {STEPS.map((s, i) => (
          <li key={s.t} style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--color-line)", display: "flex", gap: "1.25rem" }}>
            <span style={{ flexShrink: 0, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-gold)", fontVariantNumeric: "tabular-nums", minWidth: "1.75rem", paddingTop: "0.125rem" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500, color: "var(--color-ink)" }}>{s.t}</h2>
              <p style={{ margin: "0.5rem 0 0", maxWidth: "62ch", fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-soft)" }}>{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <p style={{ marginTop: "2.5rem", marginBottom: 0 }}>
        <Link href="/search" className="cta-primary inline-flex min-h-11 items-center px-4 no-underline" style={{ fontWeight: 500 }}>
          Start a search
        </Link>
      </p>
    </main>
  );
}
