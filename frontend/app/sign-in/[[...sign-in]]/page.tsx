import { SignIn } from "@clerk/nextjs";
import SiteNav from "@/app/components/SiteNav";

export default function SignInPage() {
  return (
    <>
      <SiteNav />
      <main className="shell shell--pad-top flex min-h-[70dvh] items-center justify-center px-4 py-12">
        <SignIn
          fallbackRedirectUrl="/home"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none border border-[var(--color-line)]",
            },
          }}
        />
      </main>
    </>
  );
}
