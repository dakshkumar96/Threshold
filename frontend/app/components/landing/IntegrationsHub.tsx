"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Buildings,
  Briefcase,
  FileText,
  House,
  PlugsConnected,
  SealCheck,
} from "@phosphor-icons/react";

/** Even 60° steps from top (−90° = 12 o’clock in SVG polar). */
const NODES = [
  { name: "Reed", short: "Reed", Icon: Briefcase, angle: -90 },
  { name: "Adzuna", short: "Adzuna", Icon: Buildings, angle: -30 },
  { name: "Greenhouse", short: "Greenhouse", Icon: PlugsConnected, angle: 30 },
  { name: "Ashby", short: "Ashby", Icon: FileText, angle: 90 },
  { name: "Workable", short: "Workable", Icon: SealCheck, angle: 150 },
  { name: "Home Office Register", short: "Home Office", Icon: House, angle: 210 },
] as const;

/** Shared viewBox + layout radii: one coordinate system for arrows + boxes. */
const SIZE = 460;
const CX = SIZE / 2;
const CY = SIZE / 2;
const HUB_R = 46;
/** Line starts just outside hub ring */
const R_LINE_START = HUB_R + 12;
/** Arrow tip lands here */
const R_ARROW_TIP = 148;
/**
 * Pill centers sit just past the tip so each tip meets the inner edge of the pill
 * (~18px ≈ half of 36px pill height along the radius).
 */
const R_NODE = R_ARROW_TIP + 22;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * radius,
    y: CY + Math.sin(rad) * radius,
  };
}

export default function IntegrationsHub() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <section className="section-dark-bg" aria-labelledby="sources-heading">
      <div className="section-dark-orb-left" aria-hidden />
      <div className="section-dark-orb-right" aria-hidden />
      <div className="section-dark-dots" aria-hidden />

      <div className="section-inner">
        <div className="integrations-split">
          <div className="integrations-copy">
            <h2 id="sources-heading" className="integrations-copy__title">
              Connected to the sources that matter
            </h2>
            <p className="integrations-copy__body">
              Live UK job boards and ATS feeds on one side. The Home Office sponsor register on the other. Matched in one search.
            </p>
            <ul className="integrations-points">
              <li>Reed and Adzuna for live ads</li>
              <li>Greenhouse, Ashby, and Workable for direct listings</li>
              <li>Home Office register for sponsor licences</li>
            </ul>
          </div>

          <div ref={ref} className="integrations-visual" aria-hidden>
            <svg
              className="integrations-visual__svg"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker
                  id="int-arrow-tip"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="4.5"
                  markerHeight="4.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 1 L 9 5 L 0 9 Z" fill="rgba(165,180,252,0.55)" />
                </marker>
              </defs>

              <circle
                cx={CX}
                cy={CY}
                r={R_ARROW_TIP}
                fill="none"
                stroke="rgba(165,180,252,0.1)"
                strokeWidth={1}
                strokeDasharray="3 7"
              />

              {NODES.map((node, i) => {
                const a = polar(node.angle, R_LINE_START);
                const b = polar(node.angle, R_ARROW_TIP);
                return (
                  <motion.line
                    key={node.name}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(165,180,252,0.35)"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    markerEnd="url(#int-arrow-tip)"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.08 * i }}
                  />
                );
              })}
            </svg>

            {NODES.map((node, i) => {
              const p = polar(node.angle, R_NODE);
              const Icon = node.Icon;
              return (
                /* Slot owns position; motion only scales the pill (no transform collision). */
                <div
                  key={node.name}
                  className="integration-node-slot"
                  style={{
                    left: `${(p.x / SIZE) * 100}%`,
                    top: `${(p.y / SIZE) * 100}%`,
                  }}
                  title={node.name}
                >
                  <motion.div
                    className="integration-node-dark"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 22,
                      delay: 0.08 * i + 0.35,
                    }}
                  >
                    <Icon size={14} color="rgba(165,180,252,0.95)" weight="duotone" />
                    <span>{node.short}</span>
                  </motion.div>
                </div>
              );
            })}

            <div className="integration-hub-dark">
              <span>Threshold</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
