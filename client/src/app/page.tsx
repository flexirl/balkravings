import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { BestSellersSection } from "@/components/landing/best-sellers-section";
import { OffersSection } from "@/components/landing/offers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import {AboutUs} from "@/components/landing/about";
import Script from "next/script";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Kravings Kitchen by ARF",
  alternateName: ["Kravings by ARF", "Addis Royal Food Cloud Kitchen", "Kravings Kitchen"],
  description:
    "Premium cloud kitchen delivering fresh, affordable meals across KIIT, Patia, Chandrasekharpur & nearby areas in Bhubaneswar. Biryanis, combos, parathas & more delivered in 20 minutes. Open till 1 AM.",
  url: "https://www.kravingskitchen.in",
  telephone: "+919876543210",
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
    "https://www.instagram.com/kravingsbyarf",
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

export default function Home() {
  return (
    <div className="overflow-x-hidden w-full flex flex-col">
      <Script
        id="restaurant-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <FeaturesSection />
      <BestSellersSection />
      <OffersSection />
      <TestimonialsSection />
      <AboutUs/>
      <CtaSection />
    </div>
  );
}
