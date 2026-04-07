"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, Check, ChefHat, Truck, CircleX } from "lucide-react"
import { OrderCardSkeleton } from "@/components/skeleton-loaders"
import { EmptyOrders } from "@/components/empty-states"
import { ReviewPrompt } from "@/components/review-prompt"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import supabase from "@/lib/supabase"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import confetti from "canvas-confetti"

// Lazy-load entertainment components — zero cost on initial load
const DeliveryTracker = dynamic(() => import("@/components/delivery-tracker"), { ssr: false })
const PreparingAnimation = dynamic(() => import("@/components/preparing-animation"), { ssr: false })

interface OrderItem { name: string; quantity: number; price: number; food_id?: string; image?: string }
interface Order {
  id: string
  items: OrderItem[]
  total_amount: number
  payment_status: string
  order_status: string
  created_at: string
  order_items: OrderItem[]
}

const STATUS_STEPS = ["placed", "preparing", "out-for-delivery", "delivered"]

const STATUS_ICONS: Record<string, typeof Package> = {
  placed: Check,
  preparing: ChefHat,
  "out-for-delivery": Truck,
  delivered: Package,
}

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  preparing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "out-for-delivery": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
}

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
        <CircleX className="h-5 w-5 text-red-400" />
        <span className="text-sm text-red-400 font-medium">Order Cancelled</span>
      </div>
    )
  }

  const currentIdx = STATUS_STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-1 mt-4">
      {STATUS_STEPS.map((step, idx) => {
        const isComplete = idx <= currentIdx
        const isCurrent = idx === currentIdx
        const Icon = STATUS_ICONS[step]

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isComplete
                    ? isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-primary/80 text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] mt-1.5 capitalize ${isComplete ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {step.replace(/-/g, " ")}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-4 mx-1 rounded-full ${idx < currentIdx ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()

  // Audio ref for delivery arrival chime
  const audioCtxRef = useRef<AudioContext | null>(null)

  // 🎶 Arrival celebration chime — cheerful ascending melody
  const playArrivalChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const now = ctx.currentTime
      const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.4, now + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.3)
      })
    } catch { /* audio unavailable */ }
  }, [])

  // 🎉 Delivery confetti celebration
  const fireDeliveryConfetti = useCallback(() => {
    const colors = ["#22c55e", "#4ade80", "#16a34a", "#fbbf24", "#f97316"]
    // Big center burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, zIndex: 9999 })
    // Side bursts
    setTimeout(() => {
      confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors, zIndex: 9999 })
      confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors, zIndex: 9999 })
    }, 300)
    // Second burst
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.5 }, colors, zIndex: 9999 })
    }, 700)
  }, [])

  // Track which orders have been reviewed
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set())

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch {
        toast.error("Failed to load orders")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()

    // Fetch reviewed order IDs
    const fetchReviewed = async () => {
      if (!user) return
      const { data } = await supabase
        .from('reviews')
        .select('order_id')
        .eq('user_id', user.id)
      if (data) {
        setReviewedOrderIds(new Set(data.map(r => r.order_id)))
      }
    }
    fetchReviewed()
  }, [user])

  // Real-time order status updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('my-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { order_status: string }).order_status
          const oldOrder = orders.find(o => o.id === (payload.new as { id: string }).id)

          setOrders(prev =>
            prev.map(order =>
              order.id === payload.new.id
                ? { ...order, ...payload.new }
                : order
            )
          )

          // 🎉 If status just changed to "delivered" — celebrate!
          if (newStatus === "delivered" && oldOrder?.order_status !== "delivered") {
            fireDeliveryConfetti()
            playArrivalChime()
            toast.success("🎉 Your order has been delivered! Enjoy your meal!", {
              duration: 5000,
            })
          } else {
            toast.info(`Order status: ${newStatus.replace(/-/g, ' ')}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, orders, fireDeliveryConfetti, playArrivalChime])

  const handleReorder = (order: Order) => {
    const items = order.order_items || []
    if (items.length === 0) {
      toast.error("No items to reorder")
      return
    }
    items.forEach(item => {
      addToCart({
        foodId: item.food_id || item.name,
        name: item.name,
        price: item.price,
        image: item.image || '',
        quantity: item.quantity,
      })
    })
    toast.success(`${items.length} item(s) added to cart!`, {
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    })
  }

  const refreshOrders = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }, [user])

  const { pullIndicatorRef, isRefreshing } = usePullToRefresh({ onRefresh: refreshOrders })

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          My Orders
        </h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl relative">
      {/* Pull-to-refresh indicator */}
      <div
        ref={pullIndicatorRef}
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-3 opacity-0 z-50 pointer-events-none"
      >
        <div className={`h-6 w-6 rounded-full border-2 border-primary border-t-transparent ${isRefreshing ? 'animate-spin' : ''}`} />
      </div>
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Package className="h-7 w-7 text-primary" />
        My Orders
      </h1>

      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-6 rounded-2xl bg-card border border-border hover:border-border/80 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className={`${STATUS_STYLES[order.order_status] || ""} border rounded-lg px-3 py-1`}>
                  {order.order_status.replace(/-/g, " ").toUpperCase()}
                </Badge>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-3">
                {(order.order_items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                    <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <div className="font-bold">
                  <span className="text-sm text-muted-foreground font-normal mr-2">Total:</span>
                  <span className="text-primary">₹{Number(order.total_amount).toFixed(0)}</span>
                </div>
                {(order.order_status === "delivered" || order.order_status === "cancelled") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReorder(order)}
                    className="rounded-xl h-9 px-4 gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Reorder
                  </Button>
                )}
              </div>

              {/* Order Timeline */}
              <OrderTimeline status={order.order_status} />

              {/* Preparing Animation + Dino Game */}
              {order.order_status === "preparing" && (
                <PreparingAnimation />
              )}

              {/* Delivery Rider Animation */}
              {order.order_status === "out-for-delivery" && (
                <DeliveryTracker />
              )}

              {/* Review Prompt — only for delivered, unreviewed orders */}
              {order.order_status === "delivered" && !reviewedOrderIds.has(order.id) && (
                <ReviewPrompt
                  orderId={order.id}
                  onReviewSubmitted={() => setReviewedOrderIds(prev => new Set(prev).add(order.id))}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
