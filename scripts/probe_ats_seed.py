"""One-off probe of ATS seed slug candidates. Writes data/ats_seed.json (hits only)."""

from __future__ import annotations

import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "ats_seed.json"
UA = {"User-Agent": "Threshold/1.0 (+https://threshold.local)"}
TIMEOUT = 8

# (company_key, published_name, [slug candidates])
CANDIDATES = [
    ("monzo", "Monzo", ["monzo"]),
    ("wise", "Wise", ["wise", "transferwise"]),
    ("revolut", "Revolut", ["revolut"]),
    ("starling bank", "Starling Bank", ["starling", "starlingbank"]),
    ("checkout", "Checkout.com", ["checkout", "checkoutcom"]),
    ("gocardless", "GoCardless", ["gocardless"]),
    ("marshmallow", "Marshmallow", ["marshmallow"]),
    ("cleo", "Cleo", ["cleo", "meetcleo"]),
    ("tide", "Tide", ["tide"]),
    ("zilch", "Zilch", ["zilch"]),
    ("curve", "Curve", ["curve"]),
    ("zopa", "Zopa", ["zopa"]),
    ("oaknorth", "OakNorth", ["oaknorth"]),
    ("onfido", "Onfido", ["onfido"]),
    ("thought machine", "Thought Machine", ["thoughtmachine"]),
    ("zego", "Zego", ["zego"]),
    ("trainline", "Trainline", ["trainline", "thetrainline"]),
    ("skyscanner", "Skyscanner", ["skyscanner"]),
    ("deliveroo", "Deliveroo", ["deliveroo"]),
    ("just eat", "Just Eat", ["justeat"]),
    ("asos", "ASOS", ["asos"]),
    ("bumble", "Bumble", ["bumble"]),
    ("depop", "Depop", ["depop"]),
    ("moonpig", "Moonpig", ["moonpig"]),
    ("gousto", "Gousto", ["gousto"]),
    ("bloom and wild", "Bloom & Wild", ["bloomandwild"]),
    ("octopus energy", "Octopus Energy", ["octopusenergy", "octoenergy"]),
    ("ovo energy", "OVO Energy", ["ovoenergy"]),
    ("bulb", "Bulb", ["bulb"]),
    ("ocado technology", "Ocado Technology", ["ocadotechnology"]),
    ("sainsburys", "Sainsbury's", ["sainsburys"]),
    ("marks and spencer", "Marks and Spencer", ["marksandspencer"]),
    ("sky", "Sky", ["skyuk", "sky"]),
    ("channel 4", "Channel 4", ["channel4"]),
    ("guardian", "The Guardian", ["guardian", "theguardian"]),
    ("deloitte", "Deloitte", ["deloitte"]),
    ("pwc", "PwC", ["pwc"]),
    ("kpmg", "KPMG", ["kpmg"]),
    ("accenture", "Accenture", ["accenture"]),
    ("oliver wyman", "Oliver Wyman", ["oliverwyman"]),
    ("oxfam", "Oxfam", ["oxfam"]),
    ("save the children", "Save the Children", ["savethechildren"]),
    ("british red cross", "British Red Cross", ["britishredcross"]),
    ("stripe", "Stripe", ["stripe"]),
    ("notion", "Notion", ["notion"]),
    ("figma", "Figma", ["figma"]),
    ("datadog", "Datadog", ["datadog"]),
    ("cloudflare", "Cloudflare", ["cloudflare"]),
    ("spotify", "Spotify", ["spotify"]),
]

PREF = {"greenhouse": 0, "ashby": 1, "workable": 2, "recruitee": 3}


def _url(ats: str, slug: str) -> str:
    if ats == "greenhouse":
        return f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    if ats == "ashby":
        return f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    if ats == "workable":
        return f"https://www.workable.com/api/accounts/{slug}"
    return f"https://{slug}.recruitee.com/api/offers/"


def try_hit(ats: str, slug: str) -> tuple[bool, str | None]:
    try:
        r = requests.get(
            _url(ats, slug), headers=UA, timeout=TIMEOUT, allow_redirects=True
        )
        if r.status_code != 200:
            return False, None
        data = r.json()
        if ats == "greenhouse":
            jobs = data.get("jobs") or []
            name = (jobs[0].get("company_name") if jobs else None)
            return bool(jobs), name
        if ats == "ashby":
            jobs = data.get("jobs") if isinstance(data, dict) else data
            if not jobs:
                return False, None
            name = None
            if isinstance(data, dict):
                name = data.get("name") or data.get("apiName")
            return True, name
        if ats == "workable":
            jobs = data.get("jobs") or []
            return bool(jobs), data.get("name")
        offers = data.get("offers") or []
        return bool(offers), None
    except Exception:
        return False, None


def main() -> None:
    hits: dict[str, dict] = {}
    for key, pub, slugs in CANDIDATES:
        best = None
        for slug in slugs:
            for ats in ("greenhouse", "ashby", "workable", "recruitee"):
                ok, name = try_hit(ats, slug)
                time.sleep(0.25)
                print(f"{'HIT' if ok else 'miss':4} {ats:10} {slug:20} -> {key}")
                if not ok:
                    continue
                cand = {
                    "ats": ats,
                    "token": slug,
                    "published_name": name or pub,
                }
                if best is None or PREF[ats] < PREF[best["ats"]]:
                    best = cand
            if best and best["ats"] in ("greenhouse", "ashby"):
                break
        if best:
            hits[key] = best
            print(f"  KEEP {key}: {best}")
        else:
            print(f"  NONE {key}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(hits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("---")
    print(f"Wrote {len(hits)} hits to {OUT}")
    for k, v in sorted(hits.items()):
        print(f"  {k}: {v['ats']}/{v['token']}")


if __name__ == "__main__":
    main()
