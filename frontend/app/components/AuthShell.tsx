import Link from "next/link";
import type { ReactNode } from "react";
import { CURRENT_SPONSORS, formatCount } from "@/lib/register";
import Logo from "./Logo";

const POINTS = [
  `${formatCount(CURRENT_SPONSORS)} licensed sponsors on the latest register`,
  "CV match score against real ads",
  "Verified confidence tiers",
  "Priority skill gap roadmap",
] as const;

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`auth-brand${light ? " auth-brand--light" : ""}`}>
      <Logo height={light ? 28 : 22} tone={light ? "light" : "dark"} />
      <span>Threshold</span>
    </Link>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-shell-card">
        <aside className="auth-panel">
          <BrandMark light />

          <div className="auth-panel__body">
            <h1>UK jobs that can actually sponsor you.</h1>
            <ul>
              {POINTS.map((item) => (
                <li key={item}>
                  <span aria-hidden>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-panel__foot">
            Built by an international student, for international students.
          </p>
        </aside>

        <div className="auth-form">
          <div className="auth-form__mobile-brand">
            <BrandMark />
          </div>
          <div className="auth-form__inner">
            <div className="auth-form__heading">
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export const clerkAuthAppearance = {
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#1d4ed8",
    colorText: "#0f172a",
    colorTextSecondary: "#6B7280",
    colorBackground: "transparent",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#0f172a",
    borderRadius: "12px",
    fontFamily: "var(--font-body)",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "!w-full !shadow-none !border-0 !bg-transparent !rounded-none",
    card: "!shadow-none !border-0 !bg-transparent !p-0 !w-full !gap-5 !rounded-none",
    main: "!gap-5",
    header: "!hidden",
    headerTitle: "!hidden",
    headerSubtitle: "!hidden",
    socialButtonsBlockButton:
      "!min-h-11 !rounded-xl !border !border-[rgba(29, 78, 216,0.18)] !bg-[rgba(238,242,255,0.65)] hover:!bg-[rgba(238,242,255,0.95)] !shadow-none",
    socialButtonsBlockButtonText: "!text-[var(--color-ink)] !font-medium !text-[0.9375rem]",
    dividerLine: "!bg-[rgba(29, 78, 216,0.15)]",
    dividerText: "!text-[var(--color-muted)] !text-xs !uppercase !tracking-wide",
    formFieldLabel: "!text-[var(--color-ink-soft)] !text-[0.8125rem] !font-medium",
    formFieldInput:
      "!rounded-xl !border !border-[rgba(29, 78, 216,0.2)] !bg-white !min-h-11 !px-4 !text-[var(--color-ink)] focus:!border-[#1d4ed8] focus:!shadow-[0_0_0_3px_rgba(29, 78, 216,0.2)]",
    formButtonPrimary:
      "!min-h-11 !rounded-xl !bg-[linear-gradient(135deg,#3b82f6_0%,#1d4ed8_50%,#1e40af_100%)] !shadow-[0_4px_16px_rgba(29, 78, 216,0.35)] hover:!shadow-[0_6px_24px_rgba(29, 78, 216,0.45)] !text-white !font-medium",
    footer: "!bg-transparent !shadow-none !border-0",
    footerAction: "!bg-transparent",
    footerActionLink: "!text-[#1d4ed8] !font-medium hover:!text-[#1e40af]",
    identityPreviewEditButton: "!text-[#1d4ed8]",
    formFieldAction: "!text-[#1d4ed8]",
  },
} as const;
