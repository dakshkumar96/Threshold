"use client";

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
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(29,184,116,0.3)] bg-signal-soft px-2.5 py-1 text-[11px] font-medium text-signal">
        ✓ Verified sponsor
      </span>
    );
  } else if (confidence === "possible") {
    chip = (
      <span className="inline-flex items-center rounded-full border border-dashed border-[rgba(146,97,10,0.4)] bg-warning-soft px-2.5 py-1 text-[11px] font-medium text-warning">
        Possible sponsor{scoreLabel}
      </span>
    );
  } else {
    chip = (
      <span className="inline-flex items-center rounded-full border border-[rgba(245,166,35,0.3)] bg-gold-pale px-2.5 py-1 text-[11px] font-medium text-gold-dark">
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
            <span className="mt-2 block text-[0.8rem] opacity-85">
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
