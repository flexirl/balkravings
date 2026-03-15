"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import supabase from "@/lib/supabase"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useAdminTab } from "./layout"

interface AppSettings {
  id?: string
  delivery_fee: number
  gst_percent: number
  free_delivery_above: number
  is_store_open: boolean
  store_opens_at: string | null
  banner_image: string | null
  banner_enabled: boolean
}

interface Coupon {
  id: string
  code: string
  discount_type: "percent" | "flat"
  discount_value: number
  min_order: number
  max_discount: number
  usage_limit: number
  used_count: number
  is_active: boolean
  expires_at: string | null
  reward_type: "discount" | "freebie"
  freebie_name: string | null
}
import { Megaphone } from "lucide-react"

interface OfferCard {
  id: string
  position: number
  title: string
  description: string
  coupon_code: string | null
  cta_text: string
}

import {
  Package,
  IndianRupee,
  Users,
  UtensilsCrossed,
  Plus,
  Trash2,
  Loader2,
  ImagePlus,
  X,
  Eye, EyeOff,
  Tag,
  Edit2,
  Search,
} from "lucide-react"
import { DashboardStatsSkeleton, AdminOrderSkeleton, AdminFoodSkeleton } from "@/components/skeleton-loaders"

interface Food {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  availability: boolean
  is_veg?: boolean
  preparation_time?: number
}

interface OrderItem { name: string; quantity: number; price: number }
interface Order {
  id: string
  customer_name: string
  customer_phone: string
  order_items: OrderItem[]
  total_amount: number
  payment_status: string
  order_status: string
  payment_method: string
  created_at: string
  delivery_address?: string
  freebie_item?: string
}

interface Stats {
  totalOrders: number
  totalFoods: number
  totalUsers: number
  totalRevenue: number
  recentOrders: Order[]
}



export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { activeTab, setActiveTab } = useAdminTab()
  const audioContextRef = useRef<AudioContext | null>(null)

  // Play a two-tone notification beep using Web Audio API
  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const now = ctx.currentTime

      // First tone: C5 (523 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = "sine"
      osc1.frequency.value = 523
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc1.connect(gain1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.15)

      // Second tone: E5 (659 Hz)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.value = 659
      gain2.gain.setValueAtTime(0.3, now + 0.18)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
      osc2.connect(gain2).connect(ctx.destination)
      osc2.start(now + 0.18)
      osc2.stop(now + 0.35)
    } catch {
      // Audio not available, silently ignore
    }
  }

  // Stats
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Foods
  const [foods, setFoods] = useState<Food[]>([])
  const [foodsLoading, setFoodsLoading] = useState(true)

  // Add / Edit food form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [editFoodId, setEditFoodId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [newFood, setNewFood] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    preparation_time: "",
    is_veg: "true",
  })

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")

  // Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({ delivery_fee: 40, gst_percent: 5, free_delivery_above: 0, is_store_open: true, store_opens_at: null, banner_image: null, banner_enabled: false })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [couponSaving, setCouponSaving] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    rewardType: "discount" as "discount" | "freebie",
    discountType: "percent" as "percent" | "flat",
    discountValue: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    freebieName: "",
  })

  // Offer Cards
  const [offerCards, setOfferCards] = useState<OfferCard[]>([])
  const [offerCardsLoading, setOfferCardsLoading] = useState(true)
  const [offerSaving, setOfferSaving] = useState<number | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Fetch stats via Supabase
  useEffect(() => {
    if (authLoading) return
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const [ordersResult, foodsResult, usersResult] = await Promise.all([
          supabase.from('orders').select('id, total_amount, payment_status'),
          supabase.from('foods').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        const allOrders = ordersResult.data || []
        const paidOrders = allOrders.filter(o => o.payment_status === 'paid')
        const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)

        // Fetch recent orders with items
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false })
          .limit(5)

        setStats({
          totalOrders: allOrders.length,
          totalFoods: foodsResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalRevenue,
          recentOrders: recentOrders || [],
        })
      } catch { /* ignore */ } finally {
        setStatsLoading(false)
      }
    }
    if (user?.role === "admin") fetchStats()
  }, [user, authLoading])

  // Fetch all foods (admin sees unavailable too)
  useEffect(() => {
    if (authLoading) return
    const fetchFoods = async () => {
      setFoodsLoading(true)
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setFoods(data || [])
      } catch { /* ignore */ } finally {
        setFoodsLoading(false)
      }
    }
    if (user?.role === "admin") fetchFoods()
  }, [user, authLoading])

  // Fetch orders + Supabase Realtime for new/updated orders
  useEffect(() => {
    if (authLoading || user?.role !== "admin") return

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false })
        if (error) throw error
        setOrders(data || [])
      } catch { /* ignore */ } finally {
        setOrdersLoading(false)
      }
    }
    fetchOrders()

    // Real-time: listen for new & updated orders + foods
    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const { data: newOrder } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', payload.new.id)
            .single()
          if (newOrder) {
            setOrders((prev) => [newOrder, ...prev])
            // Update stats
            setStats((prev) => prev ? {
              ...prev,
              totalOrders: prev.totalOrders + 1,
              totalRevenue: newOrder.payment_status === 'paid'
                ? prev.totalRevenue + Number(newOrder.total_amount)
                : prev.totalRevenue,
              recentOrders: [newOrder, ...prev.recentOrders].slice(0, 5),
            } : prev)
            toast.success(`🔔 New order from ${newOrder.customer_name || "Customer"}!`)
            playNotificationSound()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o)))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'foods' },
        async () => {
          // Refresh foods list when any food is added/updated/deleted
          const { data } = await supabase.from('foods').select('*').order('created_at', { ascending: false })
          if (data) setFoods(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, authLoading])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile && !editFoodId) {
      toast.error("Please select an image")
      return
    }

    setAddLoading(true)
    try {
      let imageUrl = imagePreview

      // Upload new image to Supabase Storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `food-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}. Make sure Supabase Storage bucket 'food-images' exists and is set to public.`)
        }

        const { data: publicUrlData } = supabase.storage
          .from('food-images')
          .getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
      }

      const payload = {
        name: newFood.name,
        description: newFood.description,
        price: parseFloat(newFood.price),
        category: newFood.category,
        image: imageUrl,
        is_veg: newFood.is_veg === "true",
        preparation_time: newFood.preparation_time ? parseInt(newFood.preparation_time) : null,
      }

      if (editFoodId) {
        const { data: updatedFood, error } = await supabase
          .from('foods')
          .update(payload)
          .eq('id', editFoodId)
          .select()
          .single()
        if (error) throw error
        setFoods((prev) => prev.map(f => f.id === editFoodId ? updatedFood : f))
        toast.success("Food item updated!")
      } else {
        const { data: food, error } = await supabase
          .from('foods')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setFoods((prev) => [food, ...prev])
        toast.success("Food item added!")
      }

      setNewFood({ name: "", description: "", price: "", category: "", preparation_time: "", is_veg: "true" })
      setImageFile(null)
      setImagePreview("")
      setEditFoodId(null)
      setShowAddForm(false)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Failed to save food item")
    } finally {
      setAddLoading(false)
    }
  }

  const handleEditClick = (food: Food) => {
    setEditFoodId(food.id)
    setNewFood({
      name: food.name,
      description: food.description,
      price: food.price.toString(),
      category: food.category,
      preparation_time: food.preparation_time?.toString() || "",
      is_veg: food.is_veg !== false ? "true" : "false",
    })
    setImagePreview(food.image)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteFood = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    try {
      const { error } = await supabase.from('foods').delete().eq('id', id)
      if (error) throw error
      setFoods((prev) => prev.filter((f) => f.id !== id))
      toast.success("Food item deleted")
    } catch {
      toast.error("Failed to delete food item")
    }
  }

  const handleToggleFoodAvailability = async (id: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('foods')
        .update({ availability: !currentAvailability })
        .eq('id', id)
      if (error) throw error
      setFoods((prev) =>
        prev.map((f) => (f.id === id ? { ...f, availability: !currentAvailability } : f))
      )
      toast.success(currentAvailability ? "Marked Out of Stock" : "Marked In Stock")
    } catch {
      toast.error("Failed to update availability")
    }
  }

  const handleUpdateOrderStatus = async (id: string, orderStatus: string) => {
    try {
      const updates: Record<string, string> = { order_status: orderStatus }
      if (orderStatus === 'delivered') updates.payment_status = 'paid'

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)))
      toast.success(`Order status updated to ${orderStatus}`)
    } catch {
      toast.error("Failed to update order")
    }
  }

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true)
      try {
        const { data, error } = await supabase.from('settings').select('*').single()
        if (error) throw error
        if (data) setAppSettings(data)
      } catch { /* ignore */ } finally {
        setSettingsLoading(false)
      }
    }
    if (user?.role === "admin") fetchSettings()
  }, [user])

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setCoupons(data || [])
      } catch { /* ignore */ } finally {
        setCouponsLoading(false)
      }
    }
    if (user?.role === "admin") fetchCoupons()
  }, [user])

  // Fetch offer cards
  useEffect(() => {
    const fetchOfferCards = async () => {
      try {
        const { data, error } = await supabase
          .from('offer_cards')
          .select('*')
          .order('position', { ascending: true })
        if (error) throw error
        setOfferCards(data || [])
      } catch { /* ignore */ } finally {
        setOfferCardsLoading(false)
      }
    }
    if (user?.role === "admin") fetchOfferCards()
  }, [user])

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      const { id, ...settingsWithoutId } = appSettings
      const { data, error } = await supabase
        .from('settings')
        .update(settingsWithoutId)
        .eq('id', id || '')
        .select()
        .single()
      if (error) throw error
      if (data) setAppSettings(data)
      toast.success("Settings saved!")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponSaving(true)
    try {
      const insertPayload: Record<string, unknown> = {
        code: newCoupon.code.toUpperCase(),
        reward_type: newCoupon.rewardType,
        min_order: newCoupon.minOrder ? parseFloat(newCoupon.minOrder) : 0,
        usage_limit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : 0,
        expires_at: newCoupon.expiresAt || null,
      }
      if (newCoupon.rewardType === 'freebie') {
        insertPayload.freebie_name = newCoupon.freebieName
        insertPayload.discount_type = 'flat'
        insertPayload.discount_value = 0
        insertPayload.max_discount = 0
      } else {
        insertPayload.discount_type = newCoupon.discountType
        insertPayload.discount_value = parseFloat(newCoupon.discountValue)
        insertPayload.max_discount = newCoupon.maxDiscount ? parseFloat(newCoupon.maxDiscount) : 0
      }
      const { data, error } = await supabase
        .from('coupons')
        .insert(insertPayload)
        .select()
        .single()
      if (error) throw error
      setCoupons((prev) => [data, ...prev])
      setNewCoupon({ code: "", rewardType: "discount", discountType: "percent", discountValue: "", minOrder: "", maxDiscount: "", usageLimit: "", expiresAt: "", freebieName: "" })
      setShowCouponForm(false)
      toast.success("Coupon created!")
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Failed to create coupon")
    } finally {
      setCouponSaving(false)
    }
  }

  const handleSaveOfferCard = async (card: OfferCard) => {
    setOfferSaving(card.position)
    try {
      const { error } = await supabase
        .from('offer_cards')
        .update({
          title: card.title,
          description: card.description,
          coupon_code: card.coupon_code || null,
          cta_text: card.cta_text,
        })
        .eq('id', card.id)
      if (error) throw error
      toast.success(`Offer card ${card.position} saved!`)
    } catch {
      toast.error("Failed to save offer card")
    } finally {
      setOfferSaving(null)
    }
  }

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      toast.success("Coupon deleted")
    } catch {
      toast.error("Failed to delete coupon")
    }
  }

  return (
    <div className="space-y-6">

      {/* Mobile Tab Navigation — only shows on small screens */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {(["dashboard", "orders", "foods", "settings", "coupons", "offers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ==================== DASHBOARD TAB ==================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-1">Overview of your cloud kitchen</p>
          </div>

          {statsLoading ? (
            <DashboardStatsSkeleton />
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-400" },
                  { title: "Orders", value: stats.totalOrders.toString(), icon: Package, color: "text-blue-400" },
                  { title: "Food Items", value: stats.totalFoods.toString(), icon: UtensilsCrossed, color: "text-primary" },
                  { title: "Total Users", value: stats.totalUsers.toString(), icon: Users, color: "text-purple-400" },
                ].map((stat) => (
                  <Card key={stat.title} className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Orders */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentOrders.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No orders yet</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {(order.customer_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{order.customer_name || "Customer"}</p>
                            <p className="text-xs text-muted-foreground">
                              {(order.order_items || []).length} items · {order.payment_method === "cod" ? "COD" : "Online"} · {order.order_status}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-green-400">₹{Number(order.total_amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* ==================== FOODS TAB ==================== */}
      {activeTab === "foods" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Food Items</h2>
              <p className="text-muted-foreground text-sm mt-1">{foods.length} items in menu</p>
            </div>
            <Button
              onClick={() => {
                if (showAddForm) {
                  setShowAddForm(false)
                  setEditFoodId(null)
                  setNewFood({ name: "", description: "", price: "", category: "", preparation_time: "", is_veg: "true" })
                  setImageFile(null)
                  setImagePreview("")
                } else {
                  setShowAddForm(true)
                }
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddForm ? "Cancel" : "Add Item"}
            </Button>
          </div>

          {/* Add Food Form */}
          {showAddForm && (
            <Card className="bg-card border-border border-primary/20">
              <CardContent className="pt-6">
                <form onSubmit={handleAddFood} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Name</Label>
                      <Input
                        required
                        placeholder="e.g. Chicken Biryani"
                        value={newFood.name}
                        onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Category</Label>
                      <Input
                        required
                        placeholder="e.g. Pizza, Burger, Dessert"
                        value={newFood.category}
                        onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Description</Label>
                    <Input
                      required
                      placeholder="Short description of the dish"
                      value={newFood.description}
                      onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                      className="h-10 rounded-xl bg-secondary border-border"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Price (₹)</Label>
                      <Input
                        required
                        type="number"
                        min="1"
                        placeholder="299"
                        value={newFood.price}
                        onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Prep Time (min)</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={newFood.preparation_time}
                        onChange={(e) => setNewFood({ ...newFood, preparation_time: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-sm">Type</Label>
                       <select
                         value={newFood.is_veg}
                         onChange={(e) => setNewFood({ ...newFood, is_veg: e.target.value })}
                         className="w-full h-10 rounded-xl bg-secondary border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                       >
                         <option value="true">Veg</option>
                         <option value="false">Non-Veg</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Image</Label>
                      <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary border border-border cursor-pointer hover:border-primary/30 transition-colors">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">
                          {imageFile ? imageFile.name : "Choose image"}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview("") }}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={addLoading}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editFoodId ? <Edit2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editFoodId ? "Update Food Item" : "Add Food Item"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Food List */}
          {foodsLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AdminFoodSkeleton key={i} />
              ))}
            </div>
          ) : foods.length === 0 ? (
            <div className="text-center py-16">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No food items yet. Click &quot;Add Item&quot; to start.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
                >
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                    <Image src={food.image} alt={food.name} fill className="object-cover" />
                  </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg truncate flex-1">{food.name}</h3>
                          <button
                            onClick={() => handleToggleFoodAvailability(food.id, food.availability)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                              food.availability
                                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            }`}
                          >
                            {food.availability ? "In Stock" : "Out of Stock"}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg text-primary font-medium border border-border">{food.category}</span>
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border border-border ${food.is_veg !== false ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${food.is_veg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                            {food.is_veg !== false ? 'Veg' : 'Non-Veg'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{food.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary flex-shrink-0">₹{food.price}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => handleToggleFoodAvailability(food.id, food.availability)}
                      title={food.availability ? "Mark unavailable" : "Mark available"}
                    >
                      {food.availability ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                      onClick={() => handleEditClick(food)}
                      title="Edit food"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteFood(food.id)}
                      title="Delete food"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== ORDERS TAB ==================== */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Orders</h2>
              <p className="text-muted-foreground text-sm mt-1">{orders.length} total orders</p>
            </div>
            <div className="flex gap-3">
              <div className="relative w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-secondary border-border text-sm"
                />
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-secondary border border-border text-sm"
              >
                <option value="all">All Status</option>
                <option value="placed">Placed</option>
                <option value="preparing">Preparing</option>
                <option value="out-for-delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {ordersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <AdminOrderSkeleton key={i} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          ) : (() => {
            const filtered = orders.filter(order => {
              const matchesSearch = !orderSearch || (order.customer_name || "").toLowerCase().includes(orderSearch.toLowerCase())
              const matchesStatus = orderStatusFilter === "all" || order.order_status === orderStatusFilter
              return matchesSearch && matchesStatus
            })
            if (filtered.length === 0) return (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No orders matching filters</p>
              </div>
            )
            return (
            <div className="space-y-4">
              {filtered.map((order) => (
                <Card key={order.id} className="bg-card border-border">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        {/* Customer info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                            {(order.customer_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {order.customer_name || "Guest"}
                            </p>
                          </div>
                        </div>

                        {/* Delivery & payment info */}
                        <div className="flex items-center gap-2 flex-wrap ml-12">
                          {order.customer_phone && (
                            <span className="text-xs text-muted-foreground">📞 {order.customer_phone}</span>
                          )}
                          {order.delivery_address && (
                            <span className="text-xs text-muted-foreground mr-2">📍 {order.delivery_address}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-lg ${
                            order.payment_method === "cod"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {order.payment_method === "cod" ? "COD" : "Online"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-lg ${
                            order.payment_status === "paid"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-orange-500/10 text-orange-400"
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>

                        {/* Order items */}
                        <div className="mt-3 ml-12 space-y-1">
                          {(order.order_items || []).map((item, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {item.quantity}× {item.name} — ₹{item.price * item.quantity}
                            </p>
                          ))}
                          {order.freebie_item && (
                            <p className="text-xs text-green-500 font-medium">
                              🎁 Free {order.freebie_item}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 ml-12">
                          {new Date(order.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-primary">₹{Number(order.total_amount)}</span>
                        <select
                          value={order.order_status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`text-xs px-3 py-1.5 rounded-lg border bg-secondary border-border ${
                            order.order_status === "delivered"
                              ? "text-green-400"
                              : order.order_status === "cancelled"
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                        >
                          <option value="placed">Placed</option>
                          <option value="preparing">Preparing</option>
                          <option value="out-for-delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )
          })()}
        </div>
      )}

      {/* ==================== SETTINGS TAB ==================== */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-muted-foreground text-sm mt-1">Configure delivery fees, GST, and charges</p>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-6">
              {settingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Store Status Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Store Status</h3>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center p-4 rounded-xl bg-secondary/50 border border-border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={appSettings.is_store_open}
                              onChange={async (e) => {
                                const newStatus = e.target.checked
                                setAppSettings({ ...appSettings, is_store_open: newStatus })
                                try {
                                  const { error } = await supabase
                                    .from('settings')
                                    .update({ is_store_open: newStatus })
                                    .eq('id', appSettings.id || '')
                                  if (error) throw error
                                  toast.success(`Store is now ${newStatus ? 'Open' : 'Closed'}`)
                                } catch {
                                  toast.error("Failed to update store status")
                                  setAppSettings({ ...appSettings, is_store_open: !newStatus })
                                }
                              }}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                          <span className={`font-medium ${appSettings.is_store_open ? "text-green-400" : "text-destructive"}`}>
                            {appSettings.is_store_open ? "Accepting Orders" : "Closed"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mr-4">
                          {appSettings.is_store_open
                            ? "Toggle to immediately stop accepting new orders across the platform."
                            : "The store is currently closed. Users cannot place new orders."}
                        </p>
                      </div>

                      {!appSettings.is_store_open && (
                        <div className="shrink-0 space-y-2">
                          <Label className="text-xs">Opening At (Optional Countdown)</Label>
                          <Input
                            type="datetime-local"
                            value={appSettings.store_opens_at ? new Date(appSettings.store_opens_at).toISOString().slice(0, 16) : ""}
                            onChange={async (e) => {
                              const newValue = e.target.value || null
                              setAppSettings({ ...appSettings, store_opens_at: newValue })
                              try {
                                const { error } = await supabase
                                  .from('settings')
                                  .update({ store_opens_at: newValue })
                                  .eq('id', appSettings.id || '')
                                if (error) throw error
                                toast.success("Opening time updated")
                              } catch {
                                toast.error("Failed to update opening time")
                              }
                            }}
                            className="h-9 rounded-lg bg-background border-border text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Fees Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fees & Charges</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Delivery Fee (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={appSettings.delivery_fee}
                        onChange={(e) => setAppSettings({ ...appSettings, delivery_fee: parseFloat(e.target.value) || 0 })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">GST (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={appSettings.gst_percent}
                        onChange={(e) => setAppSettings({ ...appSettings, gst_percent: parseFloat(e.target.value) || 0 })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Free Delivery Above (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 = disabled"
                        value={appSettings.free_delivery_above}
                        onChange={(e) => setAppSettings({ ...appSettings, free_delivery_above: parseFloat(e.target.value) || 0 })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                      <p className="text-[11px] text-muted-foreground">Set to 0 to always charge delivery fee</p>
                    </div>
                  </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Promo Banner */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Promo Banner (Homepage Popup)</h3>
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={appSettings.banner_enabled}
                          onChange={async () => {
                            const newVal = !appSettings.banner_enabled
                            setAppSettings({ ...appSettings, banner_enabled: newVal })
                            try {
                              await supabase.from('settings').update({ banner_enabled: newVal }).eq('id', appSettings.id || '')
                              toast.success(newVal ? "Banner enabled" : "Banner disabled")
                            } catch {
                              toast.error("Failed to update")
                              setAppSettings({ ...appSettings, banner_enabled: !newVal })
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                      <span className={`text-sm font-medium ${appSettings.banner_enabled ? "text-green-400" : "text-muted-foreground"}`}>
                        {appSettings.banner_enabled ? "Banner Active" : "Banner Off"}
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <Label className="text-sm">Banner Image</Label>
                        <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary border border-border cursor-pointer hover:border-primary/30 transition-colors">
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate">Upload poster image (4:5 ratio recommended)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                const fileExt = file.name.split('.').pop()
                                const fileName = `banner-${Date.now()}.${fileExt}`
                                const filePath = `banners/${fileName}`
                                const { error: uploadError } = await supabase.storage
                                  .from('food-images')
                                  .upload(filePath, file, { cacheControl: '3600', upsert: false })
                                if (uploadError) throw uploadError
                                const { data: publicUrlData } = supabase.storage.from('food-images').getPublicUrl(filePath)
                                const url = publicUrlData.publicUrl
                                setAppSettings({ ...appSettings, banner_image: url })
                                await supabase.from('settings').update({ banner_image: url }).eq('id', appSettings.id || '')
                                toast.success("Banner image uploaded!")
                              } catch {
                                toast.error("Failed to upload banner image")
                              }
                            }}
                          />
                        </label>
                      </div>
                      {appSettings.banner_image && (
                        <div className="relative w-20 h-[100px] rounded-xl overflow-hidden border border-border flex-shrink-0">
                          <Image src={appSettings.banner_image} alt="Banner preview" fill className="object-cover" unoptimized />
                          <button
                            type="button"
                            onClick={async () => {
                              setAppSettings({ ...appSettings, banner_image: null })
                              await supabase.from('settings').update({ banner_image: null }).eq('id', appSettings.id || '')
                              toast.success("Banner image removed")
                            }}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    {settingsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== COUPONS TAB ==================== */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Coupons</h2>
              <p className="text-muted-foreground text-sm mt-1">{coupons.length} coupons</p>
            </div>
            <Button
              onClick={() => setShowCouponForm(!showCouponForm)}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {showCouponForm ? <X className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
              {showCouponForm ? "Cancel" : "New Coupon"}
            </Button>
          </div>

          {/* Add Coupon Form */}
          {showCouponForm && (
            <Card className="bg-card border-border border-primary/20">
              <CardContent className="pt-6">
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Coupon Code</Label>
                      <Input
                        required
                        placeholder="e.g. FREECOKE"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        className="h-10 rounded-xl bg-secondary border-border uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Reward Type</Label>
                      <select
                        value={newCoupon.rewardType}
                        onChange={(e) => setNewCoupon({ ...newCoupon, rewardType: e.target.value as "discount" | "freebie" })}
                        className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm"
                      >
                        <option value="discount">💰 Discount</option>
                        <option value="freebie">🎁 Freebie</option>
                      </select>
                    </div>
                  </div>

                  {newCoupon.rewardType === "freebie" ? (
                    <div className="space-y-2">
                      <Label className="text-sm">Freebie Item Name</Label>
                      <Input
                        required
                        placeholder="e.g. 750ml Coca-Cola, Ice Cream"
                        value={newCoupon.freebieName}
                        onChange={(e) => setNewCoupon({ ...newCoupon, freebieName: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">Discount Type</Label>
                      <select
                        value={newCoupon.discountType}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as "percent" | "flat" })}
                        className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                      </select>
                    </div>
                  )}

                  <div className={`grid gap-4 ${newCoupon.rewardType === 'freebie' ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
                    {newCoupon.rewardType === "discount" && (
                      <div className="space-y-2">
                        <Label className="text-sm">Discount Value</Label>
                        <Input
                          required
                          type="number"
                          min="1"
                          placeholder={newCoupon.discountType === "percent" ? "e.g. 20" : "e.g. 50"}
                          value={newCoupon.discountValue}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm">Min Order (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newCoupon.minOrder}
                        onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                    {newCoupon.rewardType === "discount" && (
                      <div className="space-y-2">
                        <Label className="text-sm">Max Discount (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0 = no cap"
                          value={newCoupon.maxDiscount}
                          onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm">Usage Limit</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 = unlimited"
                        value={newCoupon.usageLimit}
                        onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                        className="h-10 rounded-xl bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Expires At (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={newCoupon.expiresAt}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                      className="h-10 rounded-xl bg-secondary border-border w-auto"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={couponSaving}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {couponSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                    Create Coupon
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Coupon List */}
          {couponsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No coupons yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm font-mono">{coupon.code}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${coupon.is_active ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {coupon.reward_type === "freebie"
                        ? `🎁 Free ${coupon.freebie_name}`
                        : coupon.discount_type === "percent" ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`
                      }
                      {coupon.min_order > 0 && ` · Min ₹${coupon.min_order}`}
                      {coupon.reward_type === "discount" && coupon.max_discount > 0 && ` · Max ₹${coupon.max_discount}`}
                      {coupon.usage_limit > 0 && ` · ${coupon.used_count}/${coupon.usage_limit} used`}
                      {coupon.expires_at && ` · Expires ${new Date(coupon.expires_at).toLocaleDateString("en-IN")}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ==================== OFFERS TAB ==================== */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" /> Offer Cards
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Edit the 3 offer cards shown on the homepage</p>
          </div>

          {offerCardsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : offerCards.length === 0 ? (
            <div className="text-center py-16">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No offer cards found. Run the migration SQL first.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {offerCards.map((card) => (
                <Card key={card.id} className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">Card {card.position}</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Title</Label>
                        <Input
                          value={card.title}
                          onChange={(e) => setOfferCards(prev => prev.map(c => c.id === card.id ? { ...c, title: e.target.value } : c))}
                          placeholder="e.g. Flat 15% OFF"
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">CTA Button Text</Label>
                        <Input
                          value={card.cta_text}
                          onChange={(e) => setOfferCards(prev => prev.map(c => c.id === card.id ? { ...c, cta_text: e.target.value } : c))}
                          placeholder="e.g. Claim Now →"
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Description</Label>
                        <Input
                          value={card.description}
                          onChange={(e) => setOfferCards(prev => prev.map(c => c.id === card.id ? { ...c, description: e.target.value } : c))}
                          placeholder="Offer description..."
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Coupon Code (optional, shown bold)</Label>
                        <Input
                          value={card.coupon_code || ""}
                          onChange={(e) => setOfferCards(prev => prev.map(c => c.id === card.id ? { ...c, coupon_code: e.target.value || null } : c))}
                          placeholder="e.g. KRAVINGS15"
                          className="h-10 rounded-xl bg-secondary border-border uppercase"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <p className="text-sm font-display font-bold">{card.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.description}
                        {card.coupon_code && (
                          <>
                            {" "}
                            <span className="font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded text-[11px]">{card.coupon_code}</span>
                            {" at checkout."}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSaveOfferCard(card)}
                      disabled={offerSaving === card.position}
                      className="mt-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-6 text-sm"
                    >
                      {offerSaving === card.position ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Card {card.position}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
