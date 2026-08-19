"use client";

import ConfidenceBadge from "../ConfidenceBadge";
import InfoTip from "../InfoTip";
import AgencyWarningChip from "./AgencyWarningChip";
import { VISA_CONTENT } from "@/lib/visa-content";
import { Buildings, MapPin, TrendUp } from "@phosphor-icons/react";
import {
  overlapRatio,
  salaryClass,
  thresholdClearsLabel,
  type Sponsor,
} from "@/lib/results-utils";

function confTone(c?: string | null): "verified" | "likely" | "possible" {
  if (c === "verified") return "verified";
  if (c === "likely") return "likely";
  return "possible";
}

export default function ShortlistCard({
  sponsor,
  rank,
  bookmarked,
  onBookmark,
  onOpen,
  salaryThreshold,
  isNewEntrant,
}: {
  sponsor: Sponsor;
  rank: number;
  bookmarked: boolean;
  onBookmark: () => void;
  onOpen: () => void;
  salaryThreshold?: number | null;
  isNewEntrant?: boolean | null;
}) {
  const salary = VISA_CONTENT.salaryThreshold;
  const licence = VISA_CONTENT.licenceStability;
  const tone = confTone(sponsor.sponsor_confidence);
  const overlap =
    sponsor.cv_overlap_total != null && sponsor.cv_overlap_total > 0
      ? `${sponsor.cv_overlap_count ?? 0}/${sponsor.cv_overlap_total}`
      : null;
  const matchPct = Math.round(overlapRatio(sponsor) * 100);

  return (
    <article className="short-card" data-tone={tone}>
      <div className="short-card__rank" aria-hidden>
        #{rank}
      </div>
      <div className="short-card__strip" aria-hidden />

      <div className="short-card__col short-card__col--main">
        <div className="short-card__badges">
          <div>
            <ConfidenceBadge
              confidence={sponsor.sponsor_confidence}
              matchScore={sponsor.match_score}
              source={sponsor.source}
            />
            <AgencyWarningChip
              companyRaw={sponsor.company_raw || sponsor.company}
              confidence={sponsor.sponsor_confidence}
            />
          </div>
        </div>
        <h3 className="short-card__title">{sponsor.title}</h3>
        <p className="short-card__company">
          <Buildings size={13} weight="duotone" aria-hidden />
          {sponsor.company}
        </p>
        <p className="short-card__loc">
          <MapPin size={12} weight="fill" aria-hidden />
          {sponsor.location || "Location not stated"}
          {sponsor.source ? (
            <span className="short-card__source">{sponsor.source}</span>
          ) : null}
        </p>
      </div>

      <div className="short-card__stats">
        {sponsor.stability_band ? (
          <div className="short-card__stat" data-kind="tenure">
            <span className="short-card__stat-label">Licence</span>
            <strong data-band={sponsor.stability_band}>{sponsor.stability_band}</strong>
            {sponsor.licence_years != null ? (
              <span className="short-card__stat-sub">~{sponsor.licence_years}y</span>
            ) : null}
            <InfoTip label={licence.label}>
              <span className="block">{sponsor.stability_tooltip || licence.body}</span>
            </InfoTip>
          </div>
        ) : null}

        <div className="short-card__stat" data-kind="salary">
          <span className="short-card__stat-label">Salary</span>
          <strong className={salaryClass(sponsor.salary_vs_threshold)}>
            {sponsor.salary_display || "Not stated"}
          </strong>
          {sponsor.salary_vs_threshold === "above" ? (
            <span className="salary-threshold-chip">
              {thresholdClearsLabel(salaryThreshold, isNewEntrant)}
            </span>
          ) : sponsor.salary_vs_threshold === "borderline" ? (
            <span className="salary-threshold-chip">
              Range spans the threshold. Could land either side.
            </span>
          ) : null}
          <InfoTip label={salary.label}>
            <span className="block">{salary.body}</span>
            <span className="mt-2 block">
              <a href={salary.href} target="_blank" rel="noreferrer">
                {salary.linkLabel}
              </a>
            </span>
          </InfoTip>
        </div>

        {overlap ? (
          <div className="short-card__stat" data-kind="match">
            <span className="short-card__stat-label">
              <TrendUp size={12} weight="bold" aria-hidden />
              CV match
            </span>
            <strong>{matchPct}%</strong>
            <div className="short-card__match-bar" aria-hidden>
              <span style={{ width: `${matchPct}%` }} />
            </div>
            <span className="short-card__stat-sub">
              {overlap} skills
              {sponsor.jd_text_limited ? " · limited JD" : ""}
            </span>
          </div>
        ) : (
          <div className="short-card__stat short-card__stat--muted">
            <span className="short-card__stat-label">CV match</span>
            <span className="short-card__hint">
              {sponsor.jd_text_limited
                ? "Limited JD text"
                : "Upload CV for overlap"}
            </span>
          </div>
        )}
      </div>

      <div className="short-card__col short-card__col--actions">
        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="short-card__apply"
          >
            Apply
          </a>
        ) : null}
        <button type="button" className="short-card__link" onClick={onOpen}>
          Analysis
        </button>
        <button
          type="button"
          className="short-card__save"
          data-active={bookmarked ? "true" : "false"}
          onClick={onBookmark}
          aria-pressed={bookmarked}
        >
          {bookmarked ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
