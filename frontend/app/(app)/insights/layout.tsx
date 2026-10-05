import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Insights",
  description: "Salary thresholds, rule changes and sponsor register numbers for Skilled Worker visas.",
};

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return children;
}
