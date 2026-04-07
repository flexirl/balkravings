"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import supabase from "@/lib/supabase"
import { getDailyTokenMap, getBusinessDayStart } from "@/lib/daily-token"
import {
  Truck,
  Package,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
  IndianRupee,
  Clock,
  LogOut,
  Banknote,
  CreditCard,
  RefreshCw,
} from "lucide-react"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  order_items: OrderItem[]
  total_amount: number
  payment_method: string
  payment_status: string
  order_status: string
  created_at: string
  freebie_item?: string
}

type TabType = "active" | "completed"

export default function DeliveryPanel() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Simple notification beep — two ascending tones
  const playNotificationBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const now = ctx.currentTime

      // Tone 1 — lower
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = "sine"
      osc1.frequency.value = 587
      gain1.gain.setValueAtTime(0.7, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc1.connect(gain1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.2)

      // Tone 2 — higher
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.value = 880
      gain2.gain.setValueAtTime(0.7, now + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      osc2.connect(gain2).connect(ctx.destination)
      osc2.start(now + 0.25)
      osc2.stop(now + 0.5)
    } catch {
      // Audio not available
    }
  }

  // Auth guard — only delivery role
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "delivery")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .in("order_status", ["out-for-delivery", "delivered"])
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?.role === "delivery") fetchOrders()
  }, [user, fetchOrders])

  // Realtime — listen for order updates (admin marks out-for-delivery, or status changes)
  useEffect(() => {
    if (!user || user.role !== "delivery") return

    const channel = supabase
      .channel("delivery-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          const updated = payload.new as Order
          if (!updated) return

          if (
            payload.eventType === "UPDATE" &&
            (updated.order_status === "out-for-delivery" ||
              updated.order_status === "delivered")
          ) {
            // Fetch full order with items
            const { data } = await supabase
              .from("orders")
              .select("*, order_items(*)")
              .eq("id", updated.id)
              .single()

            if (data) {
              setOrders((prev) => {
                const exists = prev.find((o) => o.id === data.id)
                if (exists) {
                  return prev.map((o) => (o.id === data.id ? data : o))
                }
                return [data, ...prev]
              })

              // Notify if new delivery assignment
              if (
                updated.order_status === "out-for-delivery" &&
                !prev_order_ids_ref.has(updated.id)
              ) {
                playNotificationBeep()
                toast.success(
                  `🚀 New delivery: Order #${updated.id.slice(-6).toUpperCase()}`
                )
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Track existing order IDs for "new delivery" detection
  const prev_order_ids_ref = new Set(orders.map((o) => o.id))

  // Mark as delivered
  const handleMarkDelivered = async (orderId: string) => {
    setMarkingDelivered(orderId)
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: "delivered", payment_status: "paid" })
        .eq("id", orderId)

      if (error) throw error

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, order_status: "delivered", payment_status: "paid" }
            : o
        )
      )
      toast.success("Order marked as delivered! ✅")
    } catch {
      toast.error("Failed to update order")
    } finally {
      setMarkingDelivered(null)
    }
  }

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
    toast.success("Refreshed!")
  }

  // Filter orders by tab
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeOrders = orders.filter(
    (o) => o.order_status === "out-for-delivery"
  )
  const completedOrders = orders.filter(
    (o) =>
      o.order_status === "delivered" &&
      new Date(o.created_at) >= getBusinessDayStart()
  )

  // COD summary
  const codActiveTotal = activeOrders
    .filter((o) => o.payment_method === "cod")
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  const codCollectedTotal = completedOrders
    .filter((o) => o.payment_method === "cod")
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  const displayOrders = activeTab === "active" ? activeOrders : completedOrders

  // Daily token numbers
  const tokenMap = useMemo(() => getDailyTokenMap(orders), [orders])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading deliveries...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "delivery") return null

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Deliveries</h1>
              <p className="text-[11px] text-muted-foreground leading-none">
                {user.name || "Delivery Partner"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={logout}
              className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-red-500/10 transition-colors group"
            >
              <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* COD Summary Bar */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
            <div className="flex items-center gap-2 mb-1.5">
              <Banknote className="h-4 w-4 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
                COD to Collect
              </span>
            </div>
            <p className="text-xl font-bold text-amber-400">
              ₹{codActiveTotal.toFixed(0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeOrders.filter((o) => o.payment_method === "cod").length}{" "}
              order{activeOrders.filter((o) => o.payment_method === "cod").length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-green-500/5 border border-green-500/15">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-[11px] font-medium text-green-400 uppercase tracking-wider">
                COD Collected
              </span>
            </div>
            <p className="text-xl font-bold text-green-400">
              ₹{codCollectedTotal.toFixed(0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedOrders.filter((o) => o.payment_method === "cod").length}{" "}
              order{completedOrders.filter((o) => o.payment_method === "cod").length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-2xl mb-5">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Truck className="h-4 w-4" />
              Active
              {activeOrders.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === "active"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {activeOrders.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === "completed"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              Completed
              {completedOrders.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === "completed"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {completedOrders.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Orders List */}
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              {activeTab === "active" ? (
                <Truck className="h-8 w-8 text-muted-foreground/50" />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-muted-foreground font-medium">
              {activeTab === "active"
                ? "No active deliveries"
                : "No deliveries completed today"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {activeTab === "active"
                ? "New deliveries will appear here in real-time"
                : "Completed deliveries will show up here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                tokenNumber={tokenMap.get(order.id)}
                onMarkDelivered={handleMarkDelivered}
                isMarking={markingDelivered === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Order Card Component
// ────────────────────────────────────────────────────────────
function OrderCard({
  order,
  tokenNumber,
  onMarkDelivered,
  isMarking,
}: {
  order: Order
  tokenNumber?: number
  onMarkDelivered: (id: string) => void
  isMarking: boolean
}) {
  const isActive = order.order_status === "out-for-delivery"
  const isCOD = order.payment_method === "cod"
  const timeAgo = getTimeAgo(order.created_at)

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isActive
          ? "bg-card border-primary/20 shadow-sm shadow-primary/5"
          : "bg-card border-border opacity-80"
      }`}
    >
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {tokenNumber && (
              <span className="text-base font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-lg">
                #{tokenNumber}
              </span>
            )}
            <span className="font-medium text-xs text-muted-foreground">
              {order.id.slice(-6).toUpperCase()}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                isCOD
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {isCOD ? "COD" : "PAID"}
            </span>
            {isActive && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-[11px]">{timeAgo}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <p className="font-medium text-sm">{order.customer_name}</p>

          {/* Phone — tap to call */}
          <a
            href={`tel:${order.customer_phone}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
          >
            <Phone className="h-3.5 w-3.5" />
            {order.customer_phone}
          </a>

          {/* Address — tap to navigate */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-sm text-blue-400 hover:underline"
          >
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{order.delivery_address}</span>
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* Order Items */}
      <div className="p-4 pt-3">
        <div className="space-y-1.5 mb-3">
          {(order.order_items || []).map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}× {item.name}
              </span>
              <span className="text-foreground font-medium">
                ₹{(item.price * item.quantity).toFixed(0)}
              </span>
            </div>
          ))}
          {order.freebie_item && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">🎁 {order.freebie_item}</span>
              <span className="text-green-400 font-medium">FREE</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-primary" />
            <span className="font-bold text-lg text-primary">
              {Number(order.total_amount).toFixed(0)}
            </span>
            {isCOD && (
              <span className="text-[10px] text-amber-400 font-medium ml-1">
                (Collect Cash)
              </span>
            )}
          </div>

          {isActive && (
            <button
              onClick={() => onMarkDelivered(order.id)}
              disabled={isMarking}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isMarking ? "Updating..." : "Delivered"}
            </button>
          )}

          {!isActive && (
            <div className="flex items-center gap-1.5 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Delivered</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Time ago utility
// ────────────────────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}
