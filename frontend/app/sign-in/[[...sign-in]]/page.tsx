import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import AuthShell, { clerkAuthAppearance } from "@/app/components/AuthShell";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Continue where you left off."
    >
      <SignIn
        fallbackRedirectUrl="/search"
        signUpUrl="/sign-up"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  );
}
