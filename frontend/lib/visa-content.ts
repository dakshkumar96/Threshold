/**
 * Plain-English visa context for InfoTips.
 * Salary figures checked against GOV.UK Skilled Worker guidance.
 * Always check the linked official pages for your case.
 */
export const THRESHOLDS_AS_OF = "2026-07-30";

export const VISA_CONTENT = {
  sponsorLicence: {
    label: "Sponsor licence",
    body: "A sponsor licence lets a UK employer hire eligible workers on certain visas, including Skilled Worker. Being on the Home Office register means the company is licensed. It does not prove they will sponsor you for a specific role.",
    href: "https://www.gov.uk/uk-visa-sponsorship-employers",
    linkLabel: "GOV.UK guide to sponsoring a worker",
  },
  cos: {
    label: "Certificate of Sponsorship",
    body: "A Certificate of Sponsorship, or CoS, is an electronic record that a licensed sponsor gives you before you apply for a Skilled Worker visa. A licensed employer advertising a job does not mean a CoS is available for that vacancy.",
    href: "https://www.gov.uk/government/publications/workers-and-temporary-workers-guidance-for-sponsors-part-2-sponsor-a-worker",
    linkLabel: "GOV.UK guidance for sponsors",
  },
  salaryThreshold: {
    label: "Salary threshold",
    body: `For most Skilled Worker applications you must be paid the higher of two numbers. One is the general salary threshold for the route. The other is the going rate for your type of job. Some exceptions can lower the pay you need, but you still have to meet the rules for your situation. As of ${THRESHOLDS_AS_OF}, GOV.UK lists a general threshold of £41,700 a year for standard cases, or the going rate if that is higher. Check the current figures and your job code on GOV.UK before you rely on any number.`,
    href: "https://www.gov.uk/skilled-worker-visa/your-job",
    linkLabel: "GOV.UK Skilled Worker salary rules",
  },
  confidenceTiers: {
    label: "Confidence labels",
    body: "When we match a sponsor by company name only, we were right about 59 times in 100 in our manual tests. When we read the job straight from the company's own hiring board, we are certain who the employer is.",
    href: "/methodology",
    linkLabel: "How we score confidence",
  },
  licenceStability: {
    label: "Licence stability",
    body: "The labels Established, Moderate and Newly registered show how long we have seen the employer on the register in our archive. A longer time is a useful sign. It does not mean they are hiring from abroad or that they will keep the licence.",
    href: "/methodology",
    linkLabel: "Read the methodology",
  },
} as const;
