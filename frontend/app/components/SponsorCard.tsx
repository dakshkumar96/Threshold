"use client";

import ConfidenceBadge from "./ConfidenceBadge";
import InfoTip from "./InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";

export type SponsorItem = {
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
};

export default function SponsorCard({ sponsor }: { sponsor: SponsorItem }) {
  const licence = VISA_CONTENT.licenceStability;
  const salary = VISA_CONTENT.salaryThreshold;
  const extras =
    Array.isArray(sponsor.other_locations) && sponsor.other_locations.length > 0
      ? ` (+ ${sponsor.other_locations.slice(0, 2).join(", ")})`
      : "";

  return (
    <article className="rounded-[14px] border border-line bg-paper p-4 md:p-5 motion-enter">
      <div className="flex flex-wrap items-center gap-2">
        <ConfidenceBadge
          confidence={sponsor.sponsor_confidence}
          matchScore={sponsor.match_score}
          source={sponsor.source}
        />
        {sponsor.stability_band ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft">
            {sponsor.stability_band}
            {sponsor.long_standing_licence ? " · Long-standing" : ""}
            <InfoTip label={licence.label}>
              <span className="block">
                {sponsor.stability_tooltip || licence.body}
              </span>
              <span className="mt-2 block">
                <a href={licence.href}>{licence.linkLabel}</a>
              </span>
            </InfoTip>
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 mb-1 font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.02em] text-ink md:text-xl">
        {sponsor.title}
      </h3>
      <p className="m-0 text-sm text-ink-soft">
        {sponsor.company}
        {sponsor.matched_sponsor &&
        sponsor.sponsor_confidence !== "possible" &&
        sponsor.matched_sponsor !== sponsor.company
          ? ` · register: ${sponsor.matched_sponsor}`
          : ""}
      </p>

      <dl className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
        <div>
          <dt className="sr-only">Location</dt>
          <dd className="m-0">
            {sponsor.location || "Location not stated"}
            {extras}
          </dd>
        </div>
        <div className="inline-flex items-center gap-1">
          <dt className="sr-only">Salary</dt>
          <dd className="m-0">
            {sponsor.salary_display || "Salary not stated"}
          </dd>
          <InfoTip label={salary.label}>
            <span className="block">{salary.body}</span>
            <span className="mt-2 block">
              <a href={salary.href} target="_blank" rel="noreferrer">
                {salary.linkLabel}
              </a>
            </span>
          </InfoTip>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {sponsor.source}
        </span>
        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-gold px-4 text-sm font-semibold text-gold-ink no-underline transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-gold-hover active:scale-[0.98] sm:w-auto"
          >
            Apply
          </a>
        ) : null}
      </div>
    </article>
  );
}
