"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const GUEST_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/solutions", label: "Solutions" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

const APP_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/solutions", label: "Solutions" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/profile", label: "Profile" },
];

function linkActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname === "/";
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const signedIn = isLoaded && isSignedIn;
  const links = signedIn ? APP_LINKS : GUEST_LINKS;
  const homeHref = signedIn ? "/home" : "/";

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
      {/* Floating pill */}
      <nav
        aria-label="Primary"
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: "#0f1117",
          borderRadius: 999,
          padding: "6px 6px 6px 20px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.07)",
          pointerEvents: "all",
        }}
      >
        {/* Logo */}
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
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M9 1v16M1 9h16M3.1 3.1l11.8 11.8M14.9 3.1L3.1 14.9"
              stroke="#f5a623"
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
            Sponsor Signal
          </span>
        </Link>

        {/* Center links — hidden on mobile */}
        <div
          className="hidden md:flex"
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: "0.125rem",
          }}
        >
          {links.map((l) => {
            const active = linkActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                style={{
                  padding: "0.4375rem 0.875rem",
                  borderRadius: 999,
                  fontSize: "0.875rem",
                  fontWeight: active ? 500 : 400,
                  color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  background: active
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                  transition: "color 150ms, background 150ms",
                  whiteSpace: "nowrap",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
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
                className="hidden md:inline-flex"
                style={{
                  alignItems: "center",
                  background: "var(--gradient-cta)",
                  borderRadius: 999,
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-gold-ink)",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(212,134,10,0.35)",
                }}
              >
                Search a role
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="hidden md:block"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.4375rem 0.875rem",
                    borderRadius: 999,
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.55)",
                    transition: "color 150ms",
                  }}
                >
                  Sign in
                </button>
              </SignInButton>
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
                  boxShadow: "0 2px 8px rgba(212,134,10,0.35)",
                }}
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="site-nav-mobile"
            className="md:hidden"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.8)",
              fontSize: "1.125rem",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="site-nav-mobile"
          className="md:hidden"
          style={{
            maxWidth: 960,
            margin: "8px auto 0",
            background: "#0f1117",
            borderRadius: 16,
            padding: "0.5rem",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.07)",
            pointerEvents: "all",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.8)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/sign-up"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--gradient-cta)",
              borderRadius: 999,
              padding: "0.75rem 1rem",
              marginTop: "0.375rem",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "var(--color-gold-ink)",
              textDecoration: "none",
            }}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
