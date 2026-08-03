# DESIGN.md

## Verdict

**Ship.** Public landing plus signed-in SaaS shell: home dashboard, search/results, insights charts from register archive + last search, solutions guides and sponsorship checker, profile with saved searches. Soft indigo–lavender glass theme; indigo CTA; green for verified evidence. Clerk auth when keys are configured.

## Direction

- **Thesis:** Sponsor evidence as a calm signal desk; refuses the noisy job-board dashboard.
- **Own-world:** Soft blue-to-lavender page gradient, frosted glass cards, deep indigo type, indigo action, green only for confirmed evidence. Landing mirrors a SaaS reference composition: floating hero dashboard mockup, icon feature grid, chart “metric moment”, bento demos, integrations hub — all fed by existing copy and `insights.json`, never invented testimonials/pricing/partners.
- **Story:** Landing for guests; signed-in app shell with glass sidebar + top bar; home + search for members; guides and checker for the journey around search.
- **Stack:** Next 15 App Router, Clerk, Tailwind v4, Phosphor, Recharts, Framer Motion.


## Colour system

Tokens live in the `@theme` block of `frontend/app/globals.css`. Page canvas is a fixed full-scroll gradient (`#EEF2FF` → `#E8F4FD` → `#F0EEFF` → `#EDF5FF` → `#F5F0FF`). Cards use frosted glass (`rgba(255,255,255,0.55)` + `backdrop-filter: blur(16px)`). Ink `#1E1B4B`, body `#374151`, muted `#6B7280`. Indigo (`#4F6EF7` and family) is the action colour — legacy token names `gold*` still alias to indigo so call sites remapped without a rename sweep. Green (`#065F46` on `#D1FAE5`) means confirmed; yellow means uncertain; red is reserved for a genuine legal blocker.

Secondary accent violet `#7C3AED` is used for hover highlights and the comparison-column gradient edge. CTA labels ship as white on the indigo gradient (AA on the deep stop).

Verified sponsor cards carry a 3px green gradient left strip, painted into a transparent left border so the card radius clips it without `overflow: hidden` on `.sponsor-card` (which would clip InfoTip panels). Glass shimmer `::after` is therefore limited to non-sponsor cards. Possible-tier badges keep a dashed border; all confidence badges use a light glass treatment (0.80 opacity + 4px blur).

## Surfaces

### Search (`/`)
Asymmetric first viewport: brand + role question left, focused composer right (stacked on mobile). Experience select defaults to mid with Any level available. Salary under progressive disclosure; CV upload is crafted with a third-party LLM note. Loading cycles concrete copy instead of a spinner.

### Results (`/results`)
Header states how many licensed sponsors are hiring for the role. Sponsor cards lead; confidence tiers differ by treatment (green tint plus gradient strip / indigo likely pill / dashed yellow possible pill). Skill roadmap is a numbered editorial sequence. CV feedback splits “Where you are now” and “What to build next”, with full report disclosed. Empty and missing-session states always offer a next action. Top companies and market skills sit below opportunities and roadmap. Recharts removed from the default results view.

## API

`experience_level` form field on `/analyze`. Classifier in `src/experience_level.py` labels graduate | junior | mid | senior | lead from title then description. Filter applies only to skill frequencies / CV match / LLM job subset; falls back to all jobs when fewer than 8 match. Response includes `experience_level_requested`, `experience_filter_applied`, `experience_jobs_count`, `experience_filter_note`.

## Visa content

`frontend/lib/visa-content.ts` explains licence, CoS, salary (higher of general threshold and going rate), confidence tiers, and licence stability. `THRESHOLDS_AS_OF` recorded when figures were checked against GOV.UK. InfoTip is keyboard and touch accessible.

## Finish notes

Landing adds soft colour orbs with light scroll parallax behind major sections; marquee and footer use deep indigo gradients. The search page splits into two columns at `lg` rather than `md`, so the composer is never squeezed at tablet width.
