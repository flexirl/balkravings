import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menu — Order Biryani, Combos, Parathas & More",
  description:
    "Browse the full Kravings by ARF menu. Order biryanis, combos, fried rice, parathas and more — delivered fresh to KIIT in 20 minutes.",
  alternates: { canonical: "/menu" },
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
