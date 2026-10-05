import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sponsorship checker",
  description: "Check whether a UK company is on the latest Home Office sponsor register.",
};

export default function SponsorshipCheckerLayout({ children }: { children: ReactNode }) {
  return children;
}
