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
    default: "Threshold | UK jobs that can sponsor your visa",
    template: "%s | Threshold",
  },
  description:
    "Find UK licensed sponsors hiring for your role, with honest confidence and a skill roadmap.",
};

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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
