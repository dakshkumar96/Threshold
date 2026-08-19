"use client";

import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CheckCircle,
  FilePdf,
  Info,
  MagnifyingGlass,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { analyzeRole, MAX_CV_BYTES, type ExperienceLevel } from "@/lib/api";
import InfoTip from "@/app/components/InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";
import {
  loadNewEntrantPref,
  saveNewEntrantPref,
} from "@/lib/results-utils";
import { useUserApi } from "@/lib/user-api";
import { useAuth } from "@clerk/nextjs";

const TOTAL_STEPS = 4;

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: "any", label: "Any level", hint: "No experience filter" },
  { value: "graduate", label: "Graduate / entry", hint: "First roles" },
  { value: "junior", label: "Junior", hint: "1–2 years" },
  { value: "mid", label: "Mid-level", hint: "Solid experience" },
  { value: "senior", label: "Senior", hint: "Deep ownership" },
  { value: "lead", label: "Lead / principal", hint: "Team or domain lead" },
];

const SALARY_PRESETS: { label: string; value: string }[] = [
  { label: "No minimum", value: "" },
  { label: "£30,000+", value: "30000" },
  { label: "£40,000+", value: "40000" },
  { label: "£50,000+", value: "50000" },
  { label: "£60,000+", value: "60000" },
];

const LOADING_STEPS = [
  "Scanning live UK job ads",
  "Matching Home Office sponsors",
  "Reading skill requirements",
  "Preparing your CV roadmap",
];

const STEP_META = [
  {
    title: "What role do you want to find?",
    description:
      "Use a title employers actually advertise so we can match licensed sponsors and live ads.",
  },
  {
    title: "What experience level fits?",
    description:
      "Filters skill analysis when enough ads match. Sponsor listings stay complete either way.",
  },
  {
    title: "Any salary floor?",
    description:
      "Optional. Ads without a stated salary stay included so you do not miss open roles.",
  },
  {
    title: "Add a CV for a match score?",
    description:
      "Optional. Upload a text-based PDF or TXT to score skills against live demand for this role.",
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="search-wizard">
          <p className="text-muted">Loading search…</p>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = useAuth();
  const api = useUserApi();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [minSalary, setMinSalary] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("mid");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadBarDone, setLoadBarDone] = useState(false);
  const [loadTransitionMs, setLoadTransitionMs] = useState(4000);
  const [error, setError] = useState<string | null>(null);
  const [entrantOpen, setEntrantOpen] = useState(false);
  const [graduatedRecent, setGraduatedRecent] = useState(false);
  const [under26, setUnder26] = useState(false);
  const [switchingVisa, setSwitchingVisa] = useState(false);
  const loadTimers = useRef<number[]>([]);
  const entrantHydrated = useRef(false);

  const isNewEntrant = graduatedRecent || under26 || switchingVisa;

  useEffect(() => {
    const q = searchParams.get("role");
    if (q) setRole(q);
    const exp = searchParams.get("experience") as ExperienceLevel | null;
    if (exp) setExperience(exp);
    const salary = searchParams.get("min_salary");
    if (salary) setMinSalary(salary);
  }, [searchParams]);

  useEffect(() => {
    const local = loadNewEntrantPref();
    if (local) {
      setGraduatedRecent(true);
    }
    if (!isSignedIn) {
      entrantHydrated.current = true;
      return;
    }
    void api.getPreferences().then((prefs) => {
      if (prefs?.is_new_entrant) {
        setGraduatedRecent(true);
        saveNewEntrantPref(true);
      }
      entrantHydrated.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!entrantHydrated.current) return;
    saveNewEntrantPref(isNewEntrant);
    if (!isSignedIn) return;
    void api.putPreferences({ is_new_entrant: isNewEntrant });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewEntrant, isSignedIn]);

  useEffect(() => {
    if (!loading) {
      setLoadStep(0);
      setLoadProgress(0);
      setLoadBarDone(false);
      setLoadTransitionMs(4000);
      loadTimers.current.forEach((id) => window.clearTimeout(id));
      loadTimers.current = [];
      return;
    }
    const steps = file ? LOADING_STEPS : LOADING_STEPS.slice(0, 3);
    const id = window.setInterval(() => {
      setLoadStep((s) => Math.min(s + 1, steps.length - 1));
    }, 2400);

    setLoadProgress(0);
    setLoadTransitionMs(4000);
    const t1 = window.setTimeout(() => {
      setLoadTransitionMs(4000);
      setLoadProgress(30);
    }, 40);
    const t2 = window.setTimeout(() => {
      setLoadTransitionMs(3000);
      setLoadProgress(70);
    }, 4040);
    const t3 = window.setTimeout(() => {
      setLoadTransitionMs(2000);
      setLoadProgress(95);
    }, 7040);
    loadTimers.current = [t1, t2, t3];

    return () => {
      window.clearInterval(id);
      loadTimers.current.forEach((tid) => window.clearTimeout(tid));
      loadTimers.current = [];
    };
  }, [loading, file]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const meta = STEP_META[step];
  const sponsorTip = VISA_CONTENT.sponsorLicence;
  const loadingCopy = file ? LOADING_STEPS : LOADING_STEPS.slice(0, 3);

  const canAdvance = useMemo(() => {
    if (step === 0) return role.trim().length > 0;
    return true;
  }, [step, role]);

  function goNext() {
    if (step >= TOTAL_STEPS - 1 || !canAdvance) return;
    setDirection(1);
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step <= 0) return;
    setDirection(-1);
    setError(null);
    setStep((s) => s - 1);
  }

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!role.trim()) {
      setDirection(-1);
      setStep(0);
      setError("Enter a job role to search.");
      return;
    }
    if (file && file.size > MAX_CV_BYTES) {
      setError("CV file is too large (max 5 MB). Try a shorter text-based PDF.");
      return;
    }
    const salaryRaw = minSalary.trim().replace(/[,£]/g, "");
    let salaryNum: number | null = null;
    if (salaryRaw) {
      salaryNum = Number(salaryRaw);
      if (!Number.isFinite(salaryNum) || salaryNum < 0) {
        setError("Minimum salary must be a number.");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeRole(
        role.trim(),
        file,
        salaryNum,
        experience,
        isNewEntrant,
      );
      setLoadTransitionMs(50);
      setLoadProgress(100);
      setLoadBarDone(true);
      sessionStorage.setItem("threshold_results", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      if (msg.toLowerCase().includes("no jobs") || msg.toLowerCase().includes("404")) {
        setError(`${msg} Try a broader title or switch experience to Any level.`);
      } else if (msg.toLowerCase().includes("cannot reach")) {
        setError(`${msg} Start the API, then search again.`);
      } else {
        setError(`${msg} You can adjust the role wording and try again.`);
      }
    } finally {
      setLoading(false);
    }
  }

  const variants = {
    enter: (dir: number) => ({
      x: reduceMotion ? 0 : dir > 0 ? 28 : -28,
      opacity: 0,
      filter: reduceMotion ? "blur(0px)" : "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      x: reduceMotion ? 0 : dir > 0 ? -28 : 28,
      opacity: 0,
      filter: reduceMotion ? "blur(0px)" : "blur(4px)",
    }),
  };

  return (
    <div className="search-wizard">
      <div className="search-wizard__orbs" aria-hidden>
        <span className="search-wizard__orb search-wizard__orb--a" />
        <span className="search-wizard__orb search-wizard__orb--b" />
        <span className="search-wizard__orb search-wizard__orb--c" />
      </div>

      <div className="search-wizard__stage">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="search-wizard__card search-wizard__card--loading"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div
                  className="search-wizard__load-bar"
                  data-done={loadBarDone ? "true" : "false"}
                  aria-hidden
                >
                  <span
                    style={{
                      width: `${loadProgress}%`,
                      transition: `width ${loadTransitionMs}ms linear, opacity 0.3s ease`,
                    }}
                  />
                </div>
                <div className="search-wizard__load-pulse" aria-hidden>
                  <span />
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadStep}
                    className="search-wizard__load-title"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {loadingCopy[loadStep]}…
                  </motion.p>
                </AnimatePresence>
                <p className="search-wizard__load-note">
                  A full scan can take up to two minutes. You can leave this tab open.
                </p>
                <ol className="search-wizard__load-list">
                  {loadingCopy.map((label, i) => (
                    <li key={label} data-done={i <= loadStep ? "true" : "false"}>
                      <CheckCircle
                        size={16}
                        weight={i <= loadStep ? "fill" : "regular"}
                        aria-hidden
                      />
                      {label}
                    </li>
                  ))}
                </ol>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="search-wizard__card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < TOTAL_STEPS - 1) goNext();
                  else void onSubmit();
                }}
                aria-busy={loading}
              >
                <div className="search-wizard__progress">
                  <div className="search-wizard__progress-meta">
                    <span>
                      Step {step + 1}/{TOTAL_STEPS}
                    </span>
                    <span className="search-wizard__progress-role">
                      {role.trim() || "New search"}
                    </span>
                  </div>
                  <div
                    className="search-wizard__bar"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={TOTAL_STEPS}
                    aria-valuenow={step + 1}
                    aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
                  >
                    <motion.span
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  </div>
                </div>

                <div className="search-wizard__body">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.32, ease: EASE }}
                      className="search-wizard__step"
                    >
                      <h1>{meta.title}</h1>
                      <p className="search-wizard__desc">{meta.description}</p>

                      {step === 0 && (
                        <div className="search-wizard__field">
                          <label htmlFor="role">Your role</label>
                          <input
                            id="role"
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Data Analyst, Marketing Manager, Software Engineer"
                            required
                            autoFocus
                            suppressHydrationWarning
                          />
                          <div className="search-wizard__tip">
                            Grounded in the Home Office sponsor register
                            <InfoTip label={sponsorTip.label}>
                              <span className="block">{sponsorTip.body}</span>
                              <span className="mt-2 block">
                                <a href={sponsorTip.href} target="_blank" rel="noreferrer">
                                  {sponsorTip.linkLabel}
                                </a>
                              </span>
                            </InfoTip>
                          </div>
                        </div>
                      )}

                      {step === 1 && (
                        <div className="search-wizard__field">
                          <p className="search-wizard__label" id="experience-label">
                            Experience level
                          </p>
                          <div
                            className="search-wizard__pills"
                            role="group"
                            aria-labelledby="experience-label"
                          >
                            {EXPERIENCE_OPTIONS.map((opt) => {
                              const active = experience === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className="search-wizard__pill"
                                  data-active={active ? "true" : "false"}
                                  aria-pressed={active}
                                  onClick={() => setExperience(opt.value)}
                                >
                                  <CheckCircle
                                    size={16}
                                    weight={active ? "fill" : "regular"}
                                    aria-hidden
                                  />
                                  <span>
                                    <strong>{opt.label}</strong>
                                    <em>{opt.hint}</em>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="search-wizard__field">
                          <p className="search-wizard__label" id="salary-label">
                            Expected salary floor
                          </p>
                          <div
                            className="search-wizard__pills search-wizard__pills--compact"
                            role="group"
                            aria-labelledby="salary-label"
                          >
                            {SALARY_PRESETS.map((opt) => {
                              const active = minSalary === opt.value;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  className="search-wizard__pill search-wizard__pill--compact"
                                  data-active={active ? "true" : "false"}
                                  aria-pressed={active}
                                  onClick={() => setMinSalary(opt.value)}
                                >
                                  <CheckCircle
                                    size={15}
                                    weight={active ? "fill" : "regular"}
                                    aria-hidden
                                  />
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                          <label htmlFor="min_salary" className="search-wizard__sublabel">
                            Or enter a custom minimum (£)
                          </label>
                          <input
                            id="min_salary"
                            type="number"
                            min={0}
                            step={1000}
                            value={minSalary}
                            onChange={(e) => setMinSalary(e.target.value)}
                            placeholder="e.g. 42000"
                            suppressHydrationWarning
                          />
                        </div>
                      )}

                      {step === 3 && (
                        <div className="search-wizard__field">
                          <label
                            htmlFor="cv"
                            className="search-wizard__upload"
                            data-has-file={file ? "true" : "false"}
                          >
                            <span className="search-wizard__upload-icon" aria-hidden>
                              {file ? (
                                <FilePdf size={24} weight="duotone" />
                              ) : (
                                <UploadSimple size={24} weight="duotone" />
                              )}
                            </span>
                            <span className="search-wizard__upload-copy">
                              <strong>
                                {file ? file.name : "Upload a text-based PDF or TXT"}
                              </strong>
                              <em>
                                {file
                                  ? "Ready for match scoring"
                                  : "Skip if you only want sponsor matches"}
                              </em>
                            </span>
                            {file ? (
                              <button
                                type="button"
                                className="search-wizard__upload-clear"
                                aria-label="Remove CV"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFile(null);
                                }}
                              >
                                <X size={16} weight="bold" />
                              </button>
                            ) : null}
                            <input
                              id="cv"
                              type="file"
                              accept=".pdf,.txt,application/pdf"
                              className="sr-only"
                              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                              suppressHydrationWarning
                            />
                          </label>
                          <p className="search-wizard__hint">
                            Your CV is read in memory, sent to an LLM for the recruiter
                            assessment, and then deleted. It is not stored on our servers.
                            Do not upload documents containing sensitive personal data.
                          </p>

                          <div className="search-wizard__entrant">
                            <button
                              type="button"
                              className="search-wizard__entrant-toggle"
                              aria-expanded={entrantOpen}
                              onClick={() => setEntrantOpen((o) => !o)}
                            >
                              <Info size={14} weight="fill" aria-hidden />
                              Are you a new entrant?
                              <CaretDown
                                size={14}
                                weight="bold"
                                aria-hidden
                                style={{
                                  marginLeft: "auto",
                                  transform: entrantOpen ? "rotate(180deg)" : undefined,
                                  transition: "transform 0.15s ease",
                                }}
                              />
                            </button>
                            {entrantOpen ? (
                              <div className="search-wizard__entrant-body">
                                <label className="search-wizard__entrant-row">
                                  <span>I graduated within the last 2 years</span>
                                  <input
                                    type="checkbox"
                                    checked={graduatedRecent}
                                    onChange={(e) => setGraduatedRecent(e.target.checked)}
                                  />
                                </label>
                                <label className="search-wizard__entrant-row">
                                  <span>I am under 26</span>
                                  <input
                                    type="checkbox"
                                    checked={under26}
                                    onChange={(e) => setUnder26(e.target.checked)}
                                  />
                                </label>
                                <label className="search-wizard__entrant-row">
                                  <span>I am switching from a Student or Graduate visa</span>
                                  <input
                                    type="checkbox"
                                    checked={switchingVisa}
                                    onChange={(e) => setSwitchingVisa(e.target.checked)}
                                  />
                                </label>
                                {isNewEntrant ? (
                                  <p className="search-wizard__entrant-chip">
                                    New entrant rate applies. Your salary threshold is
                                    £33,400 not £41,700.
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="search-wizard__summary">
                            <h2>Search summary</h2>
                            <ul>
                              <li>
                                <span>Role</span>
                                <strong>{role.trim()}</strong>
                              </li>
                              <li>
                                <span>Experience</span>
                                <strong>
                                  {
                                    EXPERIENCE_OPTIONS.find((o) => o.value === experience)
                                      ?.label
                                  }
                                </strong>
                              </li>
                              <li>
                                <span>Salary floor</span>
                                <strong>
                                  {minSalary
                                    ? `£${Number(minSalary).toLocaleString()}+`
                                    : "No minimum"}
                                </strong>
                              </li>
                              <li>
                                <span>CV</span>
                                <strong>{file ? file.name : "Not attached"}</strong>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {error ? (
                  <p role="alert" className="search-wizard__error">
                    {error}
                  </p>
                ) : null}

                <div className="search-wizard__nav">
                  <button
                    type="button"
                    className="search-wizard__btn search-wizard__btn--ghost"
                    onClick={goBack}
                    disabled={step === 0}
                  >
                    <ArrowLeft size={16} weight="bold" aria-hidden />
                    Back
                  </button>
                  {step < TOTAL_STEPS - 1 ? (
                    <button
                      type="submit"
                      className="search-wizard__btn search-wizard__btn--primary"
                      disabled={!canAdvance}
                    >
                      Next
                      <ArrowRight size={16} weight="bold" aria-hidden />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="search-wizard__btn search-wizard__btn--primary"
                      disabled={!role.trim()}
                    >
                      <MagnifyingGlass size={16} weight="bold" aria-hidden />
                      Find sponsor roles
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}
