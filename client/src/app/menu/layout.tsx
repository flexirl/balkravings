import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menu — Kitis Kitchen | Order Biryani, Combos, Parathas & More",
  description:
    "Browse the full Kravings Kitchen (kitis kitchen) menu. Order biryanis, combos, fried rice, parathas and more — KIIT's favourite kitchen delivering fresh food across KIIT, Patia & nearby areas in Bhubaneswar.",
  keywords: [
    "kitis kitchen menu",
    "kiits kitchen menu",
    "Kravings Kitchen menu",
    "KIIT food menu",
    "biryani menu KIIT",
    "food delivery menu Patia",
  ],
  alternates: { canonical: "/menu" },
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
