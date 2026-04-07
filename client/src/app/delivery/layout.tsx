import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delivery Dashboard | Kravings Kitchen",
  description: "Manage your deliveries",
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
