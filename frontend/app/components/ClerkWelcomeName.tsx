"use client";

import { useUser } from "@clerk/nextjs";

export default function ClerkWelcomeName() {
  const { user } = useUser();
  return <>{user?.firstName || user?.username || "there"}</>;
}
