/**
 * Plain-English visa context for InfoTips.
 * Salary figures verified against GOV.UK Skilled Worker guidance.
 * Always check the linked official pages for your case.
 */
export const THRESHOLDS_AS_OF = "2026-07-30";

export const VISA_CONTENT = {
  sponsorLicence: {
    label: "Sponsor licence",
    body: "A sponsor licence lets a UK employer hire eligible workers on certain visas, including Skilled Worker. Being on the Home Office register means they are licensed; it does not prove they will sponsor you for a specific role.",
    href: "https://www.gov.uk/uk-visa-sponsorship-employers",
    linkLabel: "GOV.UK: sponsor a worker",
  },
  cos: {
    label: "Certificate of Sponsorship",
    body: "A Certificate of Sponsorship (CoS) is an electronic record an licensed sponsor assigns before you apply for a Skilled Worker visa. Seeing a licensed employer hiring does not mean a CoS is available for that vacancy.",
    href: "https://www.gov.uk/government/publications/workers-and-temporary-workers-guidance-for-sponsors-part-2-sponsor-a-worker/workers-and-temporary-workers-guidance-for-sponsors-part-2-sponsor-a-worker-accessible-version",
    linkLabel: "GOV.UK: sponsor a worker guidance",
  },
  salaryThreshold: {
    label: "Salary threshold",
    body: `For most Skilled Worker applications, you must be paid the higher of the route's general salary threshold and the occupation going rate for your job code. Exceptions and tradeable options can lower the cash floor, but you must still meet the rules for your situation. As of ${THRESHOLDS_AS_OF}, GOV.UK lists a general threshold of £41,700 a year for standard cases (or the going rate if higher). Confirm the current figures and your occupation code on GOV.UK before relying on any number.`,
    href: "https://www.gov.uk/skilled-worker-visa/your-job",
    linkLabel: "GOV.UK: Skilled Worker salary rules",
  },
  confidenceTiers: {
    label: "Confidence tiers",
    body: "Verified means the role came from the company's own supported job board, so employer identity is certain. Likely means a strong name match to the Home Office register (not certain). Possible means a weaker match or agency listing - treat it as a lead to check, not proof of sponsorship.",
    href: "/methodology",
    linkLabel: "How we score confidence",
  },
  licenceStability: {
    label: "Licence stability",
    body: "Licence bands (Established, Moderate, Newly registered) come from how long we have observed the employer on our register archive. Longer tenure is a useful signal, not a guarantee they are hiring internationally or will keep the licence.",
    href: "/methodology",
    linkLabel: "Methodology notes",
  },
} as const;
