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

const NODES = [
  { name: "Reed", Icon: Briefcase, angle: -90 },
  { name: "Adzuna", Icon: Buildings, angle: -30 },
  { name: "Greenhouse", Icon: PlugsConnected, angle: 30 },
  { name: "Ashby", Icon: FileText, angle: 90 },
  { name: "Workable", Icon: SealCheck, angle: 150 },
  { name: "Home Office Register", Icon: House, angle: 210 },
] as const;

export default function IntegrationsHub() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const r = 150;

  return (
    <section className="section-orb" style={{ padding: "3rem 0 4rem" }} aria-labelledby="sources-heading">
      <div
        aria-hidden
        className="orb orb-sky"
        style={{
          width: 650,
          height: 650,
          top: "40%",
          right: "-18%",
          filter: "blur(60px)",
        }}
      />

      <div className="integrations-split">
        <div className="integrations-copy">
          <h2
            id="sources-heading"
            style={{
              margin: 0,
              fontSize: "clamp(1.85rem, 3.4vw, 2.5rem)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--color-ink)",
            }}
          >
            Connected to the sources that matter
          </h2>
          <p
            style={{
              margin: "0.85rem 0 0",
              maxWidth: "34ch",
              fontSize: "1.0625rem",
              lineHeight: 1.55,
              color: "var(--color-ink-soft)",
            }}
          >
            Live UK job boards and ATS feeds on one side. The Home Office sponsor register on the other. Matched in one search.
          </p>
          <ul className="integrations-points">
            <li>Reed and Adzuna for live ads</li>
            <li>Greenhouse, Ashby, and Workable for direct listings</li>
            <li>Home Office register for sponsor licences</li>
          </ul>
        </div>

        <div
          ref={ref}
          className="integrations-visual"
          aria-hidden
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0 }}
          >
            {NODES.map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              const x = cx + Math.cos(rad) * r;
              const y = cy + Math.sin(rad) * r;
              return (
                <motion.line
                  key={node.name}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="rgba(79,110,247,0.30)"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.5, delay: 0.2 * i, ease: "easeOut" }}
                />
              );
            })}
          </svg>

          <div
            className="glass-elevated"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 88,
              height: 88,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid transparent",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), linear-gradient(135deg, #818CF8, #4F6EF7, #7C3AED)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              zIndex: 2,
              textAlign: "center",
              padding: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--color-ink)", lineHeight: 1.2 }}>
              Sponsor Signal
            </span>
          </div>

          {NODES.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = 50 + Math.cos(rad) * 36;
            const y = 50 + Math.sin(rad) * 36;
            const Icon = node.Icon;
            return (
              <div
                key={node.name}
                className="glass-card"
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.65rem",
                  borderRadius: 999,
                  zIndex: 2,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={14} color="#4F6EF7" weight="duotone" />
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-ink)" }}>
                  {node.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
