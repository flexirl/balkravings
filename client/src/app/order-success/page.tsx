"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Package, ArrowRight, Sparkles } from "lucide-react"
import supabase from "@/lib/supabase"
import confetti from "canvas-confetti"

interface OrderItem { name: string; quantity: number; price: number }

function OrderSuccessInner() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [order, setOrder] = useState<{
    id: string
    total_amount: number
    order_status: string
    created_at: string
    order_items: OrderItem[]
  } | null>(null)

  // 🎉 Confetti celebration
  const fireConfetti = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration

    const colors = ["#ff6b35", "#ffa500", "#ff4500", "#ffcc00", "#ff8c00", "#22c55e"]

    // Initial big burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
    })

    // Continuous side bursts
    const frame = () => {
      if (Date.now() > end) return

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        zIndex: 9999,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        zIndex: 9999,
      })

      requestAnimationFrame(frame)
    }

    // Start side bursts after a short delay
    setTimeout(frame, 300)

    // Second big burst
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { y: 0.5, x: 0.5 },
        colors,
        zIndex: 9999,
      })
    }, 800)
  }, [])

  useEffect(() => {
    fireConfetti()
  }, [fireConfetti])

  useEffect(() => {
    if (!orderId) return
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()
      if (data) setOrder(data)
    }
    fetchOrder()
  }, [orderId])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success Animation */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 animate-[scale-in_0.5s_ease-out]" />
          </div>

          {/* Sparkle effects */}
          <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-primary animate-bounce" />
          <Sparkles className="absolute -bottom-1 -left-3 h-4 w-4 text-yellow-400 animate-bounce delay-150" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Order Placed!</h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully. We&apos;re preparing your food with love! 🧡
          </p>
        </div>

        {order && (
          <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Order ID</span>
              <span className="font-mono text-sm font-semibold">#{order.id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="space-y-2">
              {(order.order_items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                  <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">₹{Number(order.total_amount).toFixed(0)}</span>
            </div>

            <div className="flex items-center gap-2 bg-primary/5 rounded-xl p-3 text-sm">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Estimated delivery: <strong className="text-foreground">15-20 mins</strong></span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
            <Link href="/orders">
              Track Order <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-12 rounded-xl border-border">
            <Link href="/menu">Order More</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessInner />
    </Suspense>
  )
}
