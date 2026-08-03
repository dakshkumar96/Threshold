"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  House,
  MagnifyingGlass,
  Student,
  UserCircle,
} from "@phosphor-icons/react";
import { UserButton, useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";
import SiteNav from "@/app/components/SiteNav";

const LINKS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/search", label: "Search", Icon: MagnifyingGlass },
  { href: "/insights", label: "Insights", Icon: ChartBar },
  { href: "/#solutions", label: "Solutions", Icon: Student },
  { href: "/profile", label: "Profile", Icon: UserCircle },
];

function titleFor(pathname: string) {
  if (pathname.startsWith("/results")) return "Results";
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/home")) return "Home";
  if (pathname.startsWith("/solutions")) return "Solutions";
  return "Sponsor Signal";
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const signedIn = isLoaded && isSignedIn;

  if (!signedIn) {
    return (
      <>
        <SiteNav />
        <div className="shell shell--pad-top">{children}</div>
      </>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <SiteNav />
      </div>
      <div className="dash-shell">
        <aside className="dash-sidebar" aria-label="App">
          <div style={{ padding: "1.5rem 1.25rem 1rem" }}>
            <Link
              href="/home"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                textDecoration: "none",
                color: "var(--color-ink)",
                fontWeight: 500,
                fontSize: "0.9375rem",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-gold)",
                }}
                aria-hidden
              />
              Sponsor Signal
            </Link>
          </div>
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              paddingTop: "0.5rem",
            }}
          >
            {LINKS.map(({ href, label, Icon }) => {
              const active =
                pathname === href ||
                (href !== "/home" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className="dash-side-link"
                  data-active={active ? "true" : "false"}
                >
                  <Icon
                    size={18}
                    weight={active ? "fill" : "regular"}
                    color={active ? "#4F6EF7" : "#9CA3AF"}
                    aria-hidden
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <header className="dash-topbar">
            <h1
              style={{
                margin: 0,
                fontSize: "1.125rem",
                fontWeight: 500,
                color: "var(--color-ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {titleFor(pathname)}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <UserButton />
            </div>
          </header>
          <div className="dash-main">{children}</div>
        </div>
      </div>
    </>
  );
}
