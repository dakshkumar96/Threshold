"use client";

import { motion } from "framer-motion";
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
  const isVerified = sponsor.sponsor_confidence === "verified";

  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="sponsor-card surface-card"
      data-confidence={sponsor.sponsor_confidence ?? ""}
      style={{
        padding: "1.25rem",
        borderColor: isVerified ? "rgba(29,184,116,0.3)" : undefined,
        background: isVerified
          ? "linear-gradient(180deg,rgba(29,184,116,0.04) 0%,transparent 32%),var(--color-paper)"
          : undefined,
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ConfidenceBadge
          confidence={sponsor.sponsor_confidence}
          matchScore={sponsor.match_score}
          source={sponsor.source}
        />
        {sponsor.stability_band ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            {sponsor.stability_band}
            {sponsor.long_standing_licence ? " · Long-standing" : ""}
            <InfoTip label={licence.label}>
              <span className="block">{sponsor.stability_tooltip || licence.body}</span>
              <span className="mt-2 block">
                <a href={licence.href}>{licence.linkLabel}</a>
              </span>
            </InfoTip>
          </span>
        ) : null}
      </div>

      <h3 className="mt-3.5 mb-1 text-base font-medium text-ink" style={{ lineHeight: 1.3 }}>
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

      <dl className="mt-3 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
        <div>
          <dt className="sr-only">Location</dt>
          <dd className="m-0">{sponsor.location || "Location not stated"}{extras}</dd>
        </div>
        <div className="inline-flex items-center gap-1">
          <dt className="sr-only">Salary</dt>
          <dd className="m-0">{sponsor.salary_display || "Salary not stated"}</dd>
          <InfoTip label={salary.label}>
            <span className="block">{salary.body}</span>
            <span className="mt-2 block">
              <a href={salary.href} target="_blank" rel="noreferrer">{salary.linkLabel}</a>
            </span>
          </InfoTip>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {sponsor.source}
        </span>
        {sponsor.url ? (
          <motion.a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="cta-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex", alignItems: "center", minHeight: 34,
              padding: "0 0.875rem", fontSize: "0.8125rem", fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Apply
          </motion.a>
        ) : null}
      </div>
    </motion.article>
  );
}
