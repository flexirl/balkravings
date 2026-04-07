"use client"

import { Wallet, Gift, ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useWallet } from "@/context/wallet-context"

export function WalletRewardsBanner() {
  const { user } = useAuth()
  const { walletBalance } = useWallet()

  const steps = [
    {
      icon: Gift,
      title: "Apply Cashback Coupon",
      desc: "Use a cashback-enabled coupon at checkout",
    },
    {
      icon: ShieldCheck,
      title: "Get Order Delivered",
      desc: "Cashback is credited after successful delivery",
    },
    {
      icon: Wallet,
      title: "Save on Next Order",
      desc: "Use wallet balance to pay less on your next order",
    },
  ]

  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">Kravings Wallet</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Earn Cashback on Every Order 💰
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Order with cashback coupons and get real money back in your wallet. Use it to save on your next meal!
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 mb-10">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative p-5 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all group"
            >
              {/* Step number */}
              <div className="absolute top-4 right-4 text-4xl font-bold text-muted-foreground/10 group-hover:text-primary/10 transition-colors">
                {i + 1}
              </div>

              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">{step.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          {user ? (
            walletBalance > 0 ? (
              <Link
                href="/profile?tab=wallet"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
              >
                <Wallet className="h-4 w-4" />
                You have ₹{walletBalance.toFixed(0)} in your wallet
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Order Now & Earn Cashback
                <ArrowRight className="h-4 w-4" />
              </Link>
            )
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Sign Up to Start Earning
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
