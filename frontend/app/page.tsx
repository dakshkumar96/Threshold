"use client";

import { FilePdf, CaretDown } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { analyzeRole, MAX_CV_BYTES, type ExperienceLevel } from "@/lib/api";
import InfoTip from "./components/InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "any", label: "Any level" },
  { value: "graduate", label: "Graduate / entry" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / principal" },
];

const LOADING_BASE = [
  "Scanning live UK job ads",
  "Matching Home Office sponsors",
  "Reading skill requirements",
];

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [minSalary, setMinSalary] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("mid");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setLoadStep(0);
      return;
    }
    const steps = file ? [...LOADING_BASE, "Preparing your CV roadmap"] : LOADING_BASE;
    const id = window.setInterval(() => {
      setLoadStep((s) => Math.min(s + 1, steps.length - 1));
    }, 2200);
    return () => window.clearInterval(id);
  }, [loading, file]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (file && file.size > MAX_CV_BYTES) {
      setError("CV file is too large (max 5 MB). Try a shorter text-based PDF.");
      return;
    }
    const salaryRaw = minSalary.trim().replace(/[,£]/g, "");
    let salaryNum: number | null = null;
    if (salaryRaw) {
      salaryNum = Number(salaryRaw);
      if (!Number.isFinite(salaryNum) || salaryNum < 0) {
        setError("Minimum salary must be a number. Clear the field or enter pounds only.");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeRole(role.trim(), file, salaryNum, experience);
      sessionStorage.setItem("sponsor_signal_results", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      if (msg.toLowerCase().includes("no jobs") || msg.toLowerCase().includes("404")) {
        setError(
          `${msg} Try a broader title, switch experience to Any level, or clear the salary floor.`,
        );
      } else if (msg.toLowerCase().includes("cannot reach")) {
        setError(`${msg} Start the API, then search again.`);
      } else {
        setError(`${msg} You can adjust the role wording and try again.`);
      }
    } finally {
      setLoading(false);
    }
  }

  const loadingCopy = file
    ? [...LOADING_BASE, "Preparing your CV roadmap"][loadStep]
    : LOADING_BASE[loadStep];
  const sponsorTip = VISA_CONTENT.sponsorLicence;

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] pb-16 pt-8 md:pt-12">
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-14">
        <div className="motion-enter">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            UK sponsor search
          </p>
          <h1 className="mt-4 mb-0 max-w-[19ch] font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Which licensed employers are hiring for your role?
          </h1>
          <p className="mt-5 mb-0 max-w-[38ch] text-base leading-relaxed text-muted md:text-[1.05rem]">
            See verified and likely sponsors, then a clear skill route from live UK ads.
          </p>
          <p className="mt-6 mb-0 inline-flex items-center gap-2 text-sm text-muted">
            Grounded in the Home Office sponsor register
            <InfoTip label={sponsorTip.label}>
              <span className="block">{sponsorTip.body}</span>
              <span className="mt-2 block">
                <a href={sponsorTip.href} target="_blank" rel="noreferrer">
                  {sponsorTip.linkLabel}
                </a>
              </span>
            </InfoTip>
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="motion-enter rounded-[14px] border border-line bg-paper p-5 md:p-6"
          aria-busy={loading}
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-semibold text-ink"
              >
                Job role
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. software engineer, nurse, data analyst"
                required
                disabled={loading}
                className="min-h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-base text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-navy focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-gold)_35%,transparent)] focus:outline-none disabled:opacity-60"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label
                htmlFor="experience"
                className="mb-2 block text-sm font-semibold text-ink"
              >
                Experience level
              </label>
              <select
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                disabled={loading}
                className="min-h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-base text-ink transition-[border-color] duration-150 focus:border-navy focus:outline-none disabled:opacity-60"
                suppressHydrationWarning
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 mb-0 text-xs text-muted">
                Filters skill analysis when enough ads match. Sponsor listings stay complete.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                aria-expanded={prefsOpen}
                onClick={() => setPrefsOpen((v) => !v)}
              >
                Add preferences
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`transition-transform duration-150 ${prefsOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {prefsOpen ? (
                <div className="mt-3 space-y-4 border-t border-line pt-4">
                  <div>
                    <label
                      htmlFor="min_salary"
                      className="mb-2 block text-sm font-semibold text-ink"
                    >
                      Minimum salary (optional)
                    </label>
                    <input
                      id="min_salary"
                      type="number"
                      min={0}
                      step={1000}
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      placeholder="e.g. 40000"
                      disabled={loading}
                      className="min-h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-base text-ink placeholder:text-muted/70 focus:border-navy focus:outline-none disabled:opacity-60"
                      suppressHydrationWarning
                    />
                    <p className="mt-1.5 mb-0 text-xs text-muted">
                      Ads without a stated salary stay included.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-ink">
                CV (optional)
              </span>
              <label
                htmlFor="cv"
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-line bg-white px-3.5 py-3 transition-colors hover:border-ink-soft"
              >
                <FilePdf size={22} weight="duotone" className="shrink-0 text-gold" aria-hidden />
                <span className="text-sm text-ink-soft">
                  {file ? file.name : "Upload a text-based PDF or TXT"}
                </span>
                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.txt,application/pdf"
                  className="sr-only"
                  disabled={loading}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  suppressHydrationWarning
                />
              </label>
              <p className="mt-1.5 mb-0 text-xs text-muted">
                When uploaded, your CV is sent to a third-party LLM for the detailed
                review. Do not upload documents you cannot share.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !role.trim()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-gold px-4 text-base font-semibold text-gold-ink transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-gold-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 md:w-auto md:min-w-[12rem]"
              suppressHydrationWarning
            >
              {loading ? "Searching…" : "Find sponsor roles"}
            </button>

            <div
              className="min-h-[1.25rem]"
              aria-live="polite"
              aria-atomic="true"
            >
              {error ? (
                <p className="m-0 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : loading ? (
                <>
                  <p className="m-0 text-sm text-ink-soft">{loadingCopy}…</p>
                  <p className="mt-1 mb-0 text-xs text-muted">
                    A full scan can take up to two minutes. You can leave this tab open.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <section className="mt-16 border-t border-line pt-10 md:mt-20">
        <h2 className="m-0 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em] text-ink">
          What you get
        </h2>
        <ul className="mt-6 list-none space-y-5 p-0 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
          <li>
            <p className="m-0 font-semibold text-ink">Sponsored roles first</p>
            <p className="mt-1 mb-0 text-sm text-muted">
              Verified, likely, and possible matches with plain-English confidence.
            </p>
          </li>
          <li>
            <p className="m-0 font-semibold text-ink">Skill roadmap</p>
            <p className="mt-1 mb-0 text-sm text-muted">
              Priority skills from live ads, with effort estimates you can act on.
            </p>
          </li>
          <li>
            <p className="m-0 font-semibold text-ink">Recruiter-style CV note</p>
            <p className="mt-1 mb-0 text-sm text-muted">
              Optional upload unlocks a mentor voice grounded in this market.
            </p>
          </li>
        </ul>
      </section>
    </main>
  );
}
