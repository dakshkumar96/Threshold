import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Search",
  description: "Search live UK job ads and see which employers can sponsor a Skilled Worker visa.",
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
