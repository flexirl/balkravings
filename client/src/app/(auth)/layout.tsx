import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Kravings by ARF account to order food, track deliveries, and manage your profile.",
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-orange-400/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="p-8 rounded-2xl bg-card border border-border glow-orange">
          {children}
        </div>
      </div>
    </div>
  )
}
