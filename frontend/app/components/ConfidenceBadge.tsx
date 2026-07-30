"use client";

import { Check } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import InfoTip from "./InfoTip";
import { VISA_CONTENT } from "@/lib/visa-content";

type Confidence = "verified" | "likely" | "possible" | string;

export default function ConfidenceBadge({
  confidence,
  matchScore,
  source,
  showTip = true,
}: {
  confidence?: Confidence | null;
  matchScore?: number | null;
  source?: string;
  showTip?: boolean;
}) {
  const tip = VISA_CONTENT.confidenceTiers;
  const scoreLabel =
    matchScore != null && confidence !== "verified"
      ? ` · ${matchScore}% name match`
      : "";

  let chip: ReactNode;
  if (confidence === "verified") {
    chip = (
      <span className="inline-flex items-center gap-1 rounded-full bg-signal px-2.5 py-1 text-xs font-semibold text-white">
        <Check weight="bold" size={12} aria-hidden />
        Verified sponsor
      </span>
    );
  } else if (confidence === "possible") {
    chip = (
      <span className="inline-flex items-center rounded-full border border-dashed border-muted px-2.5 py-1 text-xs font-semibold text-muted">
        Possible sponsor{scoreLabel}
      </span>
    );
  } else {
    chip = (
      <span className="inline-flex items-center rounded-full border border-navy px-2.5 py-1 text-xs font-semibold text-navy">
        Likely sponsor{scoreLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {chip}
      {showTip ? (
        <InfoTip label={tip.label}>
          <span className="block">{tip.body}</span>
          {confidence === "verified" && source ? (
            <span className="mt-2 block text-[0.8rem] opacity-90">
              This role came from the company&apos;s {source} board.
            </span>
          ) : null}
          <span className="mt-2 block">
            <a href={tip.href}>{tip.linkLabel}</a>
          </span>
        </InfoTip>
      ) : null}
    </span>
  );
}
