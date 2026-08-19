"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/** Visual ring is 1.25× the design size; label stays at the design size. */
const RING_SCALE = 1.25;

/**
 * Circular match-score. Uses SVG <text> (not HTML overlay) so the label
 * is truly centered in the ring. Class prefix `ss-score-ring` avoids
 * clash with the marketing hero's static .score-ring styles.
 */
export default function ScoreRing({
  score,
  size = 72,
  showValue = true,
}: {
  score: number | null | undefined;
  size?: number;
  showValue?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true });

  // Layout box + arc use scaled size; type uses unscaled `size`
  const ringSize = Math.round(size * RING_SCALE);
  const stroke = ringSize < 56 ? 4 : 5;
  const clear = Math.max(10, Math.round(ringSize * 0.16));
  const radius = Math.max(10, ringSize / 2 - stroke / 2 - clear);
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score == null ? 0 : Math.round(Math.min(Math.max(score, 0), 100));
  const offset = circumference - (pct / 100) * circumference;
  // Font tracks design size only, not the 1.25 ring scale
  const fontSize = Math.max(12, Math.round(size * 0.25));

  const label = score == null ? "N/A" : `${pct}%`;

  return (
    <div
      ref={containerRef}
      className="ss-score-ring"
      style={{ width: ringSize, height: ringSize }}
      role="img"
      aria-label={score == null ? "Score not available" : `Match score ${pct} percent`}
    >
      <svg
        width={ringSize}
        height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        className="ss-score-ring__svg"
      >
        {/* Only the arc rotates; text stays upright and centered */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(99, 102, 241, 0.12)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={score == null ? "rgba(99, 102, 241, 0.2)" : "#4F6EF7"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={
              inView
                ? { strokeDashoffset: score == null ? circumference : offset }
                : {}
            }
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
          />
        </g>

        {showValue ? (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight={700}
            fill="var(--color-ink)"
            style={{
              fontFamily: "inherit",
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
