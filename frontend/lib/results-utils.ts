import type { AnalyzeResponse } from "@/lib/api";

export type Sponsor = AnalyzeResponse["sponsors"][number];

export const SW_THRESHOLD = 41_700;
export const SW_NEW_ENTRANT_THRESHOLD = 33_400;
export const MATCH_TARGET = 75;
export const BOOKMARKS_KEY = "threshold_bookmarks";
export const HISTORY_KEY = "threshold_match_history";
export const NEW_ENTRANT_KEY = "threshold_new_entrant";

/** Mirrors backend AGENCY_KEYWORDS in match_sponsors.py (+ hiring). */
export const AGENCY_KEYWORDS = [
  "recruitment",
  "resourcing",
  "talent",
  "staffing",
  "recruiting",
  "hiring",
] as const;

export function isAgencyCompany(name?: string | null): boolean {
  const low = (name || "").toLowerCase();
  if (!low) return false;
  return AGENCY_KEYWORDS.some((kw) => low.includes(kw));
}

export function loadNewEntrantPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NEW_ENTRANT_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveNewEntrantPref(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NEW_ENTRANT_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function thresholdClearsLabel(
  threshold?: number | null,
  isNewEntrant?: boolean | null,
): string {
  const t = threshold ?? SW_THRESHOLD;
  const newEntrant =
    isNewEntrant === true || t === SW_NEW_ENTRANT_THRESHOLD;
  if (newEntrant) {
    return "Clears £33,400 new entrant rate";
  }
  return "Clears £41,700 standard threshold";
}

export type MatchHistoryPoint = {
  role: string;
  score: number;
  at: string;
};

export function confRank(c?: string | null): number {
  if (c === "verified") return 0;
  if (c === "likely") return 1;
  return 2;
}

export function overlapRatio(s: Sponsor): number {
  const t = s.cv_overlap_total ?? 0;
  if (!t) return 0;
  return (s.cv_overlap_count ?? 0) / t;
}

export function shortlistSponsors(sponsors: Sponsor[], n = 5): Sponsor[] {
  return [...sponsors]
    .filter((s) => s.salary_vs_threshold !== "below")
    .sort((a, b) => {
      const c = confRank(a.sponsor_confidence) - confRank(b.sponsor_confidence);
      if (c !== 0) return c;
      const th =
        (a.salary_vs_threshold === "above" ? 0 : 1) -
        (b.salary_vs_threshold === "above" ? 0 : 1);
      if (th !== 0) return th;
      const o = overlapRatio(b) - overlapRatio(a);
      if (o !== 0) return o;
      return (b.licence_years ?? 0) - (a.licence_years ?? 0);
    })
    .slice(0, n);
}

export function readinessLine(data: AnalyzeResponse): string {
  if (!data.has_cv || data.score == null) {
    return "Upload your CV to see your match score and readiness.";
  }
  const gaps = data.gaps?.length ?? data.skills_to_learn?.length ?? 0;
  const weeks = (data.skills_to_learn || [])
    .slice(0, 4)
    .reduce((acc, s) => acc + (s.ease_weeks ?? 3), 0);
  if (data.score >= 70) {
    return `Strong candidate. ${gaps} skill gap${gaps === 1 ? "" : "s"} between you and the top sponsored roles.`;
  }
  if (data.score >= 40) {
    return `You're ~${Math.max(weeks, 2)} weeks of learning away from being competitive for this role (estimate).`;
  }
  return `Not yet competitive for most licensed roles. Start with the highest-ROI gaps below (estimate ~${Math.max(weeks, 4)} weeks).`;
}

export function weeksEstimate(data: AnalyzeResponse): number | null {
  if (!data.has_cv) return null;
  const weeks = (data.skills_to_learn || [])
    .slice(0, 4)
    .reduce((acc, s) => acc + (s.ease_weeks ?? 3), 0);
  return Math.max(weeks, 2);
}

export function estimatedMatchLift(data: AnalyzeResponse): number | null {
  if (data.score == null) return null;
  const gapShares = (data.gaps || []).slice(0, 6).reduce((a, g) => a + (g.frequency_pct || 0), 0);
  // Rough: recover a fraction of missing frequency weight
  const lift = Math.min(25, gapShares * 0.35);
  return Math.min(95, Math.round(data.score + lift));
}

export function applyVerdict(s: Sponsor): {
  kind: "now" | "later" | "skip";
  label: string;
} {
  if (s.salary_vs_threshold === "below") {
    return {
      kind: "skip",
      label:
        "Skip this one. Stated salary is below the general Skilled Worker threshold (£41,700).",
    };
  }
  const essential = (s.jd_skills || []).filter((j) => j.essential);
  const miss = essential.filter(
    (j) => !(s.cv_matched_skills || []).map((x) => x.toLowerCase()).includes(j.skill.toLowerCase()),
  );
  if (s.jd_text_limited || !s.jd_skills?.length) {
    return {
      kind: "now",
      label:
        "Limited JD text from this source. Check the listing carefully before applying.",
    };
  }
  if (!essential.length) {
    const missAll = s.cv_missing_skills?.length ?? 0;
    if (missAll >= 3) {
      return {
        kind: "later",
        label: "Apply in a few weeks. Several skills in this JD are missing from your CV.",
      };
    }
    return {
      kind: "now",
      label: "Apply now. You cover core signals we can read from this JD (no essential markers).",
    };
  }
  if (miss.length === 0) {
    return {
      kind: "now",
      label: "Apply now. You cover the essential skills flagged in this JD.",
    };
  }
  if (miss.length === 1) {
    return {
      kind: "later",
      label: `Apply in ~4 weeks. One essential skill is missing (${miss[0].skill}). Close it first.`,
    };
  }
  return {
    kind: "skip",
    label: `Skip this one. ${miss.length} essential skills are missing from your CV.`,
  };
}

export function loadBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function saveBookmarks(set: Set<string>) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
}

export function toggleBookmark(url: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  if (next.has(url)) next.delete(url);
  else next.add(url);
  saveBookmarks(next);
  return next;
}

export function loadHistory(): MatchHistoryPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as MatchHistoryPoint[]) : [];
  } catch {
    return [];
  }
}

export function pushHistory(role: string, score: number | null | undefined) {
  if (score == null || typeof window === "undefined") return;
  const fingerprint = `${role.toLowerCase()}|${Math.round(score)}`;
  try {
    if (sessionStorage.getItem("threshold_hist_fp") === fingerprint) return;
    sessionStorage.setItem("threshold_hist_fp", fingerprint);
  } catch {
    /* ignore */
  }
  const prevAll = loadHistory();
  const next: MatchHistoryPoint[] = [
    ...prevAll,
    { role, score, at: new Date().toISOString() },
  ].slice(-30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function salaryClass(t?: string | null): string {
  if (t === "above") return "salary-above";
  if (t === "below") return "salary-below";
  if (t === "borderline") return "salary-borderline";
  return "salary-unknown";
}

export function confidenceCounts(sponsors: Sponsor[]) {
  let verified = 0;
  let likely = 0;
  let possible = 0;
  for (const s of sponsors) {
    if (s.sponsor_confidence === "verified") verified += 1;
    else if (s.sponsor_confidence === "likely") likely += 1;
    else possible += 1;
  }
  return { verified, likely, possible, total: sponsors.length };
}

export function bandCounts(sponsors: Sponsor[]) {
  const map = { Established: 0, Moderate: 0, "Newly registered": 0, Unknown: 0 };
  for (const s of sponsors) {
    const b = s.stability_band || "Unknown";
    if (b in map) map[b as keyof typeof map] += 1;
    else map.Unknown += 1;
  }
  return map;
}
