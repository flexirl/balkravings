import { HeroSection } from "@/components/landing/hero-section";
import dynamic from "next/dynamic";
import Script from "next/script";

const PromoBanner = dynamic(() => import("@/components/promo-banner").then(m => ({ default: m.PromoBanner })))
const FeaturesSection = dynamic(() => import("@/components/landing/features-section").then(m => ({ default: m.FeaturesSection })))
const BestSellersSection = dynamic(() => import("@/components/landing/best-sellers-section").then(m => ({ default: m.BestSellersSection })))
const OffersSection = dynamic(() => import("@/components/landing/offers-section").then(m => ({ default: m.OffersSection })))
const WalletRewardsBanner = dynamic(() => import("@/components/landing/wallet-rewards-banner").then(m => ({ default: m.WalletRewardsBanner })))
const TestimonialsSection = dynamic(() => import("@/components/landing/testimonials-section").then(m => ({ default: m.TestimonialsSection })))
const CtaSection = dynamic(() => import("@/components/landing/cta-section").then(m => ({ default: m.CtaSection })))

const AboutUs = dynamic(() => import("@/components/landing/about").then(m => ({ default: m.AboutUs })))

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Kravings Kitchen by ARF",
  alternateName: ["Kravings by ARF", "Addis Royal Food Cloud Kitchen", "Kravings Kitchen", "kitis kitchen", "kiits kitchen", "KIIT's Kitchen", "kiti's kitchen"],
  description:
    "Premium cloud kitchen delivering fresh, affordable meals across KIIT, Patia, Chandrasekharpur & nearby areas in Bhubaneswar. Biryanis, combos, parathas & more delivered in 20 minutes. Open till 1 AM.",
  url: "https://www.kravingskitchen.in",
  telephone: "+918018332575",
  servesCuisine: ["Indian", "North Indian", "Biryani", "Fast Food"],
  priceRange: "₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot no.-516/1749/3310/3486, Near Royal Enfield Showroom, KIIT Road, Patia",
    addressLocality: "Bhubaneswar",
    addressRegion: "Odisha",
    postalCode: "751024",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 20.3543,
    longitude: 85.8145,
  },
  areaServed: [
    { "@type": "City", name: "Bhubaneswar" },
    { "@type": "Place", name: "KIIT University, Patia, Bhubaneswar" },
    { "@type": "Place", name: "Patia, Bhubaneswar" },
    { "@type": "Place", name: "KIIT Square, Bhubaneswar" },
    { "@type": "Place", name: "Chandrasekharpur, Bhubaneswar" },
    { "@type": "Place", name: "SOA University, Bhubaneswar" },
    { "@type": "Place", name: "ITER, Bhubaneswar" },
    { "@type": "Place", name: "Silicon Institute of Technology, Bhubaneswar" },
    { "@type": "Place", name: "Infocity, Bhubaneswar" },
    { "@type": "Place", name: "Nandan Vihar, Patia, Bhubaneswar" },
  ],
  parentOrganization: {
    "@type": "Organization",
    name: "Addis Royal Food",
    alternateName: "ARF",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "237",
    bestRating: "5",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday",
    ],
    opens: "12:00",
    closes: "01:00",
  },
  image: "https://www.kravingskitchen.in/og-image.jpg",
  hasMenu: "https://www.kravingskitchen.in/menu",
  acceptsReservations: false,
  sameAs: [
    "https://www.instagram.com/kravings_by.arf/",
    "https://www.facebook.com/kravingsbyarf",
  ],
  potentialAction: {
    "@type": "OrderAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.kravingskitchen.in/menu",
      actionPlatform: "http://schema.org/DesktopWebPlatform",
    },
    deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Kravings Kitchen by ARF?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kravings Kitchen by ARF is KIIT's favourite cloud kitchen for biryanis, combos, parathas and late-night food delivery in Patia, Bhubaneswar. Loved by KIIT students for fresh, affordable meals delivered in 20 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "Where is Kravings Kitchen located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kravings Kitchen by ARF is located near Royal Enfield Showroom, KIIT Road, Patia, Bhubaneswar, Odisha 751024. We deliver across KIIT, Patia, Chandrasekharpur and nearby areas.",
      },
    },
    {
      "@type": "Question",
      name: "What are Kravings Kitchen timings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kravings Kitchen is open daily from 12:00 PM to 2:00 AM. We specialize in late-night food delivery for KIIT students and nearby residents in Patia, Bhubaneswar.",
      },
    },
    {
      "@type": "Question",
      name: "What food does Kravings Kitchen serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kravings Kitchen by ARF serves biryanis, fried rice combos, parathas, North Indian dishes, Indo-Chinese favorites, and affordable student combos. All meals are freshly prepared and delivered in 20 minutes.",
      },
    },
  ],
};

const siteLinksJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kravings Kitchen by ARF",
  alternateName: ["kitis kitchen", "kiits kitchen", "Kravings Kitchen"],
  url: "https://www.kravingskitchen.in",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.kravingskitchen.in/menu?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const siteNavJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    {
      "@type": "SiteNavigationElement",
      position: 1,
      name: "Menu",
      description: "Browse our full menu — biryanis, combos, parathas & more",
      url: "https://www.kravingskitchen.in/menu",
    },
    {
      "@type": "SiteNavigationElement",
      position: 2,
      name: "Login",
      description: "Sign in to your Kravings Kitchen account",
      url: "https://www.kravingskitchen.in/login",
    },
    {
      "@type": "SiteNavigationElement",
      position: 3,
      name: "Register",
      description: "Create your Kravings Kitchen account to order food",
      url: "https://www.kravingskitchen.in/register",
    },
    {
      "@type": "SiteNavigationElement",
      position: 4,
      name: "Track Order",
      description: "Track your food delivery order in real-time",
      url: "https://www.kravingskitchen.in/orders",
    },
  ],
};

export default function Home() {
  return (
    <div className="overflow-x-hidden w-full flex flex-col">
      <Script
        id="restaurant-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Script
        id="sitelinks-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLinksJsonLd) }}
      />
      <Script
        id="sitenav-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavJsonLd) }}
      />
      <HeroSection />
      <PromoBanner />
      <FeaturesSection />
      <BestSellersSection />
      <OffersSection />
      <WalletRewardsBanner />
      <TestimonialsSection />
      <AboutUs/>
      <CtaSection />
    </div>
  );
}
