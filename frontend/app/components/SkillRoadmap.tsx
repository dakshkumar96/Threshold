"use client";

type SkillItem = {
  skill: string;
  frequency_pct?: number | null;
  ease_weeks?: number | null;
  note?: string | null;
  priority_score?: number | null;
};

const DEFAULT_HINT =
  "Add one concrete project or course outcome you can show on your CV within the estimated weeks.";

function suggestionFor(skill: string, note?: string | null): string {
  if (note && note.trim()) return note.trim();
  const key = skill.toLowerCase();
  if (key.includes("python") || key.includes("sql") || key.includes("excel")) {
    return `Ship a small portfolio piece that uses ${skill} end-to-end, then name the outcome in your summary.`;
  }
  if (key.includes("aws") || key.includes("azure") || key.includes("cloud")) {
    return `Complete a guided lab in ${skill} and document the architecture in 5 bullets on your CV.`;
  }
  if (key.includes("communication") || key.includes("stakeholder")) {
    return "Rewrite one CV bullet to show a decision you influenced and the measurable result.";
  }
  return DEFAULT_HINT;
}

export default function SkillRoadmap({
  score,
  skills,
  emptyHint,
}: {
  score: number | null;
  skills: SkillItem[];
  emptyHint?: string;
}) {
  const pct = score != null ? Math.round(score) : null;

  return (
    <section aria-labelledby="roadmap-heading" className="motion-enter">
      <h2
        id="roadmap-heading"
        className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-ink md:text-[1.75rem]"
      >
        {pct != null
          ? `Your route from ${pct}% toward a stronger match`
          : "Skills employers ask for most"}
      </h2>
      <p className="mt-2 mb-0 max-w-[65ch] text-muted">
        Priority actions ranked by how often the skill appears in ads and how long
        it typically takes to learn. This is a plan, not a judgment.
      </p>

      {skills.length === 0 ? (
        <p className="mt-6 text-muted">
          {emptyHint || "No priority skills to show for this search yet."}
        </p>
      ) : (
        <ol className="mt-6 list-none space-y-0 p-0">
          {skills.slice(0, 8).map((s, i) => (
            <li
              key={s.skill}
              className="border-t border-line py-4 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="m-0 text-base font-semibold text-ink md:text-lg">
                  {s.skill}
                </h3>
                <span className="text-sm text-muted">
                  {s.frequency_pct != null ? `${s.frequency_pct}% of ads` : ""}
                  {s.frequency_pct != null && s.ease_weeks != null ? " · " : ""}
                  {s.ease_weeks != null ? `~${s.ease_weeks} weeks` : ""}
                </span>
              </div>
              <p className="mt-2 mb-0 max-w-[65ch] text-sm text-ink-soft">
                {suggestionFor(s.skill, s.note)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
