import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sponsor Signal",
  description:
    "Find UK licensed sponsors hiring for your role, with honest confidence and a skill roadmap.",
};

const DIRECTION_CONTRACT = `
THESIS: Sponsor evidence as a calm signal desk; refuses the noisy job-board dashboard.
OWN-WORLD: Cool paper, deep navy structure, muted gold action, green only for confirmed evidence; precise type and sparse rules.
STORY: Name a role, see what the market proves, then act on the strongest sponsors and clearest skill moves.
FIRST VIEWPORT: Quiet navigation above an asymmetric role question and one focused search composer; the primary action remains visible on mobile.
FORM: Calm signal desk, brief-pinned direction, seed 733c924d.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-[100dvh] bg-canvas font-[family-name:var(--font-body)] text-ink antialiased">
        <div
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `<!--${DIRECTION_CONTRACT}-->`,
          }}
          style={{ display: "none" }}
        />
        <div className="shell">
          <nav className="nav" aria-label="Primary">
            <a className="brand" href="/">
              Sponsor Signal
            </a>
            <a href="/">Search</a>
            <a href="/benchmarks">Benchmarks</a>
            <a href="/insights">Insights</a>
            <a href="/methodology">Methodology</a>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
