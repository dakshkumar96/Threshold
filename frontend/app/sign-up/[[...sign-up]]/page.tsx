import { SignUp } from "@clerk/nextjs";
import AuthShell, { clerkAuthAppearance } from "@/app/components/AuthShell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Create your account in under a minute."
    >
      <SignUp
        fallbackRedirectUrl="/search"
        signInUrl="/sign-in"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  );
}
