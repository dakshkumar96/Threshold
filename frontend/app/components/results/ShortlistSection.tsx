"use client";

import { shortlistSponsors, type Sponsor } from "@/lib/results-utils";
import ShortlistCard from "./ShortlistCard";

export default function ShortlistSection({
  sponsors,
  bookmarks,
  onBookmark,
  onOpen,
  salaryThreshold,
  isNewEntrant,
}: {
  sponsors: Sponsor[];
  bookmarks: Set<string>;
  onBookmark: (url: string) => void;
  onOpen: (s: Sponsor) => void;
  salaryThreshold?: number | null;
  isNewEntrant?: boolean | null;
}) {
  const list = shortlistSponsors(sponsors, 5);

  if (!sponsors.length) {
    return (
      <section aria-label="Shortlist">
        <h2 className="mb-2 text-lg font-medium text-ink">Your shortlist</h2>
        <div className="dash-card">
          <p className="m-0 text-sm text-ink-soft">
            No sponsored roles cleared the first cut for this search. Try broadening role wording
            or location on a new search.
          </p>
        </div>
      </section>
    );
  }

  if (!list.length) {
    return (
      <section aria-label="Shortlist">
        <h2 className="mb-2 text-lg font-medium text-ink">Your shortlist</h2>
        <div className="dash-card">
          <p className="m-0 text-sm text-ink-soft">
            Roles listed for this search either sit below the general Skilled Worker salary floor
            or need closer inspection. Use the full list below.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Shortlist" className="shortlist-section">
      <div className="shortlist-section__head">
        <div>
          <h2>Top 5 roles</h2>
          <p>Ranked by confidence, salary floor, CV overlap, and licence tenure.</p>
        </div>
      </div>
      <div className="shortlist-scroll">
        {list.map((s, i) => (
          <ShortlistCard
            key={`${s.url || s.title}-${i}`}
            rank={i + 1}
            sponsor={s}
            bookmarked={Boolean(s.url && bookmarks.has(s.url))}
            onBookmark={() => s.url && onBookmark(s.url)}
            onOpen={() => onOpen(s)}
            salaryThreshold={salaryThreshold}
            isNewEntrant={isNewEntrant}
          />
        ))}
      </div>
    </section>
  );
}
