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
import api from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useAdminTab } from "./layout"
import { ReviewsTab } from "@/components/admin-reviews-tab"

interface AppSettings {
  id?: string
  delivery_fee: number
  custom_charge_label: string | null
  custom_charge_type: 'flat' | 'percent'
  custom_charge_value: number
  free_delivery_above: number
  is_store_open: boolean
  store_opens_at: string | null
  closed_message: string | null
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
  per_user_limit: number
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
  Ban,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Volume2,
  VolumeX,
  Timer,
  Mail,
  Send,
  Image as ImageIcon,
  CalendarDays,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
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
  user_id?: string
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
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [, setTick] = useState(0) // Force re-render for prep timer
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Tick every 30s to update prep timers
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  // Show browser desktop notification
  const showDesktopNotification = (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'new-order',
      })
    }
  }

  // Play beep tones using Web Audio API
  const playBeepTones = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const now = ctx.currentTime

      // Add a compressor to maximize loudness without distortion
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.setValueAtTime(-10, now)
      compressor.knee.setValueAtTime(0, now)
      compressor.ratio.setValueAtTime(20, now)
      compressor.attack.setValueAtTime(0, now)
      compressor.release.setValueAtTime(0.05, now)
      compressor.connect(ctx.destination)

      // 5 urgent beep cycles — ascending urgency pattern
      for (let i = 0; i < 5; i++) {
        const offset = i * 0.6

        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = "square"
        osc1.frequency.value = 587
        gain1.gain.setValueAtTime(1.0, now + offset)
        gain1.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15)
        osc1.connect(gain1).connect(compressor)
        osc1.start(now + offset)
        osc1.stop(now + offset + 0.15)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = "square"
        osc2.frequency.value = 880
        gain2.gain.setValueAtTime(1.0, now + offset + 0.18)
        gain2.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.35)
        osc2.connect(gain2).connect(compressor)
        osc2.start(now + offset + 0.18)
        osc2.stop(now + offset + 0.35)

        const osc3 = ctx.createOscillator()
        const gain3 = ctx.createGain()
        osc3.type = "square"
        osc3.frequency.value = 1175
        gain3.gain.setValueAtTime(1.0, now + offset + 0.38)
        gain3.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.55)
        osc3.connect(gain3).connect(compressor)
        osc3.start(now + offset + 0.38)
        osc3.stop(now + offset + 0.55)
      }
    } catch {
      // Audio not available, silently ignore
    }
  }

  // Get a female voice from available browser voices
  const getFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    // Prefer female/girl voices — common names across browsers
    const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'samantha', 'karen', 'victoria', 'fiona', 'moira', 'tessa', 'veena', 'google uk english female', 'microsoft zira']
    const femaleVoice = voices.find(v =>
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    )
    // Fallback: any English voice
    return femaleVoice || voices.find(v => v.lang.startsWith('en')) || null
  }

  // Speak "New Order for Kravings Kitchen" using Speech Synthesis API (female voice)
  const speakNewOrder = (times: number = 2): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve()
        return
      }
      let count = 0
      const speakOnce = () => {
        if (count >= times) {
          resolve()
          return
        }
        const utterance = new SpeechSynthesisUtterance("New Order for Kravings Kitchen!")
        utterance.volume = 1.0
        utterance.rate = 1.0
        utterance.pitch = 1.3
        const voice = getFemaleVoice()
        if (voice) utterance.voice = voice
        utterance.onend = () => {
          count++
          setTimeout(speakOnce, 400)
        }
        utterance.onerror = () => {
          count++
          setTimeout(speakOnce, 400)
        }
        window.speechSynthesis.speak(utterance)
      }
      speakOnce()
    })
  }

  // Full notification: [Beep → Voice × 2 → Beep] × 2
  const playNotificationSound = async () => {
    for (let round = 0; round < 2; round++) {
      // Beep start
      playBeepTones()
      await new Promise(r => setTimeout(r, 3200))

      // Voice: "New Order for Kravings Kitchen!" × 2
      await speakNewOrder(2)

      // Beep end
      playBeepTones()
      await new Promise(r => setTimeout(r, 3200))

      // Small pause before next round
      if (round < 4) await new Promise(r => setTimeout(r, 800))
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

  // Food search & filter
  const [foodSearch, setFoodSearch] = useState("")
  const [foodCategoryFilter, setFoodCategoryFilter] = useState("all")

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")

  // Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({ delivery_fee: 40, custom_charge_label: null, custom_charge_type: 'flat', custom_charge_value: 0, free_delivery_above: 0, is_store_open: true, store_opens_at: null, closed_message: null, banner_image: null, banner_enabled: false })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [couponSaving, setCouponSaving] = useState(false)
  const [editCouponId, setEditCouponId] = useState<string | null>(null)
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    rewardType: "discount" as "discount" | "freebie",
    discountType: "percent" as "percent" | "flat",
    discountValue: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "1",
    expiresAt: "",
    freebieName: "",
  })

  // New orders badge
  const { setNewOrderBadge, newOrderBadge } = useAdminTab()

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
          supabase.from('orders').select('id, total_amount, payment_status, order_status'),
          supabase.from('foods').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        const allOrders = ordersResult.data || []
        const deliveredOrders = allOrders.filter(o => o.order_status === 'delivered')
        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)

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
            // Update stats (don't add revenue yet — only count on delivery)
            setStats((prev) => prev ? {
              ...prev,
              totalOrders: prev.totalOrders + 1,
              recentOrders: [newOrder, ...prev.recentOrders].slice(0, 5),
            } : prev)
            // Increment new order badge
            setNewOrderBadge(prev => prev + 1)
            const orderTotal = `₹${Number(newOrder.total_amount)}`
            const customerName = newOrder.customer_name || "Customer"
            toast.success(`🔔 New order from ${customerName}!`)
            if (soundEnabled) playNotificationSound()
            showDesktopNotification(
              `🔔 New Order — ${orderTotal}`,
              `${customerName} just placed an order${newOrder.order_items?.length ? ` (${newOrder.order_items.length} items)` : ''}`
            )
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as Order
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
          // Add revenue when order is delivered
          if (updated.order_status === 'delivered') {
            setStats((prev) => prev ? {
              ...prev,
              totalRevenue: prev.totalRevenue + Number(updated.total_amount),
            } : prev)
          }
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

      // Delivery email is sent automatically by the server-side
      // Realtime listener (orderEmailListener) when status changes to 'delivered'.
    } catch {
      toast.error("Failed to update order")
    }
  }

  // Anti-spam: Compute trust score for an order
  const getOrderTrustScore = (order: Order): { level: 'trusted' | 'review' | 'suspicious'; reasons: string[] } => {
    const reasons: string[] = []
    const userId = order.user_id

    if (userId) {
      // Count orders by same user in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentByUser = orders.filter(
        o => o.user_id === userId && new Date(o.created_at) > oneHourAgo
      ).length
      if (recentByUser >= 3) reasons.push(`${recentByUser} orders in last hour`)

      // Count cancelled orders by same user
      const cancelledByUser = orders.filter(
        o => o.user_id === userId && o.order_status === 'cancelled'
      ).length
      if (cancelledByUser >= 3) reasons.push(`${cancelledByUser} cancelled orders`)
    }

    // Check same phone across different accounts
    if (order.customer_phone) {
      const phoneMappings = new Set(
        orders
          .filter(o => o.customer_phone === order.customer_phone && o.user_id)
          .map(o => o.user_id)
      )
      if (phoneMappings.size > 1) reasons.push('Phone used by multiple accounts')
    }

    if (reasons.length >= 2) return { level: 'suspicious', reasons }
    if (reasons.length === 1) return { level: 'review', reasons }
    return { level: 'trusted', reasons: [] }
  }

  // Anti-spam: Block/Unblock a user
  const handleToggleBlockUser = async (userId: string, currentlyBlocked: boolean, customerName: string) => {
    if (currentlyBlocked) {
      // Unblock
      if (!confirm(`Unblock ${customerName}? They will be able to place orders again.`)) return
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: false, block_reason: null })
          .eq('id', userId)
        if (error) throw error
        setBlockedUsers(prev => { const next = new Set(prev); next.delete(userId); return next })
        toast.success(`${customerName} has been unblocked`)
      } catch {
        toast.error('Failed to unblock user')
      }
    } else {
      // Block
      const reason = prompt(`Block ${customerName}? Enter a reason (optional):`, 'Suspicious order activity')
      if (reason === null) return // cancelled
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: true, block_reason: reason || 'Blocked by admin' })
          .eq('id', userId)
        if (error) throw error
        setBlockedUsers(prev => new Set(prev).add(userId))
        toast.success(`${customerName} has been blocked`)
      } catch {
        toast.error('Failed to block user')
      }
    }
  }

  // Check if a user is blocked (from profiles cache or quick lookup)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_blocked', true)
        if (data) setBlockedUsers(new Set(data.map(p => p.id)))
      } catch { /* ignore */ }
    }
    if (user?.role === 'admin') fetchBlockedUsers()
  }, [user])

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

  const handleEditCouponClick = (coupon: Coupon) => {
    setEditCouponId(coupon.id)
    setNewCoupon({
      code: coupon.code,
      rewardType: coupon.reward_type,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value.toString(),
      minOrder: coupon.min_order.toString(),
      maxDiscount: coupon.max_discount.toString(),
      usageLimit: coupon.usage_limit.toString(),
      perUserLimit: (coupon.per_user_limit ?? 1).toString(),
      expiresAt: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "",
      freebieName: coupon.freebie_name || "",
    })
    setShowCouponForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponSaving(true)
    try {
      const payload: Record<string, unknown> = {
        code: newCoupon.code.toUpperCase(),
        reward_type: newCoupon.rewardType,
        min_order: newCoupon.minOrder ? parseFloat(newCoupon.minOrder) : 0,
        usage_limit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : 0,
        per_user_limit: newCoupon.perUserLimit ? parseInt(newCoupon.perUserLimit) : 1,
        expires_at: newCoupon.expiresAt || null,
      }
      if (newCoupon.rewardType === 'freebie') {
        payload.freebie_name = newCoupon.freebieName
        payload.discount_type = 'flat'
        payload.discount_value = 0
        payload.max_discount = 0
      } else {
        payload.discount_type = newCoupon.discountType
        payload.discount_value = parseFloat(newCoupon.discountValue)
        payload.max_discount = newCoupon.maxDiscount ? parseFloat(newCoupon.maxDiscount) : 0
      }

      if (editCouponId) {
        // Update existing coupon
        const { data, error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editCouponId)
          .select()
          .single()
        if (error) throw error
        setCoupons((prev) => prev.map(c => c.id === editCouponId ? data : c))
        toast.success("Coupon updated!")
      } else {
        // Create new coupon
        const { data, error } = await supabase
          .from('coupons')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setCoupons((prev) => [data, ...prev])
        toast.success("Coupon created!")
      }
      setNewCoupon({ code: "", rewardType: "discount", discountType: "percent", discountValue: "", minOrder: "", maxDiscount: "", usageLimit: "", perUserLimit: "1", expiresAt: "", freebieName: "" })
      setEditCouponId(null)
      setShowCouponForm(false)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Failed to save coupon")
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

  const handleToggleCouponActive = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentlyActive })
        .eq('id', id)
      if (error) throw error
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !currentlyActive } : c))
      )
      toast.success(currentlyActive ? "Coupon disabled" : "Coupon enabled")
    } catch {
      toast.error("Failed to update coupon")
    }
  }

  return (
    <div className="space-y-6">

      {/* Mobile Tab Navigation — only shows on small screens */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {(["dashboard", "orders", "foods", "settings", "coupons", "offers", "emails", "reviews"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "orders" && newOrderBadge > 0 && activeTab !== "orders" && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                {newOrderBadge}
              </span>
            )}
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
              {/* ── Today's Stats (2 AM business day) ── */}
              {(() => {
                // Business day boundary: 2 AM IST
                const now = new Date()
                const businessDayStart = new Date(now)
                businessDayStart.setHours(2, 0, 0, 0)
                if (now.getHours() < 2) businessDayStart.setDate(businessDayStart.getDate() - 1)

                const todayOrders = orders.filter(o => new Date(o.created_at) >= businessDayStart)
                const todayDelivered = todayOrders.filter(o => o.order_status === 'delivered')
                const todayRevenue = todayDelivered.reduce((sum, o) => sum + Number(o.total_amount), 0)

                return (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-card border-border border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Orders</CardTitle>
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{todayOrders.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Since {businessDayStart.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border border-green-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
                        <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-400">₹{todayRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Business day resets at 2:00 AM</p>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}

              {/* ── All-Time Stats ── */}
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

              {/* ── Calendar & Daily View ── */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Daily History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const year = calendarMonth.getFullYear()
                    const month = calendarMonth.getMonth()
                    const firstDay = new Date(year, month, 1).getDay()
                    const daysInMonth = new Date(year, month + 1, 0).getDate()
                    const today = new Date()
                    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

                    // Helper: get business day boundaries for a date
                    const getBusinessDay = (date: Date) => {
                      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 2, 0, 0)
                      const end = new Date(start)
                      end.setDate(end.getDate() + 1)
                      return { start, end }
                    }

                    // Precompute daily stats for the visible month
                    const dailyStats: Record<string, { count: number; revenue: number; orders: Order[] }> = {}
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateObj = new Date(year, month, d)
                      const { start, end } = getBusinessDay(dateObj)
                      const dayOrders = orders.filter(o => {
                        const t = new Date(o.created_at)
                        return t >= start && t < end
                      })
                      if (dayOrders.length > 0) {
                        const key = `${year}-${month}-${d}`
                        const deliveredDayOrders = dayOrders.filter(o => o.order_status === 'delivered')
                        dailyStats[key] = {
                          count: dayOrders.length,
                          revenue: deliveredDayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
                          orders: dayOrders,
                        }
                      }
                    }

                    const selectedKey = selectedCalendarDate
                      ? `${selectedCalendarDate.getFullYear()}-${selectedCalendarDate.getMonth()}-${selectedCalendarDate.getDate()}`
                      : null
                    const selectedStats = selectedKey ? dailyStats[selectedKey] || null : null

                    return (
                      <div className="space-y-4">
                        {/* Month navigation */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-semibold">{monthNames[month]} {year}</span>
                          <button
                            onClick={() => {
                              const next = new Date(year, month + 1, 1)
                              if (next <= today) setCalendarMonth(next)
                            }}
                            disabled={month === today.getMonth() && year === today.getFullYear()}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground font-medium">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d = i + 1
                            const key = `${year}-${month}-${d}`
                            const dayStat = dailyStats[key]
                            const isSelected = selectedCalendarDate?.getDate() === d && selectedCalendarDate?.getMonth() === month && selectedCalendarDate?.getFullYear() === year
                            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                            const isFuture = new Date(year, month, d) > today

                            return (
                              <button
                                key={d}
                                disabled={isFuture}
                                onClick={() => setSelectedCalendarDate(new Date(year, month, d))}
                                className={`relative h-10 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : isToday
                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                                    : isFuture
                                    ? 'text-muted-foreground/30 cursor-default'
                                    : 'hover:bg-secondary text-foreground'
                                }`}
                              >
                                {d}
                                {dayStat && !isSelected && (
                                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${
                                    dayStat.revenue >= 500 ? 'bg-green-400' : 'bg-primary/50'
                                  }`} />
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* Selected day detail */}
                        {selectedCalendarDate && (
                          <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">
                                {selectedCalendarDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </h4>
                              <button onClick={() => setSelectedCalendarDate(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {selectedStats ? (
                              <>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 rounded-lg bg-background border border-border">
                                    <p className="text-xs text-muted-foreground">Orders</p>
                                    <p className="text-xl font-bold">{selectedStats.count}</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-background border border-border">
                                    <p className="text-xs text-muted-foreground">Revenue</p>
                                    <p className="text-xl font-bold text-green-400">₹{selectedStats.revenue.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {selectedStats.orders.map((order, idx) => (
                                    <div key={order.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 text-sm">
                                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="flex-1 truncate">{order.customer_name || 'Customer'}</span>
                                      <span className="text-muted-foreground text-xs">
                                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                      </span>
                                      <span className="font-semibold text-green-400">₹{Number(order.total_amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-muted-foreground text-sm text-center py-4">No orders on this day</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
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

          {/* Search & Category Filter */}
          {!showAddForm && foods.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search food items..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="h-10 pl-9 rounded-xl bg-secondary border-border"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setFoodCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${foodCategoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground border border-border"}`}
                >
                  All ({foods.length})
                </button>
                {(() => {
                  // Build normalized category map: trimmed+lowered -> display name
                  const catMap = new Map<string, string>()
                  foods.forEach(f => { const key = f.category.trim().toLowerCase(); if (!catMap.has(key)) catMap.set(key, f.category.trim()) })
                  return Array.from(catMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, display]) => (
                    <button
                      key={key}
                      onClick={() => setFoodCategoryFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${foodCategoryFilter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground border border-border"}`}
                    >
                      {display} ({foods.filter(f => f.category.trim().toLowerCase() === key).length})
                    </button>
                  ))
                })()}
              </div>
            </div>
          )}

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
            <>{(() => {
              // Compute best sellers from order data (once, outside map)
              const itemCounts: Record<string, number> = {}
              orders.forEach(order => {
                (order.order_items || []).forEach(item => {
                  itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
                })
              })
              const topItems = Object.entries(itemCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name]) => name.toLowerCase())

              // Filter by search and category (normalized: trim + lowercase)
              const filteredFoods = foods
                .filter(f => foodCategoryFilter === "all" || f.category.trim().toLowerCase() === foodCategoryFilter)
                .filter(f => !foodSearch.trim() || f.name.toLowerCase().includes(foodSearch.trim().toLowerCase()))
                .sort((a, b) => a.category.trim().toLowerCase().localeCompare(b.category.trim().toLowerCase()))

              if (filteredFoods.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No items match your search{foodCategoryFilter !== 'all' ? ` in "${foodCategoryFilter}"` : ''}.</p>
                  </div>
                )
              }

              // Group by category for section headers (normalized)
              const catDisplayMap = new Map<string, string>()
              filteredFoods.forEach(f => { const key = f.category.trim().toLowerCase(); if (!catDisplayMap.has(key)) catDisplayMap.set(key, f.category.trim()) })
              const categories = Array.from(catDisplayMap.entries())

              return (
              <div className="space-y-6">
              {categories.map(([catKey, catDisplay]) => (
                <div key={catKey}>
                  {(foodCategoryFilter === "all" && categories.length > 1) && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="h-px flex-1 bg-border" />
                      {catDisplay} ({filteredFoods.filter(f => f.category.trim().toLowerCase() === catKey).length})
                      <span className="h-px flex-1 bg-border" />
                    </h3>
                  )}
                  <div className="grid gap-3">
              {filteredFoods.filter(f => f.category.trim().toLowerCase() === catKey).map((food) => {
                const isBestSeller = topItems.includes(food.name.toLowerCase())
                const orderCount = itemCounts[food.name] || 0
                return (
                <div
                  key={food.id}
                  className={`p-4 rounded-xl bg-card border transition-colors overflow-hidden ${isBestSeller ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-border hover:border-border/80'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                      <Image src={food.image} alt={food.name} fill className="object-cover" />
                      {isBestSeller && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px]">🔥</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{food.name}</h3>
                        {isBestSeller && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold shrink-0">
                            🔥 Best Seller
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg text-primary font-medium border border-border">{food.category}</span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border border-border ${food.is_veg !== false ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${food.is_veg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                          {food.is_veg !== false ? 'Veg' : 'Non-Veg'}
                        </span>
                        {orderCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/10">
                            {orderCount} ordered
                          </span>
                        )}
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
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">{food.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-sm font-bold text-primary">₹{food.price}</span>
                    <div className="flex gap-1">
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
                </div>
                )
              })}
              </div>
              </div>
              ))}
              </div>
              )
            })()}</>
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
                <Card key={order.id} className={`bg-card border-border ${
                  blockedUsers.has(order.user_id || '') ? 'border-destructive/40 bg-destructive/5' : ''
                }`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        {/* Customer info + trust score */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                            {(order.customer_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">
                                {order.customer_name || "Guest"}
                              </p>
                              {/* Trust Score Badge */}
                              {(() => {
                                const trust = getOrderTrustScore(order)
                                if (trust.level === 'suspicious') return (
                                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold" title={trust.reasons.join(', ')}>
                                    <ShieldX className="h-3 w-3" /> Suspicious
                                  </span>
                                )
                                if (trust.level === 'review') return (
                                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold" title={trust.reasons.join(', ')}>
                                    <ShieldAlert className="h-3 w-3" /> Review
                                  </span>
                                )
                                return (
                                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                                    <ShieldCheck className="h-3 w-3" /> Trusted
                                  </span>
                                )
                              })()}
                              {/* Blocked badge */}
                              {blockedUsers.has(order.user_id || '') && (
                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">
                                  <Ban className="h-3 w-3" /> Blocked
                                </span>
                              )}
                            </div>
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
                        <div className="flex items-center gap-3 mt-2 ml-12 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString("en-IN")}
                          </p>
                          {/* Prep Time Tracker — only for active orders */}
                          {!['delivered', 'cancelled'].includes(order.order_status) && (() => {
                            const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
                            const color = elapsed > 30
                              ? 'bg-red-500/15 text-red-400 border-red-500/20'
                              : elapsed > 15
                              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                              : 'bg-green-500/15 text-green-400 border-green-500/20'
                            const display = elapsed >= 60
                              ? `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`
                              : `${elapsed}m ago`
                            return (
                              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                                <Timer className="h-3 w-3" />
                                {display}
                              </span>
                            )
                          })()}
                        </div>
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
                        {/* Block/Unblock User Button — only for non-trusted or already-blocked users */}
                        {order.user_id && (getOrderTrustScore(order).level !== 'trusted' || blockedUsers.has(order.user_id)) && (
                          <button
                            onClick={() => handleToggleBlockUser(
                              order.user_id!,
                              blockedUsers.has(order.user_id!),
                              order.customer_name || 'User'
                            )}
                            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                              blockedUsers.has(order.user_id!)
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            }`}
                          >
                            <Ban className="h-3 w-3" />
                            {blockedUsers.has(order.user_id!) ? 'Unblock' : 'Block User'}
                          </button>
                        )}
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
            <p className="text-muted-foreground text-sm mt-1">Configure delivery fees, charges, and store settings</p>
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

                      {!appSettings.is_store_open && (() => {
                        // Parse existing store_opens_at into 12hr parts
                        const existing = appSettings.store_opens_at ? new Date(appSettings.store_opens_at) : null
                        const existingHour24 = existing ? existing.getHours() : null
                        const existingMin = existing ? existing.getMinutes() : null
                        const existingHour12 = existingHour24 !== null ? (existingHour24 === 0 ? 12 : existingHour24 > 12 ? existingHour24 - 12 : existingHour24) : ""
                        const existingPeriod = existingHour24 !== null ? (existingHour24 >= 12 ? "PM" : "AM") : "AM"
                        const existingMinStr = existingMin !== null ? String(existingMin).padStart(2, "0") : ""

                        const saveOpeningTime = async (hour12: number, minute: number, period: string) => {
                          let hour24 = hour12
                          if (period === "AM" && hour12 === 12) hour24 = 0
                          else if (period === "PM" && hour12 !== 12) hour24 = hour12 + 12
                          const now = new Date()
                          const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minute, 0)
                          // If the time is already past today, set it for tomorrow
                          if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
                          const isoValue = target.toISOString()
                          setAppSettings({ ...appSettings, store_opens_at: isoValue })
                          try {
                            const { error } = await supabase
                              .from('settings')
                              .update({ store_opens_at: isoValue })
                              .eq('id', appSettings.id || '')
                            if (error) throw error
                            toast.success("Opening time updated")
                          } catch {
                            toast.error("Failed to update opening time")
                          }
                        }

                        return (
                        <div className="shrink-0 space-y-2">
                          <Label className="text-xs">Opening At (Optional Countdown)</Label>
                          <div className="flex items-center gap-2">
                            {/* Hour */}
                            <select
                              value={existingHour12}
                              onChange={(e) => {
                                const h = parseInt(e.target.value)
                                const m = existingMin ?? 0
                                saveOpeningTime(h, m, existingPeriod)
                              }}
                              className="h-9 px-2 rounded-lg bg-background border border-border text-sm min-w-[60px]"
                            >
                              <option value="" disabled>Hr</option>
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <span className="text-muted-foreground font-bold">:</span>
                            {/* Minute */}
                            <select
                              value={existingMinStr}
                              onChange={(e) => {
                                const m = parseInt(e.target.value)
                                const h = typeof existingHour12 === "number" ? existingHour12 : 12
                                saveOpeningTime(h, m, existingPeriod)
                              }}
                              className="h-9 px-2 rounded-lg bg-background border border-border text-sm min-w-[60px]"
                            >
                              <option value="" disabled>Min</option>
                              {["00","15","30","45"].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            {/* AM/PM */}
                            <select
                              value={existingPeriod}
                              onChange={(e) => {
                                const p = e.target.value
                                const h = typeof existingHour12 === "number" ? existingHour12 : 12
                                const m = existingMin ?? 0
                                saveOpeningTime(h, m, p)
                              }}
                              className="h-9 px-2 rounded-lg bg-background border border-border text-sm min-w-[60px]"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                            {/* Clear button */}
                            {existing && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setAppSettings({ ...appSettings, store_opens_at: null })
                                  try {
                                    await supabase.from('settings').update({ store_opens_at: null }).eq('id', appSettings.id || '')
                                    toast.success("Opening time cleared")
                                  } catch {
                                    toast.error("Failed to clear opening time")
                                  }
                                }}
                                className="h-9 px-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {existing && (
                            <p className="text-xs text-muted-foreground">
                              Opens at: {existing.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                        )
                      })()}

                      {/* Custom Closed Message */}
                      {!appSettings.is_store_open && (
                        <div className="w-full mt-4 space-y-2">
                          <Label className="text-xs">Custom Closed Message (Optional)</Label>
                          <textarea
                            placeholder='e.g. "Opening in 2 hrs — too many preorders!"'
                            maxLength={200}
                            value={appSettings.closed_message || ""}
                            onChange={(e) => setAppSettings({ ...appSettings, closed_message: e.target.value || null })}
                            onBlur={async () => {
                              try {
                                const { error } = await supabase
                                  .from('settings')
                                  .update({ closed_message: appSettings.closed_message })
                                  .eq('id', appSettings.id || '')
                                if (error) throw error
                                toast.success("Closed message updated")
                              } catch {
                                toast.error("Failed to update message")
                              }
                            }}
                            className="w-full h-20 px-3 py-2 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60"
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                              Shown on the closed banner to all customers
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                              {(appSettings.closed_message || "").length}/200
                            </span>
                          </div>
                          {appSettings.closed_message && (
                            <button
                              type="button"
                              onClick={async () => {
                                setAppSettings({ ...appSettings, closed_message: null })
                                try {
                                  await supabase.from('settings').update({ closed_message: null }).eq('id', appSettings.id || '')
                                  toast.success("Closed message cleared")
                                } catch {
                                  toast.error("Failed to clear message")
                                }
                              }}
                              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                            >
                              Clear message
                            </button>
                          )}
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

                  {/* Custom Charge */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Custom Charge (Optional)</h3>
                    <p className="text-xs text-muted-foreground -mt-2">Add a custom surcharge like LPG Surge, High Demand Fee, Platform Fee, etc. Leave label empty to disable.</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Charge Label</Label>
                        <Input
                          placeholder='e.g. "LPG Surge Charge"'
                          maxLength={50}
                          value={appSettings.custom_charge_label || ""}
                          onChange={(e) => setAppSettings({ ...appSettings, custom_charge_label: e.target.value || null })}
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Charge Type</Label>
                        <select
                          value={appSettings.custom_charge_type}
                          onChange={(e) => setAppSettings({ ...appSettings, custom_charge_type: e.target.value as 'flat' | 'percent' })}
                          className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm"
                        >
                          <option value="flat">Flat Amount (₹)</option>
                          <option value="percent">Percentage (%)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Charge Value {appSettings.custom_charge_type === 'percent' ? '(%)' : '(₹)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          max={appSettings.custom_charge_type === 'percent' ? 100 : undefined}
                          placeholder="0 = no charge"
                          value={appSettings.custom_charge_value}
                          onChange={(e) => setAppSettings({ ...appSettings, custom_charge_value: parseFloat(e.target.value) || 0 })}
                          className="h-10 rounded-xl bg-secondary border-border"
                        />
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
              onClick={() => {
                if (showCouponForm) {
                  setShowCouponForm(false)
                  setEditCouponId(null)
                  setNewCoupon({ code: "", rewardType: "discount", discountType: "percent", discountValue: "", minOrder: "", maxDiscount: "", usageLimit: "", perUserLimit: "1", expiresAt: "", freebieName: "" })
                } else {
                  setShowCouponForm(true)
                }
              }}
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
                    <div className="space-y-2">
                      <Label className="text-sm">Per-User Limit</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="1 = once per user, 0 = unlimited"
                        value={newCoupon.perUserLimit}
                        onChange={(e) => setNewCoupon({ ...newCoupon, perUserLimit: e.target.value })}
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
                    {couponSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editCouponId ? <Edit2 className="mr-2 h-4 w-4" /> : <Tag className="mr-2 h-4 w-4" />}
                    {editCouponId ? "Update Coupon" : "Create Coupon"}
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
                      {` · ${coupon.per_user_limit > 0 ? coupon.per_user_limit + 'x/user' : '∞/user'}`}
                      {coupon.expires_at && ` · Expires ${new Date(coupon.expires_at).toLocaleDateString("en-IN")}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 rounded-lg ${coupon.is_active ? 'text-green-500 hover:text-green-400 hover:bg-green-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                      onClick={() => handleToggleCouponActive(coupon.id, coupon.is_active)}
                      title={coupon.is_active ? "Disable coupon" : "Enable coupon"}
                    >
                      {coupon.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                      onClick={() => handleEditCouponClick(coupon)}
                      title="Edit coupon"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      title="Delete coupon"
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

      {activeTab === "emails" && (
        <EmailsTab />
      )}

      {/* ==================== REVIEWS TAB ==================== */}
      {activeTab === "reviews" && (
        <ReviewsTab />
      )}
    </div>
  )
}

// ─── Emails Tab Component ──────────────────────────────────
interface EmailSegment {
  key: string
  label: string
  icon: string
  description: string
  count: number
}

function EmailsTab() {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Segments
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [segmentsLoading, setSegmentsLoading] = useState(true)
  const [selectedSegment, setSelectedSegment] = useState("all")

  // Fetch segments on mount
  useEffect(() => {
    setSegmentsLoading(true)
    api.get('/email/segments')
      .then(res => {
        setSegments(res.data.segments || [])
      })
      .catch((err) => {
        console.error('[Segments] Failed to fetch segments:', err?.response?.data || err?.message || err)
        // Fallback: just show "all" with unknown count
        setSegments([{ key: 'all', label: 'All Customers', icon: '👥', description: 'Everyone', count: 0 }])
      })
      .finally(() => setSegmentsLoading(false))
  }, [])

  const activeSegment = segments.find(s => s.key === selectedSegment)
  const recipientCount = activeSegment?.count ?? 0

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `email-${Date.now()}.${fileExt}`
      const filePath = `email-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('food-images')
        .getPublicUrl(filePath)
      setImageUrl(publicUrlData.publicUrl)
      toast.success('Image uploaded!')
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSendBulk = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required')
      return
    }
    const segLabel = activeSegment?.label || selectedSegment
    if (!confirm(`Send this email to ${recipientCount} customers in "${segLabel}"?`)) return

    setSending(true)
    setLastResult(null)
    try {
      const { data } = await api.post('/email/bulk', {
        subject,
        body: body.replace(/\n/g, '<br/>'),
        imageUrl: imageUrl || undefined,
        segment: selectedSegment,
      })
      setLastResult(data.result)
      toast.success(data.message)
    } catch (err: any) {
      console.error('[BulkEmail] Failed:', err?.response?.data || err?.message || err)
      toast.error(err?.response?.data?.message || 'Failed to send bulk email')
    } finally {
      setSending(false)
    }
  }

  const handleClearImage = () => {
    setImageFile(null)
    setImagePreview("")
    setImageUrl("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Email Marketing
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Send targeted emails to customer segments
        </p>
      </div>

      {/* Audience Segment Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Select Audience
          </CardTitle>
        </CardHeader>
        <CardContent>
          {segmentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading segments...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {segments.map((seg) => (
                <button
                  key={seg.key}
                  onClick={() => setSelectedSegment(seg.key)}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                    selectedSegment === seg.key
                      ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/20'
                      : 'border-border bg-secondary/30 hover:border-border/80 hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{seg.icon}</span>
                    <span className="font-semibold text-sm">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      selectedSegment === seg.key
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {seg.count} users
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{seg.description}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit2 className="h-4 w-4 text-primary" />
              Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject" className="text-sm font-medium">Subject Line</Label>
              <Input
                id="email-subject"
                placeholder="🔥 20% OFF Today Only!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 rounded-xl bg-secondary border-border"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-body" className="text-sm font-medium">Email Body</Label>
              <textarea
                id="email-body"
                placeholder={"Write your email content here...\n\nUse line breaks for paragraphs.\nHTML tags like <b>bold</b> and <i>italic</i> are supported."}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full rounded-xl bg-secondary border border-border p-3 text-sm resize-y focus:outline-none focus:border-primary/50 transition-colors"
                maxLength={5000}
              />
              <p className="text-[11px] text-muted-foreground">{body.length}/5000 characters</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Banner Image (Optional)
              </Label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Email banner" className="w-full h-40 object-cover rounded-xl border border-border" />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/30">
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload banner image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <Separator className="bg-border" />

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-border"
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button
                type="button"
                onClick={handleSendBulk}
                disabled={sending || !subject.trim() || !body.trim() || uploading || recipientCount === 0}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {sending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Send to {recipientCount}</>
                )}
              </Button>
            </div>

            {/* Result */}
            {lastResult && (
              <div className={`p-4 rounded-xl border ${
                lastResult.failed === 0 
                  ? 'bg-green-500/10 border-green-500/30 text-green-500'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'
              }`}>
                <p className="font-medium text-sm">
                  ✉️ {lastResult.sent}/{lastResult.total} emails sent successfully
                  {lastResult.failed > 0 && ` (${lastResult.failed} failed)`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview + Templates */}
        <div className="space-y-4">
          {showPreview && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                  <div style={{ background: 'linear-gradient(145deg, #af1d1d, #8b1515)' }} className="py-8 px-6 text-center">
                    <div className="inline-block border-2 border-white/30 rounded-xl px-7 py-2 mb-2">
                      <h3 className="text-white text-2xl font-black tracking-[4px]">KRAVINGS</h3>
                    </div>
                    <p className="text-white/70 text-[11px] tracking-[3px] uppercase font-medium">by ARF</p>
                  </div>
                  <div style={{ height: '4px', background: 'linear-gradient(90deg, #d44040, #af1d1d, #8b1515)' }} />
                  <div className="p-6 bg-white">
                    <div className="text-center mb-5">
                      <span className="text-[44px]">🔥</span>
                      <h3 className="text-xl font-extrabold text-gray-900 mt-2">{subject || 'Your Subject Here'}</h3>
                    </div>
                    {imageUrl && (
                      <img src={imageUrl} alt="Banner" className="w-full rounded-xl mb-5 border border-gray-100" />
                    )}
                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {body || 'Your email content will appear here...'}
                    </div>
                    <div className="text-center mt-7">
                      <span className="inline-block px-9 py-3.5 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #d44040, #af1d1d)' }}>
                        🍕 Order Now
                      </span>
                    </div>
                  </div>
                  <div className="py-5 px-4 text-center" style={{ background: '#1a1a1a' }}>
                    <p className="text-xs font-semibold" style={{ color: '#d44040' }}>www.kravingskitchen.in</p>
                    <p className="text-gray-500 text-xs mt-1">📍 Bhubaneswar &nbsp;|&nbsp; 📞 +91 8018332575</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Templates */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: '🎉 Discount Offer', sub: '🔥 Flat 20% OFF — Today Only!', bod: 'Hey Foodie! 🍔\n\nWe\'re offering a FLAT 20% OFF on all orders today!\n\nUse code: KRAVINGS20 at checkout.\n\nDon\'t miss out — order now and satisfy your cravings! ❤️' },
                { label: '🆕 New Item Launch', sub: '🆕 Exciting New Dish Added to Menu!', bod: 'Hey there! 👋\n\nWe\'ve just added something special to our menu that you\'re going to LOVE.\n\nHead over to our menu and be the first to try it!\n\nFresh, delicious, and crafted just for you 🧑‍🍳' },
                { label: '🎊 Festival Special', sub: '🎊 Festival Special — Free Delivery + Extra Discounts!', bod: 'Happy celebrations! 🎉\n\nThis festive season, enjoy:\n\n🚚 FREE Delivery on all orders\n🎁 Extra 10% OFF with code FESTIVAL10\n\nCelebrate with great food from Kravings! ❤️' },
              ].map((tmpl) => (
                <button
                  key={tmpl.label}
                  onClick={() => { setSubject(tmpl.sub); setBody(tmpl.bod); }}
                  className="w-full text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 transition-all text-sm"
                >
                  {tmpl.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
