"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package } from "lucide-react"
import supabase from "@/lib/supabase"
import { toast } from "sonner"

interface OrderItem { name: string; quantity: number; price: number }
interface Order {
  id: string
  items: OrderItem[]
  total_amount: number
  payment_status: string
  order_status: string
  created_at: string
  order_items: OrderItem[]
}

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  preparing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "out-for-delivery": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
          setOrders(prev =>
            prev.map(order =>
              order.id === payload.new.id
                ? { ...order, ...payload.new }
                : order
            )
          )
          toast.info(`Order status: ${(payload.new as { order_status: string }).order_status.replace(/-/g, ' ')}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Package className="h-7 w-7 text-primary" />
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground text-sm">Place your first order from the menu!</p>
        </div>
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
              <div className="space-y-2 mb-4">
                {(order.order_items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                    <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{Number(order.total_amount).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
