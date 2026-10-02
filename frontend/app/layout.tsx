import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins-face",
  display: "swap",
});

const fontVariables = poppins.variable;

export const metadata: Metadata = {
  title: {
    default: "Threshold",
    template: "%s | Threshold",
  },
  description:
    "Find UK licensed sponsors hiring for your role, with honest confidence and a skill roadmap.",
};

const DIRECTION_CONTRACT = `
THESIS: Sponsor evidence as a calm signal desk; refuses the noisy job-board dashboard.
OWN-WORLD: Flat off-white paper, near-black type doing the work, dark professional blue the only action colour, green only for confirmed evidence.
STORY: Marketing landing for guests; signed-in home and search for members.
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={fontVariables}
        suppressHydrationWarning
      >
        <body
          className="min-h-[100dvh] bg-canvas font-[family-name:var(--font-body)] text-ink antialiased"
          suppressHydrationWarning
        >
          <div
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: `<!--${DIRECTION_CONTRACT}-->`,
            }}
            style={{ display: "none" }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
