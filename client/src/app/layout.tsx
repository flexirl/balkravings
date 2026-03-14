import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Galindo } from "next/font/google";

const galindo = Galindo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-galindo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bebneue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kravingskitchen.in"),
  title: {
    default: "Kravings Kitchen by ARF — Late Night Food Delivery in KIIT & Nearby Areas, Bhubaneswar",
    template: "%s | Kravings Kitchen by ARF",
  },
  description:
    "Kravings Kitchen — order biryanis, combos, parathas & more. Premium cloud kitchen delivering fresh, affordable meals across KIIT, Patia, Chandrasekharpur & nearby areas in Bhubaneswar. Fast delivery, open till 1 AM!",
  keywords: [
    "Kravings Kitchen",
    "Kravings Kitchen KIIT",
    "Kravings by ARF",
    "Kravings Kitchen Bhubaneswar",
    "kravingskitchen",
    "food delivery near KIIT",
    "food delivery Patia",
    "food delivery Chandrasekharpur",
    "cloud kitchen Bhubaneswar",
    "late night food delivery Bhubaneswar",
    "biryani near KIIT",
    "KIIT food delivery",
    "midnight food delivery Bhubaneswar",
    "affordable food Patia Bhubaneswar",
    "Addis Royal Food",
    "ARF cloud kitchen",
    "food delivery KIIT Road",
    "food delivery near SOA University",
    "food delivery near Silicon Institute",
    "late night food Patia",
    "food near ITER Bhubaneswar",
  ],
  other: {
    "geo.region": "IN-OR",
    "geo.placename": "Patia, Bhubaneswar, Odisha",
    "geo.position": "20.3543;85.8145",
    "ICBM": "20.3543, 85.8145",
  },
  verification: {
    google: "p3_3bLcmpm5R6P-uIWVZxqCqn8QUsi2f-IQ63c2ndJ4",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kravings Kitchen by ARF — Food Delivery in KIIT & Nearby Areas",
    description:
      "Kravings Kitchen — order biryanis, combos & more. Fresh, affordable meals delivered in 20 mins across KIIT, Patia & Bhubaneswar. Open till 1 AM!",
    url: "https://www.kravingskitchen.in",
    siteName: "Kravings Kitchen by ARF",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kravings Kitchen by ARF — Cloud Kitchen in Patia, Bhubaneswar",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kravings Kitchen by ARF — Food Delivery in KIIT & Nearby Areas",
    description:
      "Kravings Kitchen — biryanis, combos & more. Delivered in 20 mins across KIIT, Patia & nearby areas in Bhubaneswar.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bebneue.variable}  ${galindo.variable} min-h-screen bg-background font-sans antialiased`}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
