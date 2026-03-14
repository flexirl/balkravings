import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menu — Order Biryani, Combos, Parathas & More",
  description:
    "Browse the full Kravings Kitchen menu. Order biryanis, combos, fried rice, parathas and more — delivered fresh across KIIT, Patia & nearby areas in Bhubaneswar.",
  alternates: { canonical: "/menu" },
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
