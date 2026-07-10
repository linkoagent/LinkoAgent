import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/tenant";
import { LocaleProvider } from "@/components/marketing/locale-provider";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingHero } from "@/components/marketing/hero";
import { RubrosStrip } from "@/components/marketing/rubros-strip";
import { MarketingFeatures } from "@/components/marketing/features";
import { MarketingSteps } from "@/components/marketing/steps";
import { UseCases } from "@/components/marketing/use-cases";
import { MarketingBenefits } from "@/components/marketing/benefits";
import { MarketingPricing } from "@/components/marketing/pricing";
import { MarketingFAQ } from "@/components/marketing/faq";
import { MarketingContact } from "@/components/marketing/contact";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <LocaleProvider>
      <div className="min-h-screen bg-background text-foreground">
        <MarketingNav />
        <MarketingHero />
        <RubrosStrip />
        <MarketingFeatures />
        <MarketingSteps />
        <UseCases />
        <MarketingBenefits />
        <MarketingPricing />
        <MarketingFAQ />
        <MarketingContact />
        <MarketingFooter />
      </div>
    </LocaleProvider>
  );
}
