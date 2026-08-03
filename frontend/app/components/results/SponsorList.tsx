"use client";

import { useMemo, useState } from "react";
import { Check, Circle, Question } from "@phosphor-icons/react";
import {
  confRank,
  confidenceCounts,
  overlapRatio,
  type Sponsor,
} from "@/lib/results-utils";
import LeanSponsorCard from "./LeanSponsorCard";

type ConfFilter = "verified" | "likely" | "possible";
type SortKey = "match" | "tenure" | "salary" | "confidence";

const PAGE = 20;

export default function SponsorList({
  sponsors,
  bookmarks,
  onBookmark,
  role,
  salaryThreshold,
  isNewEntrant,
}: {
  sponsors: Sponsor[];
  bookmarks: Set<string>;
  onBookmark: (url: string) => void;
  role?: string;
  salaryThreshold?: number | null;
  isNewEntrant?: boolean | null;
}) {
  const [conf, setConf] = useState<Set<ConfFilter>>(new Set());
  const [aboveOnly, setAboveOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("match");
  const [page, setPage] = useState(0);
  const counts = confidenceCounts(sponsors);
  const aboveCount = sponsors.filter((s) => s.salary_vs_threshold === "above").length;
  const savedCount = sponsors.filter((s) => s.url && bookmarks.has(s.url)).length;

  const filtered = useMemo(() => {
    let list = [...sponsors];
    if (conf.size > 0) {
      list = list.filter((s) => conf.has((s.sponsor_confidence || "possible") as ConfFilter));
    }
    if (aboveOnly) {
      list = list.filter((s) => s.salary_vs_threshold === "above");
    }
    if (savedOnly) {
      list = list.filter((s) => s.url && bookmarks.has(s.url));
    }
    list.sort((a, b) => {
      if (sort === "confidence") {
        return confRank(a.sponsor_confidence) - confRank(b.sponsor_confidence);
      }
      if (sort === "tenure") {
        return (b.licence_years ?? 0) - (a.licence_years ?? 0);
      }
      if (sort === "salary") {
        const sa = b.salary_max ?? b.salary_min ?? 0;
        const sb = a.salary_max ?? a.salary_min ?? 0;
        return sa - sb;
      }
      const o = overlapRatio(b) - overlapRatio(a);
      if (o !== 0) return o;
      return confRank(a.sponsor_confidence) - confRank(b.sponsor_confidence);
    });
    return list;
  }, [sponsors, conf, aboveOnly, savedOnly, sort, bookmarks]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  function toggleConf(c: ConfFilter) {
    setPage(0);
    setConf((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function clearConf() {
    setPage(0);
    setConf(new Set());
  }

  return (
    <section aria-label="All sponsors" className="sponsor-list">
      <div className="sponsor-list__head">
        <div>
          <h2 className="sponsor-list__title">All sponsor roles</h2>
          <p className="sponsor-list__sub">
            {filtered.length} of {sponsors.length} roles · filters combine with AND
            {role ? ` · ${role}` : ""}
          </p>
          <p className="sponsor-list__key" aria-label="Confidence icon key">
            <span className="sponsor-list__key-item" data-tone="verified">
              <i>
                <Check size={10} weight="bold" aria-hidden />
              </i>
              <strong>Verified</strong>
              <span>ATS careers page · identity certain</span>
            </span>
            <span className="sponsor-list__key-item" data-tone="likely">
              <i>
                <Circle size={7} weight="fill" aria-hidden />
              </i>
              <strong>Likely</strong>
              <span>Strong name match to the register</span>
            </span>
            <span className="sponsor-list__key-item" data-tone="possible">
              <i>
                <Question size={10} weight="bold" aria-hidden />
              </i>
              <strong>Possible</strong>
              <span>Weaker name match · check carefully</span>
            </span>
          </p>
        </div>
        <label className="sponsor-list__sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => {
              setPage(0);
              setSort(e.target.value as SortKey);
            }}
          >
            <option value="match">Best match</option>
            <option value="tenure">Licence tenure</option>
            <option value="salary">Salary</option>
            <option value="confidence">Confidence</option>
          </select>
        </label>
      </div>

      <div className="sponsor-list__filters">
        <button
          type="button"
          className="filter-pill"
          data-active={conf.size === 0 && !aboveOnly && !savedOnly ? "true" : "false"}
          onClick={() => {
            clearConf();
            setAboveOnly(false);
            setSavedOnly(false);
          }}
        >
          All ({sponsors.length})
        </button>
        {(
          [
            ["verified", "Verified", counts.verified],
            ["likely", "Likely", counts.likely],
            ["possible", "Possible", counts.possible],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            className="filter-pill"
            data-active={conf.has(id) ? "true" : "false"}
            onClick={() => toggleConf(id)}
          >
            {label} ({n})
          </button>
        ))}
        <button
          type="button"
          className="filter-pill"
          data-active={aboveOnly ? "true" : "false"}
          onClick={() => {
            setPage(0);
            setAboveOnly((v) => !v);
          }}
        >
          Above SW threshold ({aboveCount})
        </button>
        <button
          type="button"
          className="filter-pill"
          data-active={savedOnly ? "true" : "false"}
          onClick={() => {
            setPage(0);
            setSavedOnly((v) => !v);
          }}
        >
          Saved ({savedCount})
        </button>
      </div>

      {!sponsors.length ? (
        <div className="dash-card">
          <p className="m-0 text-sm text-ink-soft">
            No sponsors in this result set. Run a new search with a broader job title.
          </p>
        </div>
      ) : !slice.length ? (
        <div className="dash-card">
          <p className="m-0 text-sm text-ink-soft">
            No sponsors cleared the filter. Clear a pill or turn off the salary threshold filter.
          </p>
        </div>
      ) : (
        <div className="sponsor-list__rows">
          {slice.map((s, i) => (
            <div
              key={`${s.url || s.title}-list-${i}`}
              className="sponsor-list__row-wrap"
              data-group={(i + 1) % 5 === 0 ? "break" : undefined}
            >
              <LeanSponsorCard
                sponsor={s}
                bookmarked={Boolean(s.url && bookmarks.has(s.url))}
                onBookmark={() => s.url && onBookmark(s.url)}
                salaryThreshold={salaryThreshold}
                isNewEntrant={isNewEntrant}
              />
            </div>
          ))}
        </div>
      )}

      {filtered.length > PAGE ? (
        <div className="sponsor-list__pager">
          <button
            type="button"
            className="filter-pill"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <div className="sponsor-list__pages">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className="sponsor-list__page"
                data-active={page === i ? "true" : "false"}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="filter-pill"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
