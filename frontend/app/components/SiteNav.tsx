"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  AirplaneTilt,
  Buildings,
  CaretDown,
  FileText,
  MagnifyingGlass,
} from "@phosphor-icons/react";

const GUEST_LINKS = [
  { href: "/", label: "Home" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

const APP_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/profile", label: "Profile" },
];

const SOLUTION_ITEMS = [
  {
    href: "/search",
    title: "Sponsor search",
    body: "Search UK roles and match them to licensed sponsors.",
    Icon: MagnifyingGlass,
  },
  {
    href: "/solutions/immigration-guide",
    title: "Immigration guide",
    body: "Skilled Worker and Graduate routes in plain English.",
    Icon: AirplaneTilt,
  },
  {
    href: "/solutions/sponsorship-checker",
    title: "Sponsorship checker",
    body: "Look up whether an employer is on the sponsor register.",
    Icon: Buildings,
  },
  {
    href: "/solutions/cv-guide",
    title: "CV guide",
    body: "Write for sponsor-market ads, then score against live demand.",
    Icon: FileText,
  },
];

function linkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SolutionIcon({ Icon }: { Icon: (typeof SOLUTION_ITEMS)[number]["Icon"] }) {
  return (
    <motion.span
      className="solutions-menu__icon"
      whileHover={{ scale: 1.08, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
    >
      <span className="solutions-menu__icon-sheet" aria-hidden>
        <FileText size={22} weight="regular" color="#64748B" />
      </span>
      <motion.span
        className="solutions-menu__icon-badge"
        aria-hidden
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={14} weight="fill" color="#4F6EF7" />
      </motion.span>
    </motion.span>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const solutionsId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSolutionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!solutionsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSolutionsOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!solutionsRef.current?.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [solutionsOpen]);

  const openSolutions = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSolutionsOpen(true);
  };

  const scheduleCloseSolutions = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setSolutionsOpen(false), 140);
  };

  const signedIn = isLoaded && isSignedIn;
  const links = signedIn ? APP_LINKS : GUEST_LINKS;
  const homeHref = signedIn ? "/home" : "/";
  const solutionsActive = pathname.startsWith("/solutions");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "12px 1rem 0",
        pointerEvents: "none",
      }}
    >
      <nav
        aria-label="Primary"
        className="glass-dark"
        style={{
          maxWidth: 960,
          margin: "0 auto",
          borderRadius: 999,
          padding: "6px 6px 6px 20px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow:
            "0 8px 32px rgba(30,27,75,0.28), 0 0 0 1px rgba(255,255,255,0.12)",
          pointerEvents: "all",
          position: "relative",
        }}
      >
        <Link
          href={homeHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M9 1v16M1 9h16M3.1 3.1l11.8 11.8M14.9 3.1L3.1 14.9"
              stroke="#4F6EF7"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            Threshold
          </span>
        </Link>

        <div
          className="hidden md:flex"
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: "0.125rem",
          }}
        >
          {links.slice(0, 1).map((l) => {
            const active = linkActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                style={{
                  position: "relative",
                  padding: "0.4375rem 0.875rem",
                  borderRadius: 999,
                  fontSize: "0.875rem",
                  fontWeight: active ? 500 : 400,
                  color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "color 150ms, background 150ms",
                  whiteSpace: "nowrap",
                }}
              >
                {l.label}
                {active ? (
                  <motion.div
                    layoutId="nav-active-line"
                    className="nav-active-underline"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </Link>
            );
          })}

          <div
            ref={solutionsRef}
            className="solutions-menu"
            onMouseEnter={openSolutions}
            onMouseLeave={scheduleCloseSolutions}
          >
            <button
              type="button"
              aria-expanded={solutionsOpen}
              aria-controls={solutionsId}
              onClick={() => setSolutionsOpen((o) => !o)}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.4375rem 0.875rem",
                borderRadius: 999,
                fontSize: "0.875rem",
                fontWeight: solutionsActive || solutionsOpen ? 500 : 400,
                color:
                  solutionsActive || solutionsOpen
                    ? "#ffffff"
                    : "rgba(255,255,255,0.55)",
                background:
                  solutionsActive || solutionsOpen
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                border: 0,
                cursor: "pointer",
                transition: "color 150ms, background 150ms",
                whiteSpace: "nowrap",
              }}
            >
              Solutions
              <motion.span
                animate={{ rotate: solutionsOpen ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: "inline-flex" }}
              >
                <CaretDown size={12} weight="bold" />
              </motion.span>
              {solutionsActive ? (
                <motion.div
                  layoutId="nav-active-line"
                  className="nav-active-underline"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
            </button>

            <AnimatePresence>
              {solutionsOpen ? (
                <motion.div
                  id={solutionsId}
                  role="menu"
                  aria-label="Solutions"
                  className="solutions-menu__panel"
                  initial={{ opacity: 0, y: 8, x: "-50%", scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                  exit={{ opacity: 0, y: 6, x: "-50%", scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onMouseEnter={openSolutions}
                  onMouseLeave={scheduleCloseSolutions}
                >
                  <span className="solutions-menu__caret" aria-hidden />
                  <div className="solutions-menu__grid">
                    {SOLUTION_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="solutions-menu__item"
                        onClick={() => setSolutionsOpen(false)}
                      >
                        <SolutionIcon Icon={item.Icon} />
                        <span className="solutions-menu__copy">
                          <span className="solutions-menu__title">{item.title}</span>
                          <span className="solutions-menu__body">{item.body}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {links.slice(1).map((l) => {
            const active = linkActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                style={{
                  position: "relative",
                  padding: "0.4375rem 0.875rem",
                  borderRadius: 999,
                  fontSize: "0.875rem",
                  fontWeight: active ? 500 : 400,
                  color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "color 150ms, background 150ms",
                  whiteSpace: "nowrap",
                }}
              >
                {l.label}
                {active ? (
                  <motion.div
                    layoutId="nav-active-line"
                    className="nav-active-underline"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          {!isLoaded ? null : signedIn ? (
            <>
              <Link
                href="/search"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "var(--gradient-cta)",
                  borderRadius: 999,
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-gold-ink)",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(79,110,247,0.35)",
                }}
              >
                Search a role
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.4375rem 0.875rem",
                  borderRadius: 999,
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  transition: "color 150ms",
                  whiteSpace: "nowrap",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "var(--gradient-cta)",
                  borderRadius: 999,
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-gold-ink)",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(79,110,247,0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
