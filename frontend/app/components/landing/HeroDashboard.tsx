"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  ChartLineUp,
  MagnifyingGlass,
  SealCheck,
  TrendUp,
} from "@phosphor-icons/react";

const STATS = [
  {
    Icon: MagnifyingGlass,
    label: "Job ads scanned",
    value: "200",
    note: "in one search",
    tone: "blue" as const,
    badge: { text: "Example" },
  },
  {
    Icon: SealCheck,
    label: "Licensed sponsors",
    value: "47",
    note: "on the register",
    tone: "mint" as const,
    badge: { text: "Verified", Icon: CheckCircle },
  },
  {
    Icon: ChartLineUp,
    label: "Best match score",
    value: "72%",
    note: "Data Analyst",
    tone: "blue" as const,
    badge: { text: "Strong fit", Icon: TrendUp },
  },
];

export default function HeroDashboard() {
  return (
    <div className="hero-stats">
      {STATS.map((s, i) => {
        const Icon = s.Icon;
        const BadgeIcon = s.badge.Icon;
        return (
          <motion.div
            key={s.label}
            className={`hero-stat-card hero-stat-card--${s.tone}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.15 * i },
              y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 * i },
            }}
          >
            <Icon
              className="hero-stat-card__watermark"
              size={76}
              weight="fill"
              aria-hidden
            />
            <div className="hero-stat-card__head">
              <span className="hero-stat-card__icon">
                <Icon size={17} weight="bold" />
              </span>
              <span className="hero-stat-card__label">{s.label}</span>
            </div>
            <div className="hero-stat-card__row">
              <p className="hero-stat-card__value">{s.value}</p>
              <span className="hero-stat-card__note">{s.note}</span>
            </div>
            <span className="hero-stat-card__badge">
              {BadgeIcon ? <BadgeIcon size={11} weight="bold" /> : null}
              {s.badge.text}
            </span>
          </motion.div>
        );
      })}
      <p className="hero-stats__caption">
        Example numbers from one Data Analyst search. Yours depend on your role and CV.
      </p>
    </div>
  );
}
