"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { checkSponsor } from "@/lib/user-api";

type CheckResult = Awaited<ReturnType<typeof checkSponsor>>;

export default function SponsorshipCheckerPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await checkSponsor(q.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pb-20 pt-10 md:pt-14">
      <div className="motion-enter">
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
          Solutions
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--color-ink)", maxWidth: "18ch", lineHeight: 1.15 }}>
          Is this company on the sponsor register?
        </h1>
        <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
          Name matching is imperfect. A likely match is not proof they will hire you or
          assign a CoS. Always confirm on the official register when it matters.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 480 }} className="sm:flex-row">
        <label className="sr-only" htmlFor="company">Company name</label>
        <input
          id="company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Monzo Bank"
          required
          style={{
            flex: 1, minHeight: 48, borderRadius: "var(--radius-control)",
            border: "1px solid var(--color-line-hover)", background: "var(--color-paper)",
            padding: "0 1rem", fontSize: "1rem", color: "var(--color-ink)",
            boxSizing: "border-box", outline: "none",
            transition: "border-color 150ms, box-shadow 150ms",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--color-gold-dark)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.2)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--color-line-hover)"; e.target.style.boxShadow = "none"; }}
        />
        <button
          type="submit"
          disabled={loading || q.trim().length < 2}
          className="cta-primary"
          style={{ minHeight: 48, padding: "0 1.25rem", fontSize: "1rem", fontWeight: 500, border: 0, cursor: loading ? "wait" : "pointer", opacity: loading || q.trim().length < 2 ? 0.6 : 1 }}
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      {error ? (
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--color-warning)" }} role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div style={{ marginTop: "2rem", background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "1.5rem", maxWidth: 480 }}>
          {result.match ? (
            <>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
                {result.match.confidence} match
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "1.125rem", fontWeight: 500, color: "var(--color-ink)" }}>
                {result.match.register_name}
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-muted)" }}>
                Fuzzy {Math.round(result.match.fuzzy_score)} · verdict{" "}
                {result.match.verdict}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 500, color: "var(--color-ink)" }}>No confident match</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-soft)" }}>
                {result.note || "Try a fuller legal name."}
              </p>
            </>
          )}
          <a
            href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-block", marginTop: "1rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-link)" }}
          >
            Open the official register
          </a>
        </div>
      ) : null}

      <p style={{ marginTop: "2.5rem", marginBottom: 0, display: "flex", flexWrap: "wrap", gap: "1rem 1.5rem", fontSize: "0.9375rem" }}>
        <Link href="/#solutions" style={{ fontWeight: 500, color: "var(--color-link)" }}>All solutions</Link>
      </p>
    </main>
  );
}
