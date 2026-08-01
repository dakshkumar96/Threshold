"""Fit Kaplan-Meier / Cox models and export 0–100 stability scores."""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.statistics import multivariate_logrank_test

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from survival_prep import OUT_SURVIVAL, build_survival_table

OUT_SCORES = ROOT / "data" / "processed" / "sponsor_retention_scores.parquet"
FIG_DIR = ROOT / "data" / "processed" / "figures"
EXPORT_DIR = ROOT / "data" / "processed" / "dashboard_exports"

STABILITY_LABEL = (
    "relative licence stability score — not a guarantee of active hiring"
)


def prepare_cox_frame(surv: pd.DataFrame) -> pd.DataFrame:
    df = surv.copy()
    df["duration_days"] = df["duration_days"].clip(lower=1)
    df["rating_A"] = (df["rating"] == "A").astype(int)
    region_dummies = pd.get_dummies(df["region"], prefix="region", drop_first=True)
    return pd.concat(
        [
            df[
                [
                    "company_key",
                    "duration_days",
                    "event",
                    "still_active",
                    "rating",
                    "region",
                    "rating_A",
                ]
            ],
            region_dummies,
        ],
        axis=1,
    )


def _save_km_overall(surv: pd.DataFrame, path: Path) -> float | None:
    km = KaplanMeierFitter()
    dur = surv["duration_days"].clip(lower=1)
    km.fit(dur, surv["event"], label="overall")
    fig, ax = plt.subplots(figsize=(8, 5))
    km.plot_survival_function(ax=ax, ci_show=True)
    ax.set_title("Kaplan–Meier: UK Skilled Worker sponsor licence retention")
    ax.set_xlabel("Days since first seen in our snapshots")
    ax.set_ylabel("Survival probability")
    ax.grid(True, alpha=0.3)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    med = km.median_survival_time_
    if med != med or med in (float("inf"), float("-inf")):  # NaN or not reached
        return None
    return float(med)


def _save_km_by_region(surv: pd.DataFrame, path: Path) -> None:
    fig, ax = plt.subplots(figsize=(9, 5))
    km = KaplanMeierFitter()
    for region, chunk in surv.groupby("region"):
        if len(chunk) < 50:
            continue
        km.fit(
            chunk["duration_days"].clip(lower=1),
            chunk["event"],
            label=str(region),
        )
        km.plot_survival_function(ax=ax, ci_show=False)
    ax.set_title("Kaplan–Meier by region (no sector column on register)")
    ax.set_xlabel("Days")
    ax.set_ylabel("Survival probability")
    ax.grid(True, alpha=0.3)
    ax.legend(loc="best", fontsize=8)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def _stability_scores(hazard: pd.Series) -> pd.Series:
    """Invert hazard and min–max normalise to 0–100 (higher = more stable)."""
    inv = 1.0 / hazard.clip(lower=1e-9)
    lo, hi = float(inv.min()), float(inv.max())
    if hi <= lo:
        return pd.Series(np.full(len(inv), 50.0), index=inv.index)
    return 100.0 * (inv - lo) / (hi - lo)


def _export_dashboard_csvs(surv: pd.DataFrame, scores: pd.DataFrame) -> dict:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    # Snapshot growth needs panel — approximate from summary first_seen counts
    by_region = (
        surv.groupby("region")
        .agg(n=("event", "size"), exit_rate=("event", "mean"))
        .reset_index()
    )
    by_region.to_csv(EXPORT_DIR / "sponsors_by_region.csv", index=False)

    # Headline: first seen in 2023 that later exited
    fs = pd.to_datetime(surv["first_seen"])
    cohort_2023 = surv[fs.dt.year == 2023]
    exited_share = float(cohort_2023["event"].mean()) if len(cohort_2023) else None
    headline = pd.DataFrame(
        [
            {
                "metric": "pct_2023_first_seen_later_exited",
                "value": None if exited_share is None else round(100 * exited_share, 1),
                "n": len(cohort_2023),
                "note": "Among companies first appearing in our 2023 snapshots",
            }
        ]
    )
    headline.to_csv(EXPORT_DIR / "headline_stats.csv", index=False)
    scores[["company_key", "stability_score", "region", "rating", "still_active"]].to_csv(
        EXPORT_DIR / "stability_scores_sample.csv",
        index=False,
    )
    # keep file smaller for Tableau — top 5k by random sample
    scores.sample(n=min(5000, len(scores)), random_state=42)[
        ["company_key", "stability_score", "region", "rating", "still_active", "duration_days"]
    ].to_csv(EXPORT_DIR / "stability_scores_sample.csv", index=False)
    return {"pct_2023_first_seen_exited": exited_share}


def run_survival() -> dict:
    """
    Left truncation: companies already licensed before our earliest snapshot
    appear with first_seen = first archive date we hold; tenure is left-truncated.
    Documented as limitation — not corrected.
    """
    surv = build_survival_table()
    OUT_SURVIVAL.parent.mkdir(parents=True, exist_ok=True)
    surv.to_parquet(OUT_SURVIVAL, index=False)

    FIG_DIR.mkdir(parents=True, exist_ok=True)
    median = _save_km_overall(surv, FIG_DIR / "km_overall.png")
    _save_km_by_region(surv, FIG_DIR / "km_by_region.png")

    results: dict = {
        "n_companies": len(surv),
        "n_events": int(surv["event"].sum()),
        "n_censored": int((surv["event"] == 0).sum()),
        "km_median_days": median,
        "left_truncation_note": (
            "Tenure measured from first snapshot we observe; pre-period licensing "
            "is left-truncated and not corrected."
        ),
        "stability_label": STABILITY_LABEL,
    }

    lr_rating = multivariate_logrank_test(
        surv["duration_days"].clip(lower=1), surv["rating"], surv["event"]
    )
    results["logrank_rating_p"] = float(lr_rating.p_value)
    lr_region = multivariate_logrank_test(
        surv["duration_days"].clip(lower=1), surv["region"], surv["event"]
    )
    results["logrank_region_p"] = float(lr_region.p_value)

    cox_df = prepare_cox_frame(surv)
    feature_cols = ["rating_A"] + [c for c in cox_df.columns if c.startswith("region_")]
    model_df = cox_df[["duration_days", "event"] + feature_cols].astype(float)

    cph = CoxPHFitter()
    cph.fit(model_df, duration_col="duration_days", event_col="event")
    results["cox_summary"] = cph.summary

    hazard = cph.predict_partial_hazard(model_df)
    cox_df["retention_risk_score"] = hazard.values
    cox_df["stability_score"] = _stability_scores(hazard).values.round(1)

    scores = cox_df[
        [
            "company_key",
            "duration_days",
            "event",
            "still_active",
            "rating",
            "region",
            "retention_risk_score",
            "stability_score",
        ]
    ].copy()
    scores["stability_label"] = STABILITY_LABEL
    scores.to_parquet(OUT_SCORES, index=False)

    # Exports before PH check — check_assumptions can be very slow on full n
    headline = _export_dashboard_csvs(surv, scores)
    results.update(headline)

    try:
        # Refit on a sample — check_assumptions expects residuals aligned to the fit
        ph_sample = model_df.sample(n=min(15000, len(model_df)), random_state=42)
        cph_ph = CoxPHFitter()
        cph_ph.fit(ph_sample, duration_col="duration_days", event_col="event")
        cph_ph.check_assumptions(ph_sample, p_value_threshold=0.05, show_plots=False)
        results["ph_check"] = "ran_without_hard_fail_on_sample"
    except Exception as exc:
        results["ph_check"] = f"violations_or_warnings: {exc}"

    print("Companies:", results["n_companies"])
    print("Events:", results["n_events"], "Censored:", results["n_censored"])
    print(
        "KM median days:",
        results["km_median_days"]
        if results["km_median_days"] is not None
        else "not reached (>50% still active)",
    )
    print("Log-rank rating p:", results["logrank_rating_p"])
    print("Log-rank region p:", results["logrank_region_p"])
    print("PH check:", results["ph_check"])
    if results.get("pct_2023_first_seen_exited") is not None:
        print(
            "2023 first-seen later exited %:",
            round(100 * results["pct_2023_first_seen_exited"], 1),
        )
    print(cph.summary[["coef", "exp(coef)", "p", "coef lower 95%", "coef upper 95%"]])
    print("Saved:", OUT_SURVIVAL)
    print("Saved:", OUT_SCORES)
    print("Figures:", FIG_DIR)
    return results


if __name__ == "__main__":
    try:
        run_survival()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
