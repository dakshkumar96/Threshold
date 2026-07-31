"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const GUEST_LINKS = [
  { href: "/#how-it-works", label: "Product" },
  { href: "/solutions", label: "Solutions" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

const APP_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/insights", label: "Insights" },
  { href: "/solutions", label: "Solutions" },
  { href: "/profile", label: "Profile" },
];

function linkActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const signedIn = isLoaded && isSignedIn;
  const links = signedIn ? APP_LINKS : GUEST_LINKS;
  const homeHref = signedIn ? "/home" : "/";

  return (
    <header
      className={`site-nav${scrolled ? " site-nav--scrolled" : ""}`}
    >
      <nav className="site-nav__inner" aria-label="Primary">
        <Link href={homeHref} className="site-nav__brand">
          <span className="site-nav__dot" aria-hidden />
          Sponsor Signal
        </Link>

        <div className="site-nav__links" aria-hidden={false}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                linkActive(pathname, l.href)
                  ? "site-nav__link site-nav__link--active"
                  : "site-nav__link"
              }
              prefetch
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="site-nav__actions">
          {!isLoaded ? (
            <span className="site-nav__link" aria-hidden>
              …
            </span>
          ) : signedIn ? (
            <UserButton />
          ) : (
            <>
              <SignInButton mode="modal">
                <button type="button" className="site-nav__link site-nav__signin">
                  Sign in
                </button>
              </SignInButton>
              <Link href="/sign-up" className="cta-primary site-nav__cta" prefetch>
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            className="site-nav__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-nav-mobile"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div id="site-nav-mobile" className="site-nav__mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="site-nav__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {!signedIn && isLoaded ? (
            <Link
              href="/sign-up"
              className="cta-primary site-nav__cta"
              style={{ justifyContent: "center", marginTop: "0.5rem" }}
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
