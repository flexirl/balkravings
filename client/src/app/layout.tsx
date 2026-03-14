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
    default: "Kravings by ARF — Late Night Food Delivery Near KIIT, Bhubaneswar",
    template: "%s | Kravings by ARF",
  },
  description:
    "Order biryanis, combos, parathas & more from Kravings by ARF — a premium cloud kitchen delivering fresh, affordable meals to KIIT students in 20 minutes. Open till 1 AM!",
  keywords: [
    "food delivery near KIIT",
    "cloud kitchen Bhubaneswar",
    "late night food delivery KIIT",
    "biryani near KIIT",
    "Kravings by ARF",
    "KIIT food delivery",
    "midnight food delivery Bhubaneswar",
    "affordable food KIIT",
    "Patia food delivery",
  ],
  verification: {
    google: "p3_3bLcmpm5R6P-uIWVZxqCqn8QUsi2f-IQ63c2ndJ4",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kravings by ARF — Late Night Food Delivery Near KIIT",
    description:
      "Order biryanis, combos & more. Fresh, affordable meals delivered in 20 minutes to KIIT students. Open till 1 AM!",
    url: "https://www.kravingskitchen.in",
    siteName: "Kravings by ARF",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kravings by ARF — Cloud Kitchen for KIIT Students",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kravings by ARF — Late Night Food Delivery Near KIIT",
    description:
      "Order biryanis, combos & more. Delivered in 20 mins near KIIT, Bhubaneswar.",
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
