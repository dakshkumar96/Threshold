import SiteNav from "@/app/components/SiteNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <div className="shell" style={{ paddingTop: "1rem" }}>{children}</div>
    </>
  );
}
