import type { AnalyzeResponse } from "@/lib/api";

export type ReportSection = {
  title: string;
  bullets: string[];
  paragraphs: string[];
};

export type SkillPlanItem = {
  skill: string;
  frequency_pct?: number | null;
  ease_weeks?: number | null;
  note?: string | null;
  start: number;
  end: number;
  span: number;
};

const SECTION_HEADERS =
  /^(overall impression|first impression|strengths|gaps|weaknesses|areas to improve|fix first|priority|recommendations|next steps|summary|verdict|final verdict|where you are|skills? to learn|learning plan|timeline|would put forward|put forward|scores|red flags|what works|experience bullets|rewritten summary)/i;

/** Split LLM full_report text into titled sections with bullets and paragraphs. */
export function parseFullReport(text: string): ReportSection[] {
  const raw = text.trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/);
  const sections: ReportSection[] = [];
  let current: ReportSection | null = null;

  const pushCurrent = () => {
    if (current && (current.bullets.length || current.paragraphs.length)) {
      sections.push(current);
    }
    current = null;
  };

  const ensureSection = (title: string) => {
    if (!current || current.title !== title) {
      pushCurrent();
      current = { title, bullets: [], paragraphs: [] };
    }
    return current;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionLabel = trimmed.match(/^SECTION:\s*(.+)$/i);
    const hashHeader = trimmed.match(/^#{1,3}\s+(.+)$/);
    const colonHeader = trimmed.match(/^([A-Z][\w\s/&-]{2,48}):\s*$/);
    const headerTitle =
      sectionLabel?.[1]?.trim() ||
      hashHeader?.[1]?.trim() ||
      colonHeader?.[1]?.trim();

    if (
      headerTitle &&
      (sectionLabel ||
        hashHeader ||
        (SECTION_HEADERS.test(headerTitle) && trimmed.length < 70 && !trimmed.startsWith("-")))
    ) {
      ensureSection(
        headerTitle
          .replace(/\s+/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase()),
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      const sec = current ?? ensureSection("Overview");
      sec.bullets.push(bulletMatch[1].trim());
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      const sec = current ?? ensureSection("Overview");
      sec.bullets.push(numbered[1].trim());
      continue;
    }

    const sec = current ?? ensureSection("Overview");
    sec.paragraphs.push(trimmed);
  }

  pushCurrent();
  return sections;
}

export function buildSkillPlan(data: AnalyzeResponse): SkillPlanItem[] {
  const need = data.skills_to_learn?.length
    ? data.skills_to_learn
    : (data.gaps || []).map((g) => ({
        skill: g.skill,
        frequency_pct: g.frequency_pct,
        ease_weeks: g.ease_weeks,
        note: null as string | null,
      }));

  let week = 1;
  return need.slice(0, 8).map((s) => {
    const w = Math.max(1, Math.round(s.ease_weeks ?? 3));
    const start = week;
    const end = week + w - 1;
    week = end + 1;
    return { ...s, start, end, span: w };
  });
}

export function sectionTone(title: string): "good" | "gap" | "fix" | "neutral" | "verdict" | "scores" {
  const t = title.toLowerCase();
  if (/final verdict|put forward|verdict/.test(t)) return "verdict";
  if (/^scores?$|rubric|scorecard|category scores/.test(t)) return "scores";
  if (/strength|strong|match|positive|summary|impression|where you/.test(t)) {
    return t.includes("gap") || t.includes("weak") ? "neutral" : "good";
  }
  if (/gap|weak|missing|improve|learn/.test(t)) return "gap";
  if (/fix|priority|first|recommend|next/.test(t)) return "fix";
  return "neutral";
}

/** Split prose into short bullets for scanability. Keeps a single sentence intact. */
export function splitVerdictBullets(text: string): string[] {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return [];
  const parts = raw
    .split(/(?<=[.!;])\s+/)
    .map((s) => s.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 5);
  // Long single sentence: split on " and " / " but " only when long enough
  if (raw.length > 110) {
    const soft = raw.split(/,\s+(?=[A-Z])|\s+[-–]\s+/).map((s) => s.trim()).filter(Boolean);
    if (soft.length >= 2) return soft.slice(0, 4);
  }
  return [raw];
}

/** Lead phrase to bold (skill / clause before the explanation). */
export function splitLeadBold(text: string): { lead: string; rest: string } | null {
  const cleaned = text.trim();
  // Keep put-forward / score lines for specialised renderers
  if (
    /^put[-\s]?forward\b/i.test(cleaned) ||
    /^(yes|no|not\s*yet)\b/i.test(cleaned)
  ) {
    return null;
  }
  if (/^\d+\s*\/\s*\d+\b/.test(cleaned)) return null;

  const labeled = cleaned.match(
    /^(Original|Verdict|Rewrite|Fix first|Priority)\s*:\s*(.+)$/i,
  );
  if (labeled) {
    return { lead: labeled[1].trim(), rest: labeled[2].trim() };
  }

  const colon = cleaned.match(/^([^:]{2,48}):\s*(.+)$/);
  if (colon && colon[1].split(/\s+/).length <= 8 && !/put[-\s]?forward/i.test(colon[1])) {
    return { lead: colon[1].trim(), rest: colon[2].trim() };
  }
  const dash = cleaned.match(/^(.{2,40}?)\s+[–—]\s+(.+)$/);
  if (dash && dash[1].split(/\s+/).length <= 8) {
    return { lead: dash[1].trim(), rest: dash[2].trim() };
  }
  const comma = cleaned.match(/^([^,]{2,40}),\s+(.+)$/);
  if (comma && comma[1].split(/\s+/).length <= 6) {
    return { lead: comma[1].trim(), rest: comma[2].trim() };
  }
  const words = cleaned.split(/\s+/);
  if (words.length > 7) {
    return { lead: words.slice(0, 3).join(" "), rest: words.slice(3).join(" ") };
  }
  return null;
}

export type ScoreLine = {
  label: string;
  score: number;
  max: number;
  note?: string;
};

/** Parse rubric lines like "Seven-Second Survivability: 16/20". */
export function parseScoreLine(text: string): ScoreLine | null {
  const cleaned = text
    .replace(/^[-•*]\s+/, "")
    .replace(/^\|\s*/, "")
    .replace(/\s*\|\s*$/, "")
    .trim();
  if (!cleaned || /^[-|:]+$/.test(cleaned)) return null;

  const pipe = cleaned.match(
    /^([^|]+?)\s*\|\s*(\d+)\s*\/\s*(\d+)\s*(?:\|\s*(.+))?$/,
  );
  if (pipe) {
    return {
      label: pipe[1].replace(/\*+/g, "").trim(),
      score: Number(pipe[2]),
      max: Number(pipe[3]),
      note: pipe[4]?.replace(/\*+/g, "").trim() || undefined,
    };
  }

  const colon = cleaned.match(
    /^(.+?)\s*:\s*(\d+)\s*\/\s*(\d+)(?:\s*[–—:-]\s*(.+))?$/,
  );
  if (colon) {
    return {
      label: colon[1].replace(/\*+/g, "").trim(),
      score: Number(colon[2]),
      max: Number(colon[3]),
      note: colon[4]?.replace(/\*+/g, "").trim() || undefined,
    };
  }

  return null;
}

export function extractScoreLines(section: ReportSection): {
  scores: ScoreLine[];
  leftoverBullets: string[];
  leftoverParagraphs: string[];
} {
  const scores: ScoreLine[] = [];
  const leftoverBullets: string[] = [];
  const leftoverParagraphs: string[] = [];

  for (const b of section.bullets) {
    const parsed = parseScoreLine(b);
    if (parsed) scores.push(parsed);
    else leftoverBullets.push(b);
  }
  for (const p of section.paragraphs) {
    // Multi-line blob: try each line
    const lines = p.split(/\n+/);
    let matchedAny = false;
    for (const line of lines) {
      const parsed = parseScoreLine(line);
      if (parsed) {
        scores.push(parsed);
        matchedAny = true;
      }
    }
    if (!matchedAny) leftoverParagraphs.push(p);
  }

  return { scores, leftoverBullets, leftoverParagraphs };
}

/** LLM overall lines like "Total: 70/100 — solid maybe" (not criterion scores). */
export function isOverallScoreLine(line: ScoreLine): boolean {
  return /^(total|overall|grand\s+total|score\s+total)$/i.test(line.label.trim());
}

export type ResolvedOverallScore = {
  /** Criterion rows only (excludes Total / Overall). */
  criteria: ScoreLine[];
  /** Single overall score always out of 100 when present. */
  overall: number | null;
  note?: string;
};

/**
 * One overall score out of 100: prefer explicit Total NN/100, else sum of criteria
 * (typically 5×/20 → /100). Never sums Total into the criteria total (avoids /200).
 */
export function resolveOverallScore(scores: ScoreLine[]): ResolvedOverallScore {
  const criteria = scores.filter((s) => !isOverallScoreLine(s));
  const overallLines = scores.filter(isOverallScoreLine);

  const explicit100 = overallLines.find((s) => s.max === 100);
  if (explicit100) {
    return {
      criteria,
      overall: Math.round(explicit100.score),
      note: explicit100.note,
    };
  }

  if (overallLines.length > 0) {
    const o = overallLines[0];
    if (o.max > 0) {
      return {
        criteria,
        overall: Math.round((o.score / o.max) * 100),
        note: o.note,
      };
    }
  }

  if (criteria.length === 0) {
    return { criteria, overall: null };
  }

  const sum = criteria.reduce((a, s) => a + s.score, 0);
  const maxSum = criteria.reduce((a, s) => a + s.max, 0);
  if (maxSum <= 0) return { criteria, overall: null };
  // 5×20 (or any rubric that already totals 100) → keep integer sum; otherwise normalize.
  if (maxSum === 100) {
    return { criteria, overall: Math.round(sum) };
  }
  return { criteria, overall: Math.round((sum / maxSum) * 100) };
}

export function scoreTone(score: number, max: number): "high" | "mid" | "low" {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.8) return "high";
  if (pct >= 0.65) return "mid";
  return "low";
}

export type PutForwardDecision = "yes" | "no" | "not-yet";

export type PutForwardResult = {
  decision: PutForwardDecision;
  label: string;
  reason?: string;
};

/** Parse put-forward lines: "Yes — reason", "Not yet. …", "Put-forward: No". */
export function parsePutForward(text: string): PutForwardResult | null {
  const cleaned = text
    .replace(/^[-•*]\s+/, "")
    .replace(/^put[-\s]?forward\s*[:–—-]?\s*/i, "")
    .trim();
  if (!cleaned) return null;

  const m = cleaned.match(
    /^(yes|no|not\s*yet)\b(?:\s*[.:–—-]+\s*(.+))?$/i,
  );
  if (!m) return null;

  const raw = m[1].toLowerCase().replace(/\s+/g, " ");
  const decision: PutForwardDecision =
    raw === "yes" ? "yes" : raw === "no" ? "no" : "not-yet";
  const label =
    decision === "yes" ? "Yes" : decision === "no" ? "No" : "Not yet";
  const reason = m[2]?.trim() || undefined;
  return { decision, label, reason };
}

export function putForwardFromSummary(
  value: string | null | undefined,
): PutForwardResult | null {
  if (!value) return null;
  return parsePutForward(value);
}
