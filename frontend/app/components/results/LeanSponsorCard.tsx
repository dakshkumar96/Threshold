"use client";

import {
  salaryClass,
  thresholdClearsLabel,
  type Sponsor,
} from "@/lib/results-utils";
import {
  BookmarkSimple,
  Check,
  MapPin,
  Question,
  Circle,
} from "@phosphor-icons/react";
import AgencyWarningChip from "./AgencyWarningChip";

function confTone(c?: string | null): "verified" | "likely" | "possible" {
  if (c === "verified") return "verified";
  if (c === "likely") return "likely";
  return "possible";
}

export default function LeanSponsorCard({
  sponsor,
  bookmarked,
  onBookmark,
  salaryThreshold,
  isNewEntrant,
}: {
  sponsor: Sponsor;
  bookmarked: boolean;
  onBookmark: () => void;
  salaryThreshold?: number | null;
  isNewEntrant?: boolean | null;
}) {
  const tone = confTone(sponsor.sponsor_confidence);
  const initial = (sponsor.company || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <article
      className="lean-card"
      data-tone={tone}
      aria-label={`${sponsor.title} · ${sponsor.company} · ${tone} sponsor`}
    >
      <div className="lean-card__strip" aria-hidden />

      <span className="lean-card__mark" data-tone={tone} title={`${tone} sponsor`}>
        {tone === "verified" ? (
          <Check size={11} weight="bold" aria-hidden />
        ) : tone === "likely" ? (
          <Circle size={8} weight="fill" aria-hidden />
        ) : (
          <Question size={11} weight="bold" aria-hidden />
        )}
      </span>

      <div className="lean-card__avatar" aria-hidden>
        {initial}
      </div>

      <div className="lean-card__main">
        <h3>{sponsor.title}</h3>
        <p>
          <span>{sponsor.company}</span>
          <span className="lean-card__dot" aria-hidden>
            ·
          </span>
          <span className="lean-card__loc-inline">
            <MapPin size={10} weight="fill" aria-hidden />
            {sponsor.location || "Location n/a"}
          </span>
        </p>
        <AgencyWarningChip
          companyRaw={sponsor.company_raw || sponsor.company}
          confidence={sponsor.sponsor_confidence}
        />
      </div>

      <div className="lean-card__meta">
        <span className={`lean-card__pay ${salaryClass(sponsor.salary_vs_threshold)}`}>
          {sponsor.salary_display || "Pay n/a"}
        </span>
        <span
          className="lean-card__thresh"
          data-tone={
            sponsor.salary_vs_threshold === "above"
              ? "above"
              : sponsor.salary_vs_threshold === "below"
                ? "below"
                : "na"
          }
          title={
            sponsor.salary_vs_threshold === "above"
              ? thresholdClearsLabel(salaryThreshold, isNewEntrant)
              : sponsor.salary_vs_threshold === "below"
                ? "Below Skilled Worker salary threshold"
                : "Salary vs threshold unknown"
          }
        >
          {sponsor.salary_vs_threshold === "above"
            ? "Above"
            : sponsor.salary_vs_threshold === "below"
              ? "Below"
              : "—"}
        </span>
      </div>

      <div className="lean-card__actions">
        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="lean-card__btn lean-card__btn--primary"
          >
            Apply
          </a>
        ) : null}
        <button
          type="button"
          className="lean-card__icon"
          data-active={bookmarked ? "true" : "false"}
          onClick={onBookmark}
          aria-label={bookmarked ? "Saved" : "Save"}
          aria-pressed={bookmarked}
        >
          <BookmarkSimple size={15} weight={bookmarked ? "fill" : "regular"} aria-hidden />
        </button>
      </div>
    </article>
  );
}
