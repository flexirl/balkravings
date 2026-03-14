import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Your Orders",
  description: "Track your food order status in real-time. Kravings by ARF — delivering to KIIT students.",
  robots: { index: false, follow: false },
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
