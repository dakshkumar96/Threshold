export type ExperienceLevel =
  | "any"
  | "graduate"
  | "junior"
  | "mid"
  | "senior"
  | "lead";

export type AnalyzeResponse = {
  role: string;
  has_cv?: boolean;
  jobs_total: number;
  jobs_sponsor_matched: number;
  jobs_verified?: number;
  jobs_scanned_for_skills?: number;
  jobs_in_skill_analysis?: number;
  jobs_full_description?: number;
  jobs_sent_to_llm?: number;
  jd_excerpts_used?: number;
  jobs_llm_truncated?: boolean;
  top_companies_are_sponsors?: boolean;
  match_rate_pct: number;
  min_salary_filter?: number | null;
  experience_level_requested?: string | null;
  experience_filter_applied?: boolean;
  experience_jobs_count?: number;
  experience_filter_note?: string | null;
  score: number | null;
  score_label: string | null;
  matched_count: number | null;
  top_n: number | null;
  readiness_pct: number | null;
  matched_skills: { skill: string; frequency_pct: number }[];
  gaps: {
    skill: string;
    frequency_pct: number;
    essential_share_pct?: number;
    ease_weeks?: number;
    priority_score?: number;
  }[];
  gap_suggestion?: string | null;
  where_you_are?: string | null;
  skills_to_learn?: {
    skill: string;
    frequency_pct?: number | null;
    ease_weeks?: number | null;
    priority_score?: number | null;
    note?: string | null;
  }[];
  requirement_frequencies: {
    skill: string;
    share_pct: number;
    count: number;
    essential_share_pct: number;
  }[];
  sponsors: {
    title: string;
    company: string;
    matched_sponsor: string;
    match_score: number | null;
    stability_band: string | null;
    licence_years?: number | null;
    stability_tooltip?: string | null;
    long_standing_licence?: boolean;
    sponsor_confidence?: "verified" | "likely" | "possible" | string | null;
    is_possible_sponsor?: boolean;
    location: string;
    other_locations?: string[] | null;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_display?: string | null;
    url: string;
    source: string;
  }[];
  top_companies: {
    company: string;
    jobs: number;
    location: string;
    stability_band?: string | null;
    licence_years?: number | null;
    stability_tooltip?: string | null;
    long_standing_licence?: boolean;
  }[];
  cv_text_chars: number;
  cv_feedback: {
    first_impression?: string | null;
    score_out_of_100?: number | null;
    bucket?: string | null;
    top_3_strengths?: string[];
    top_3_gaps?: string[];
    one_thing_to_fix_first?: string | null;
    would_put_forward?: string | null;
    full_report?: string | null;
    where_you_are?: string | null;
    skills_to_learn?: {
      skill: string;
      frequency_pct?: number | null;
      ease_weeks?: number | null;
      note?: string | null;
    }[];
    jobs_reviewed?: number | null;
    jobs_in_skill_analysis?: number | null;
    jd_excerpts_used?: number | null;
    jobs_context_truncated?: boolean;
    role_family_name?: string | null;
    calibration_band?: string | null;
    label?: string;
    error?: string;
    model?: string;
  } | null;
  llm_message: string;
  stability_caveat?: string;
  accuracy_note: string;
  chart: {
    gap_bars?: {
      skill: string;
      frequency_pct: number;
      ease_weeks?: number;
      priority_score?: number;
    }[];
    matched_bars?: { skill: string; frequency_pct: number }[];
    top_companies: {
      company: string;
      jobs: number;
      location: string;
      stability_band?: string | null;
      licence_years?: number | null;
      stability_tooltip?: string | null;
      long_standing_licence?: boolean;
    }[];
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ANALYZE_TIMEOUT_MS = 210_000;
const MAX_CV_BYTES = 5 * 1024 * 1024;

function parseApiError(text: string, status: number): string {
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d
            ? String((d as { msg: string }).msg)
            : String(d),
        )
        .join("; ");
    }
  } catch {
    /* raw text */
  }
  return text.slice(0, 280) || `API error ${status}`;
}

export async function analyzeRole(
  role: string,
  file?: File | null,
  minSalary?: number | null,
  experienceLevel?: ExperienceLevel | string | null,
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("role", role);
  if (file) {
    form.append("cv_file", file);
  }
  if (minSalary != null && Number.isFinite(minSalary) && minSalary > 0) {
    form.append("min_salary", String(Math.round(minSalary)));
  }
  if (experienceLevel && experienceLevel !== "any") {
    form.append("experience_level", String(experienceLevel));
  } else {
    form.append("experience_level", "any");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  let res: Response;
  try {
    const headers: Record<string, string> = {};
    const key = process.env.NEXT_PUBLIC_ANALYZE_API_KEY;
    if (key) headers["X-Analyze-Key"] = key;
    try {
      const clerk = (
        window as unknown as {
          Clerk?: { session?: { getToken: () => Promise<string | null> } };
        }
      ).Clerk;
      const token = await clerk?.session?.getToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      /* ignore */
    }

    res = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: form,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Analysis timed out (over 3.5 minutes). Try again, or narrow the role title.",
      );
    }
    throw new Error(
      `Cannot reach API at ${API_URL}. Is uvicorn running on port 8000?`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiError(text, res.status));
  }
  return res.json();
}

export { MAX_CV_BYTES };
