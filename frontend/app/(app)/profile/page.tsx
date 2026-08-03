"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  useUserApi,
  type SavedSearch,
  type UserPreferences,
} from "@/lib/user-api";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", minHeight: 44, borderRadius: "var(--radius-control)",
  border: "1px solid var(--color-line-hover)", background: "var(--color-paper)",
  padding: "0 1rem", fontSize: "0.9375rem", color: "var(--color-ink)",
  boxSizing: "border-box", outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = "var(--color-gold-dark)";
  e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.2)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = "var(--color-line-hover)";
  e.target.style.boxShadow = "none";
}

export default function ProfilePage() {
  const api = useUserApi();
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [s, p] = await Promise.all([api.getSavedSearches(), api.getPreferences()]);
    setSaved(s);
    setPrefs(p);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSavePrefs(e: FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    setBusy(true);
    setMessage(null);
    const next = await api.putPreferences({
      default_experience: prefs.default_experience,
      locations: prefs.locations,
      email_alerts: prefs.email_alerts,
      cv_filename: prefs.cv_filename,
      is_new_entrant: prefs.is_new_entrant,
    });
    setBusy(false);
    if (next) {
      setPrefs(next);
      setMessage("Preferences saved.");
    } else {
      setMessage("Could not save preferences. Check the API and Clerk token config.");
    }
  }

  async function onDelete(id: number) {
    const ok = await api.deleteSavedSearch(id);
    if (ok) setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <main style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-line)", marginBottom: "2.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.875rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)" }}>
          Profile
        </h1>
        <p style={{ margin: "0.625rem 0 0", maxWidth: "55ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
          Saved searches, preferences, and CV notes. Application tracking is coming later.
        </p>
      </div>

      {/* Saved searches */}
      <section style={{ marginBottom: "2.5rem" }} aria-labelledby="saved">
        <h2 id="saved" style={{ margin: "0 0 1rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Saved searches
        </h2>
        {saved.length === 0 ? (
          <div>
            <p style={{ color: "var(--color-muted)", fontSize: "0.9375rem", margin: 0, maxWidth: "48ch", lineHeight: 1.55 }}>
              You have not saved any searches yet. Run a search and click the bookmark icon on any result to save it here.
            </p>
            <Link
              href="/search"
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: "0.85rem",
                background: "transparent",
                border: "1px solid rgba(79,110,247,0.30)",
                color: "#4F6EF7",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Search a role now
            </Link>
          </div>
        ) : (
          <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {saved.map((s, i) => (
                <li
                  key={s.id}
                  style={{
                    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                    gap: "0.75rem", padding: "1rem 1.25rem",
                    borderBottom: i < saved.length - 1 ? "1px solid var(--color-line)" : "none",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: "var(--color-ink)", fontSize: "0.9375rem" }}>{s.role}</p>
                    <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      {s.experience || "any level"}
                      {s.min_salary != null ? ` · min £${s.min_salary}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link
                      href={`/search?role=${encodeURIComponent(s.role)}${s.experience ? `&experience=${s.experience}` : ""}`}
                      className="cta-primary"
                      style={{ display: "inline-flex", alignItems: "center", minHeight: 34, padding: "0 0.875rem", fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none" }}
                    >
                      Run
                    </Link>
                    <button
                      type="button"
                      onClick={() => void onDelete(s.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", minHeight: 34,
                        borderRadius: "var(--radius-control)", border: "1px solid var(--color-line)",
                        padding: "0 0.875rem", fontSize: "0.8125rem", fontWeight: 500,
                        color: "var(--color-ink-soft)", background: "transparent", cursor: "pointer",
                        transition: "border-color 150ms, color 150ms",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Preferences */}
      <section style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)", marginBottom: "2.5rem" }} aria-labelledby="prefs">
        <h2 id="prefs" style={{ margin: "0 0 1.25rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Preferences
        </h2>
        <form onSubmit={onSavePrefs} style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="exp" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
              Default experience
            </label>
            <select
              id="exp"
              value={prefs?.default_experience || "mid"}
              onChange={(e) =>
                setPrefs((p) =>
                  p
                    ? { ...p, default_experience: e.target.value }
                    : { default_experience: e.target.value, locations: "", email_alerts: false, cv_filename: null },
                )
              }
              style={{ ...INPUT_STYLE }}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="any">Any level</option>
              <option value="graduate">Graduate / entry</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / principal</option>
            </select>
          </div>

          <div>
            <label htmlFor="loc" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
              Location preferences
            </label>
            <input
              id="loc"
              value={prefs?.locations || ""}
              onChange={(e) =>
                setPrefs((p) =>
                  p
                    ? { ...p, locations: e.target.value }
                    : { default_experience: "mid", locations: e.target.value, email_alerts: false, cv_filename: null },
                )
              }
              placeholder="e.g. London, Manchester, remote UK"
              style={INPUT_STYLE}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.9375rem", color: "var(--color-ink-soft)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={Boolean(prefs?.is_new_entrant)}
              onChange={(e) =>
                setPrefs((p) =>
                  p
                    ? { ...p, is_new_entrant: e.target.checked }
                    : {
                        default_experience: "mid",
                        locations: "",
                        email_alerts: false,
                        cv_filename: null,
                        is_new_entrant: e.target.checked,
                      },
                )
              }
              style={{ width: 16, height: 16, accentColor: "var(--color-gold)", cursor: "pointer" }}
            />
            New entrant salary rate (£33,400)
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.9375rem", color: "var(--color-ink-soft)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={Boolean(prefs?.email_alerts)}
              onChange={(e) =>
                setPrefs((p) =>
                  p
                    ? { ...p, email_alerts: e.target.checked }
                    : { default_experience: "mid", locations: "", email_alerts: e.target.checked, cv_filename: null },
                )
              }
              style={{ width: 16, height: 16, accentColor: "var(--color-gold)", cursor: "pointer" }}
            />
            Email me when saved searches have new matches (delivery not live yet)
          </label>

          <div>
            <label htmlFor="cvname" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
              Last CV filename note
            </label>
            <input
              id="cvname"
              value={prefs?.cv_filename || ""}
              onChange={(e) =>
                setPrefs((p) =>
                  p
                    ? { ...p, cv_filename: e.target.value }
                    : { default_experience: "mid", locations: "", email_alerts: false, cv_filename: e.target.value },
                )
              }
              placeholder="e.g. daksh-cv-2026.pdf"
              style={INPUT_STYLE}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <p style={{ margin: "0.375rem 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
              We do not store the file here. Re-upload on search when you want a fresh CV review.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <button
              type="submit"
              disabled={busy}
              className="cta-primary"
              style={{ minHeight: 44, padding: "0 1.25rem", fontSize: "0.9375rem", fontWeight: 500, border: 0, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "Saving…" : "Save preferences"}
            </button>
            {message ? <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-ink-soft)" }}>{message}</p> : null}
          </div>
        </form>
      </section>

      {/* Application tracker */}
      <section style={{ paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }} aria-labelledby="tracker">
        <h2 id="tracker" style={{ margin: "0 0 1rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--color-ink)" }}>
          Application tracker
        </h2>
        <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.5rem" }}>
          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-ink)", fontSize: "0.9375rem" }}>Coming soon</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--color-ink-soft)", lineHeight: 1.6 }}>
            A simple board for Applied / Interview / Offer will land in a later release.
          </p>
        </div>
      </section>
    </main>
  );
}
