# DESIGN.md

## Verdict

**Ship.** Public landing plus signed-in SaaS shell: home dashboard, search/results, insights charts from register archive + last search, solutions guides and sponsorship checker, profile with saved searches. Warm paper theme; amber CTA; green for verified evidence. Clerk auth when keys are configured.

## Direction

- **Thesis:** Sponsor evidence as a calm signal desk; refuses the noisy job-board dashboard.
- **Own-world:** Warm off-white paper, near-black type, amber action, green only for confirmed evidence.
- **Story:** Landing for guests; home + search for members; guides and checker for the journey around search.
- **Stack:** Next 15 App Router, Clerk, Tailwind v4, Phosphor, Recharts on Insights only.


## Colour system

Tokens live in the `@theme` block of `frontend/app/globals.css`. Canvas `#f8f7f4`, cards `#ffffff`, ink `#0f1117`, body `#3d4152`. Amber (`#f5a623` and family) is the only action colour; green (`#0a6640` on `#d4f5e6`) means confirmed; yellow means uncertain; red is reserved for a genuine legal blocker.

Three spec values were adjusted to clear WCAG AA, since the amber family is too light to carry white or mid-grey text:

| Role | Spec | Shipped | Reason |
|---|---|---|---|
| Button label on amber | `#ffffff` | `#3a2400` | White on `#f5a623` computes to 2.0:1; no amber can carry white at AA |
| Inline link | `#d4860a` | `#8c5500` | 2.7:1 on the canvas, versus 5.8:1 shipped |
| Muted metadata | `#7a7f94` | `#6b7085` | 3.7:1 at the sizes it is used, versus 4.6:1 shipped |

Verified sponsor cards carry a 3px gradient left strip, painted into a transparent left border so the card radius clips it without `overflow: hidden` (which would clip InfoTip panels). Possible-tier badges add a dashed border so they separate from Likely without relying on two neighbouring yellows.

## Surfaces

### Search (`/`)
Asymmetric first viewport: brand + role question left, focused composer right (stacked on mobile). Experience select defaults to mid with Any level available. Salary under progressive disclosure; CV upload is crafted with a third-party LLM note. Loading cycles concrete copy instead of a spinner.

### Results (`/results`)
Header states how many licensed sponsors are hiring for the role. Sponsor cards lead; confidence tiers differ by treatment (green tint plus gradient strip / amber pill / dashed yellow pill). Skill roadmap is a numbered editorial sequence. CV feedback splits “Where you are now” and “What to build next”, with full report disclosed. Empty and missing-session states always offer a next action. Top companies and market skills sit below opportunities and roadmap. Recharts removed from the default results view.

## API

`experience_level` form field on `/analyze`. Classifier in `src/experience_level.py` labels graduate | junior | mid | senior | lead from title then description. Filter applies only to skill frequencies / CV match / LLM job subset; falls back to all jobs when fewer than 8 match. Response includes `experience_level_requested`, `experience_filter_applied`, `experience_jobs_count`, `experience_filter_note`.

## Visa content

`frontend/lib/visa-content.ts` explains licence, CoS, salary (higher of general threshold and going rate), confidence tiers, and licence stability. `THRESHOLDS_AS_OF` recorded when figures were checked against GOV.UK. InfoTip is keyboard and touch accessible.

## Finish notes

All five surfaces pass an automated AA text-contrast sweep against their computed backgrounds. The search page splits into two columns at `lg` rather than `md`, so the composer is never squeezed at tablet width.
