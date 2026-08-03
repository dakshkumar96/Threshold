"use client";

import { isAgencyCompany } from "@/lib/results-utils";

/** Amber recruiter warning. Hidden on verified ATS cards. */
export default function AgencyWarningChip({
  companyRaw,
  confidence,
}: {
  companyRaw?: string | null;
  confidence?: string | null;
}) {
  if (confidence === "verified") return null;
  if (!isAgencyCompany(companyRaw)) return null;

  return (
    <p className="agency-warning-chip" role="note">
      Posted by a recruiter on behalf of an unknown employer. The sponsor identity
      is uncertain.
    </p>
  );
}
