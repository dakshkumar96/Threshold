"""
One-off. Import ATS slugs in bulk, keep UK sponsors, write to ats_map.db.
Run once. The lazy layer handles everything after this.
"""

from __future__ import annotations

import argparse
import csv
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from rapidfuzz import fuzz, process

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from api import ats_probe, ats_store  # noqa: E402
from api.uk_location import board_has_uk_jobs  # noqa: E402
from clean_names import clean_company_name  # noqa: E402
from name_verify import verify_identity  # noqa: E402

import pandas as pd  # noqa: E402

SUMMARY_PATH = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"
CSV_DIR = ROOT / "ats-scrapers" / "ats-companies"
MATCH_CUTOFF = 88
WORKERS = 6
STAGGER_S = 0.15
CHECKPOINT_EVERY = 200

PROVIDER_FILES = {
    "greenhouse": CSV_DIR / "greenhouse.csv",
    "ashby": CSV_DIR / "ashby.csv",
    "workable": CSV_DIR / "workable.csv",
    "recruitee": CSV_DIR / "recruitee.csv",
}


def load_register() -> tuple[list[str], dict[str, str]]:
    if not SUMMARY_PATH.exists():
        raise FileNotFoundError(f"Missing register parquet: {SUMMARY_PATH}")
    df = pd.read_parquet(SUMMARY_PATH, columns=["company_key", "example_name"])
    keys = [str(k) for k in df["company_key"].tolist() if str(k).strip()]
    lookup: dict[str, str] = {
        str(row.company_key): str(row.example_name or row.company_key)
        for row in df.itertuples(index=False)
    }
    return keys, lookup


def load_slugs(path: Path) -> list[str]:
    if not path.exists():
        print(f"  skip: {path} not found")
        return []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or "slug" not in reader.fieldnames:
            raise ValueError(f"{path} missing required 'slug' column")
        seen: set[str] = set()
        slugs: list[str] = []
        for row in reader:
            slug = (row.get("slug") or "").strip()
            if not slug or slug in seen:
                continue
            seen.add(slug)
            slugs.append(slug)
    return slugs


def live_tokens(db_path: Path = ats_store.DB_PATH) -> set[tuple[str, str]]:
    """{(provider, board_token)} already marked live — skip re-probing."""
    if not db_path.exists():
        return set()
    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT ats_provider, board_token FROM ats_map
            WHERE status='live' AND ats_provider IS NOT NULL AND board_token IS NOT NULL
            """
        ).fetchall()
    return {(str(p), str(t)) for p, t in rows}


def process_slug(
    ats: str,
    slug: str,
    reg_keys: list[str],
    key_to_display: dict[str, str] | None = None,
) -> dict | None:
    """Fetch board -> UK check -> register match -> identity verify. Returns dict or None."""
    result = ats_probe.fetch_board(ats, slug)
    if not result:
        return None

    jobs = result["jobs"]
    if not board_has_uk_jobs(jobs):
        return None

    published = result["published_name"] or slug
    query = clean_company_name(published) or published.lower().strip()
    match = process.extractOne(
        query,
        reg_keys,
        scorer=fuzz.token_set_ratio,
        score_cutoff=MATCH_CUTOFF,
    )
    if not match:
        return None

    company_key = match[0]

    # Extra identity gate: require verify_identity to pass, not just fuzzy score.
    # This prevents token_set_ratio subset matches (e.g. "blue" vs "Blue Nile = 100").
    register_display = (key_to_display or {}).get(company_key, company_key)
    verdict, id_score = verify_identity(register_display, published)
    if verdict != "pass":
        return None

    return {
        "company_key": company_key,
        "ats": ats,
        "token": slug,
        "published_name": published,
        "score": int(match[1]),
        "n_jobs": len(jobs),
    }


def run(
    ats: str,
    slugs: list[str],
    reg_keys: list[str],
    key_to_display: dict[str, str] | None = None,
    workers: int = WORKERS,
    delay: float = STAGGER_S,
) -> list[dict]:
    """Sliding-window submit so hits are upserted immediately (not after queueing all)."""
    hits: list[dict] = []
    errors = 0
    done = 0
    total = len(slugs)
    t0 = time.monotonic()
    pending = iter(slugs)
    # Keep a small in-flight buffer above worker count; stagger keeps RPS polite.
    in_flight_cap = max(workers * 2, workers)

    def _handle(fut, futures: dict) -> None:
        nonlocal done, errors
        done += 1
        if done % CHECKPOINT_EVERY == 0 or done == total:
            elapsed = time.monotonic() - t0
            print(
                f"  {ats}: {done}/{total} probed, {len(hits)} UK sponsors, "
                f"{errors} errors, {elapsed:.0f}s",
                flush=True,
            )
        try:
            r = fut.result()
        except Exception as exc:
            errors += 1
            if errors <= 5:
                print(f"  {ats} error on {futures[fut]}: {exc}", flush=True)
            r = None
        if not r:
            return
        hits.append(r)
        ats_store.upsert_hit(
            r["company_key"],
            r["ats"],
            r["token"],
            r["published_name"],
            r["score"],
            True,
        )
        print(
            f"  HIT {ats}/{r['token']} -> {r['company_key']} "
            f"(score={r['score']}, jobs={r['n_jobs']})",
            flush=True,
        )

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures: dict = {}

        def _submit_one() -> bool:
            try:
                s = next(pending)
            except StopIteration:
                return False
            futures[ex.submit(process_slug, ats, s, reg_keys, key_to_display)] = s
            time.sleep(delay)
            return True

        while len(futures) < in_flight_cap and _submit_one():
            pass

        while futures:
            for fut in as_completed(futures):
                _handle(fut, futures)
                del futures[fut]
                _submit_one()
                break  # re-enter as_completed with updated set

    return hits


def main() -> None:
    parser = argparse.ArgumentParser(description="One-off bulk ATS import")
    parser.add_argument(
        "--providers",
        nargs="+",
        choices=list(PROVIDER_FILES),
        default=list(PROVIDER_FILES),
        help="ATS providers to import (default: all four)",
    )
    parser.add_argument("--workers", type=int, default=WORKERS)
    parser.add_argument("--delay", type=float, default=STAGGER_S)
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional per-provider slug cap (0 = all)",
    )
    args = parser.parse_args()

    print(f"Loading register from {SUMMARY_PATH}", flush=True)
    reg_keys, key_to_display = load_register()
    print(f"Register keys: {len(reg_keys)}", flush=True)

    ats_store.init_db()
    seeded = ats_store.load_seed()
    print(f"Seed loaded (new rows): {seeded}", flush=True)
    print(f"DB stats before: {ats_store.stats()}", flush=True)

    already = live_tokens()
    print(f"Live tokens already cached: {len(already)}", flush=True)

    total_hits = 0
    for ats in args.providers:
        path = PROVIDER_FILES[ats]
        slugs = load_slugs(path)
        if not slugs:
            continue
        before = len(slugs)
        slugs = [s for s in slugs if (ats, s) not in already]
        skipped = before - len(slugs)
        if args.limit > 0:
            slugs = slugs[: args.limit]
        print(
            f"\n{ats}: {len(slugs)} slugs to probe "
            f"(skipped {skipped} already-live)",
            flush=True,
        )
        if not slugs:
            continue
        hits = run(ats, slugs, reg_keys, key_to_display, workers=args.workers, delay=args.delay)
        print(f"{ats}: {len(hits)} UK sponsors found", flush=True)
        total_hits += len(hits)
        # Refresh skip set so later providers in same process see new hits
        already |= {(h["ats"], h["token"]) for h in hits}

    print(f"\nTOTAL: {total_hits} verified UK sponsors written this run", flush=True)
    print(f"DB stats after: {ats_store.stats()}", flush=True)


if __name__ == "__main__":
    main()
