"""Record or check the golden file.

    python -m tests.golden.record              # write tests/golden/expected.json
    python -m tests.golden.record --check      # compare a fresh run with it
    python -m tests.golden.record --check --only analyze/cv_,input/   # a subset

The scenarios are split across worker processes. The "rate_limit" group needs
the limit set before the app is imported, so it always runs in its own process.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPECTED = Path(__file__).with_name("expected.json")


def run_all(only: tuple[str, ...] = (), workers: int | None = None) -> dict:
    workers = workers or max(1, min(6, (os.cpu_count() or 2) - 1))
    jobs = [(f"main-{i}", "main", f"{i}/{workers}") for i in range(workers)]
    if not only or any("rate_limit/".startswith(p) or p.startswith("rate_limit") for p in only):
        jobs.append(("rate", "rate_limit", "0/1"))

    results: dict = {}
    with tempfile.TemporaryDirectory() as tmp:
        procs = []
        for label, group, shard in jobs:
            out = Path(tmp) / f"{label}.json"
            cmd = [sys.executable, "-m", "tests.golden.record", "--group", group, "--shard", shard, "--out", str(out)]
            if only:
                cmd += ["--only", ",".join(only)]
            procs.append((label, out, subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)))
        for label, out, proc in procs:
            if proc.wait() != 0:
                raise RuntimeError(f"worker {label} failed (run it by hand to see the error)")
            results.update(json.loads(out.read_text(encoding="utf-8")))
    return results


def dump(data: dict) -> str:
    return json.dumps(data, indent=1, sort_keys=True, ensure_ascii=False) + "\n"


def comparable(data: dict) -> dict:
    """Drop details that depend on the FastAPI version, not on our code."""
    out = {}
    for name, rec in data.items():
        rec = dict(rec)
        if rec.get("status") == 422:
            detail = (rec.get("body") or {}).get("detail", [])
            rec["body"] = {"detail": [{"loc": d.get("loc"), "type": d.get("type")} for d in detail]}
        out[name] = rec
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--group")
    parser.add_argument("--shard", default="0/1")
    parser.add_argument("--out")
    parser.add_argument("--only", default="")
    parser.add_argument("--workers", type=int)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    sys.path.insert(0, str(ROOT))
    warnings.simplefilter("ignore")
    only = tuple(p for p in args.only.split(",") if p)

    if args.group:
        from tests.golden.harness import scenarios

        i, n = (int(x) for x in args.shard.split("/"))
        Path(args.out).write_text(dump(scenarios(args.group, (i, n), only)), encoding="utf-8")
        return 0

    fresh = run_all(only, args.workers)
    if args.check:
        expected = json.loads(EXPECTED.read_text(encoding="utf-8"))
        if only:
            expected = {k: v for k, v in expected.items() if any(k.startswith(p) for p in only)}
        old, new = comparable(expected), comparable(fresh)
        if old == new:
            print(f"golden: identical ({len(new)} scenarios)")
            return 0
        print("golden: DIFFERENT")
        for key in sorted(set(old) | set(new)):
            if old.get(key) != new.get(key):
                print("  changed scenario:", key)
        return 1
    EXPECTED.write_text(dump(fresh), encoding="utf-8")
    print(f"recorded {len(fresh)} scenarios -> {EXPECTED}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
