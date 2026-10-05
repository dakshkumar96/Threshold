import insights from "@/data/insights.json";

/**
 * Facts about the Home Office sponsor register the site is built on, in one
 * place so every page says the same thing. Update REGISTER_EDITION whenever the
 * register data is refreshed.
 */
export const REGISTER_EDITION = "28 July 2026";

/** Licensed sponsors on that edition of the register (after tidying company names). */
export const CURRENT_SPONSORS = insights.headline.still_active;

/** Companies that were on an earlier snapshot since 2023 but are not on the latest one. */
export const SPONSORS_LEFT = insights.headline.exits_observed;

export const formatCount = (n: number) => n.toLocaleString("en-GB");
