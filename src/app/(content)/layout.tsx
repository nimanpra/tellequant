import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <MarketingNav />
      <main className="pt-24">{children}</main>
      <Footer />
    </div>
  );
}
