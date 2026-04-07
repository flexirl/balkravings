"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WhatsAppFloat } from "@/components/whatsapp-float"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDeliveryRoute = pathname?.startsWith("/delivery")

  if (isDeliveryRoute) {
    // Delivery panel — standalone, no navbar/footer/whatsapp
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
