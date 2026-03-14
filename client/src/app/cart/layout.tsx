import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your order before checkout. Kravings by ARF — fresh meals delivered to KIIT students.",
  robots: { index: false, follow: false },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
