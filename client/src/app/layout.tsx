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
  title: "Kravings by ARF — Cloud Kitchen delivering affordable food to KIIT students",
  description:
    "Premium cloud kitchen delivering anywhere in KIIT. Order your favorite midnight meals now!",
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
