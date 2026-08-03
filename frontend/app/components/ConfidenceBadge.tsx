"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Confidence = "verified" | "likely" | "possible" | string;

function tipFor(
  confidence?: Confidence | null,
  matchScore?: number | null,
): string {
  if (confidence === "verified") {
    return "Fetched from the company's own careers page via Greenhouse, Ashby, Workable or Recruitee. Employer identity is certain.";
  }
  if (confidence === "possible") {
    return "Weak name match or recruitment agency posting. The true employer identity is not confirmed.";
  }
  const score =
    matchScore != null && Number.isFinite(matchScore)
      ? `${Math.round(matchScore)}`
      : "high";
  return `Employer name matched to the sponsor register at ${score}% confidence. Accurate in about 59 of 100 cases in manual tests.`;
}

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
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const scoreLabel =
    matchScore != null && confidence !== "verified"
      ? ` · ${matchScore}% name match`
      : "";

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function show() {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setOpen(true);
  }

  function hide() {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 100);
  }

  let chip: ReactNode;
  if (confidence === "verified") {
    chip = (
      <span className="badge-glass badge-verified conf-badge-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
        ✓ Verified sponsor
      </span>
    );
  } else if (confidence === "possible") {
    chip = (
      <span className="badge-glass badge-possible conf-badge-pill inline-flex items-center rounded-full border-dashed px-2.5 py-1 text-[11px] font-medium">
        Possible sponsor{scoreLabel}
      </span>
    );
  } else {
    chip = (
      <span className="badge-glass badge-likely conf-badge-pill inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
        Likely sponsor{scoreLabel}
      </span>
    );
  }

  if (!showTip) {
    return <span className="inline-flex items-center gap-1.5">{chip}</span>;
  }

  return (
    <span
      className="conf-badge"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {chip}
      <span
        className="conf-badge__tip"
        data-open={open ? "true" : "false"}
        role="tooltip"
      >
        {tipFor(confidence, matchScore)}
        {confidence === "verified" && source
          ? ` This role came from the company's ${source} board.`
          : ""}
        <i className="conf-badge__arrow" aria-hidden />
      </span>
    </span>
  );
}
