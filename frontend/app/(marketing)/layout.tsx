import SiteNav from "@/app/components/SiteNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <div className="shell" style={{ paddingTop: "2rem" }}>{children}</div>
    </>
  );
}
