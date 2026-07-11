import type { Metadata } from "next";
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
import { MARKETING_CONTENT } from "@/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Linko Agent",
  url: siteUrl,
  logo: `${siteUrl}/appletouchicon.png`,
  sameAs: ["https://instagram.com/linkoagent"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hola@linkoagent.com",
    telephone: "+54 9 351 636-2806",
    areaServed: "AR",
    availableLanguage: ["Spanish", "English"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: MARKETING_CONTENT.es.faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <LocaleProvider>
      <div className="min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
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
