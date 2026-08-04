import SiteNav from "@/app/components/SiteNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-page">
      <SiteNav />
      <div className="shell" style={{ paddingTop: "1rem" }}>{children}</div>
    </div>
  );
}
