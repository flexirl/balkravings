"use client"

import { useState, useEffect, useCallback } from "react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"
import {
  Loader2,
  Banknote,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  ShoppingBag,
  Clock,
  Ban,
} from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const [customerName, setCustomerName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Bhubaneswar delivery area PIN codes (751xxx and 752xxx)
  const isValidDeliveryPin = (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return false
    return pin.startsWith('751') || pin.startsWith('752')
  }

  // Extract PIN from saved address or typed address
  const getDeliveryPin = (): string | null => {
    if (selectedAddressId !== "new") {
      const addr = savedAddresses.find(a => a.id === selectedAddressId)
      return addr?.postal_code || null
    }
    // Extract 6-digit PIN from typed address
    const match = address.match(/\b(\d{6})\b/)
    return match ? match[1] : null
  }

  // Anti-spam: cooldown timer
  const COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState("")

  // Address picker
  const savedAddresses = user?.addresses || []
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    savedAddresses.find(a => a.is_default)?.id || savedAddresses[0]?.id || "new"
  )

  // Dynamic fees from settings
  const [deliveryFeeBase, setDeliveryFeeBase] = useState(40)
  const [gstPercent, setGstPercent] = useState(5)
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(0)
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const [unavailableItems, setUnavailableItems] = useState<string[]>([])

  // Coupon
  const [couponCode, setCouponCode] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponFreebie, setCouponFreebie] = useState("")

  // Auto-fill from selected address
  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name)
    }

    if (selectedAddressId !== "new") {
      const addr = savedAddresses.find(a => a.id === selectedAddressId)
      if (addr) {
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.state,
          addr.postal_code,
          addr.country,
        ].filter(Boolean).join(", ")
        setAddress(formattedAddress)
        if (addr.phone_number) {
          setPhone(addr.phone_number)
        }
      }
    } else if (selectedAddressId === "new") {
      // When switching to "new", clear address but keep other fields
      if (savedAddresses.length > 0) setAddress("")
    }
  }, [user, selectedAddressId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Anti-spam: Cooldown timer from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('arf_order_cooldown')
    if (!stored) return
    const expiresAt = parseInt(stored, 10)
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      localStorage.removeItem('arf_order_cooldown')
      return
    }
    setCooldownRemaining(remaining)

    const interval = setInterval(() => {
      const left = expiresAt - Date.now()
      if (left <= 0) {
        setCooldownRemaining(0)
        localStorage.removeItem('arf_order_cooldown')
        clearInterval(interval)
      } else {
        setCooldownRemaining(left)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Anti-spam: Check if user is blocked
  useEffect(() => {
    const checkBlocked = async () => {
      if (!user) return
      try {
        const { data } = await supabase
          .from('profiles')
          .select('is_blocked, block_reason')
          .eq('id', user.id)
          .single()
        if (data?.is_blocked) {
          setIsBlocked(true)
          setBlockReason(data.block_reason || 'Your account has been suspended.')
        }
      } catch { /* ignore */ }
    }
    checkBlocked()
  }, [user])

  // Format cooldown seconds to mm:ss
  const formatCooldown = useCallback((ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }, [])

  // Fetch settings & availability from Supabase
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [settingsResult, foodsResult] = await Promise.all([
          supabase.from('settings').select('*').single(),
          supabase.from('foods').select('id, availability'),
        ])
        
        if (settingsResult.data) {
          const data = settingsResult.data
          setDeliveryFeeBase(data.delivery_fee ?? 40)
          setGstPercent(data.gst_percent ?? 5)
          setFreeDeliveryAbove(data.free_delivery_above ?? 0)
          setIsStoreOpen(data.is_store_open ?? true)
        }
        
        if (foodsResult.data) {
          const outOfStockIds = items
            .filter((cartItem) => {
               const dbItem = foodsResult.data.find((f: { id: string; availability: boolean }) => f.id === cartItem.foodId)
               return !dbItem || dbItem.availability === false
            })
            .map((item) => item.foodId)
            
          setUnavailableItems(outOfStockIds)
        }
      } catch { /* fallback to defaults */ }
    }
    if (items.length > 0) fetchStatus()
  }, [items])

  const deliveryFee = freeDeliveryAbove > 0 && totalAmount >= freeDeliveryAbove ? 0 : deliveryFeeBase
  const tax = Math.round(totalAmount * (gstPercent / 100))
  const grandTotal = Math.max(0, totalAmount + deliveryFee + tax - couponDiscount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      // SECURE: Use server-side coupon validation RPC
      try {
        const { data: result, error: rpcError } = await supabase
          .rpc('validate_coupon', {
            p_coupon_code: couponCode.toUpperCase(),
            p_subtotal: totalAmount,
          })

        if (rpcError) {
          console.warn('Coupon validation RPC not available, using fallback:', rpcError.message)
          throw new Error('FALLBACK')
        }

        if (!result?.valid) {
          toast.error(result?.error || 'Invalid coupon')
          setCouponDiscount(0)
          setCouponApplied("")
          setCouponFreebie("")
          return
        }

        // Apply validated coupon
        if (result.type === 'freebie') {
          setCouponDiscount(0)
          setCouponFreebie(result.freebie_name || 'Free item')
          setCouponApplied(result.code)
          toast.success(`🎁 Free ${result.freebie_name} added to your order!`)
        } else {
          setCouponDiscount(result.discount)
          setCouponFreebie("")
          setCouponApplied(result.code)
          toast.success(`Coupon applied! ₹${result.discount} off`)
        }
        return
      } catch (rpcErr) {
        if ((rpcErr as Error).message !== 'FALLBACK') throw rpcErr
      }

      // Fallback: client-side validation (pre-migration)
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        toast.error("Invalid or expired coupon")
        setCouponDiscount(0)
        setCouponApplied("")
        return
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("This coupon has expired")
        return
      }
      if (totalAmount < coupon.min_order) {
        toast.error(`Minimum order ₹${coupon.min_order} required for this coupon`)
        return
      }
      if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        toast.error("This coupon has reached its usage limit")
        return
      }

      if (coupon.reward_type === 'freebie') {
        setCouponDiscount(0)
        setCouponFreebie(coupon.freebie_name || 'Free item')
        setCouponApplied(coupon.code)
        toast.success(`🎁 Free ${coupon.freebie_name} added to your order!`)
      } else {
        let discount = 0
        if (coupon.discount_type === 'percent') {
          discount = Math.round(totalAmount * (coupon.discount_value / 100))
          if (coupon.max_discount > 0) discount = Math.min(discount, coupon.max_discount)
        } else {
          discount = coupon.discount_value
        }
        setCouponDiscount(discount)
        setCouponFreebie("")
        setCouponApplied(coupon.code)
        toast.success(`Coupon applied! ₹${discount} off`)
      }
    } catch {
      toast.error("Failed to apply coupon")
      setCouponDiscount(0)
      setCouponFreebie("")
      setCouponApplied("")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode("")
    setCouponDiscount(0)
    setCouponApplied("")
    setCouponFreebie("")
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please login to place an order")
      router.push("/login")
      return
    }
    if (isBlocked) {
      toast.error("Your account has been suspended. Contact support.")
      return
    }
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${formatCooldown(cooldownRemaining)} before placing another order`)
      return
    }
    if (!isStoreOpen) {
      toast.error("Store is currently closed")
      return
    }
    if (unavailableItems.length > 0) {
      toast.error("Some items in your cart are out of stock. Please remove them.")
      return
    }
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      toast.error("Please enter a valid Indian mobile number")
      document.getElementById('phone')?.focus()
      return
    }
    if (!address.trim()) {
      toast.error("Please enter your delivery address")
      document.getElementById('address')?.focus()
      return
    }
    const deliveryPin = getDeliveryPin()
    if (!deliveryPin || !isValidDeliveryPin(deliveryPin)) {
      toast.error("We only deliver within Bhubaneswar. Please include a valid Bhubaneswar PIN code (751xxx / 752xxx) in your address.")
      if (selectedAddressId === "new") document.getElementById('address')?.focus()
      return
    }

    setIsLoading(true)

    try {
      // Anti-spam: Server-side rate limit check
      try {
        const { data: rateCheck, error: rateErr } = await supabase
          .rpc('check_order_rate_limit', { user_uuid: user.id })

        if (rateErr) {
          console.warn('Rate limit check failed:', rateErr.message)
          // If the RPC doesn't exist yet, allow the order (graceful fallback)
        } else if (rateCheck && !rateCheck.allowed) {
          if (rateCheck.reason === 'cooldown') {
            const waitSec = rateCheck.wait_seconds || 120
            // Set local cooldown timer
            const expiresAt = Date.now() + waitSec * 1000
            localStorage.setItem('arf_order_cooldown', expiresAt.toString())
            setCooldownRemaining(waitSec * 1000)
            toast.error(`Please wait ${formatCooldown(waitSec * 1000)} before placing another order`)
          } else if (rateCheck.reason === 'daily_limit') {
            toast.error("You've reached the daily order limit. Please try again tomorrow.")
          }
          setIsLoading(false)
          return
        }
      } catch {
        // RPC not available — allow order (graceful degradation)
      }

      // SECURE: Use server-side RPC to create order (calculates total from DB prices)
      const orderPayload = {
        p_user_id: user.id,
        p_delivery_address: address,
        p_customer_name: customerName,
        p_customer_phone: phone,
        p_freebie_item: couponFreebie || null,
        p_coupon_code: couponApplied || null,
        p_items: items.map(item => ({
          food_id: item.foodId,
          quantity: item.quantity,
        })),
      }

      let orderId: string

      try {
        const { data: result, error: rpcError } = await supabase
          .rpc('create_secure_order', orderPayload)

        if (rpcError) {
          // If RPC doesn't exist yet, fall back to direct insert (pre-migration)
          console.warn('Secure order RPC not available, using fallback:', rpcError.message)
          throw new Error('FALLBACK')
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to create order')
        }

        orderId = result.order_id
      } catch (rpcErr) {
        // Fallback: direct insert (will be removed once migration is run)
        if ((rpcErr as Error).message !== 'FALLBACK') throw rpcErr

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            total_amount: grandTotal,
            payment_status: 'pending',
            order_status: 'placed',
            delivery_address: address,
            customer_name: customerName,
            customer_phone: phone,
            phone_verified: true,
            payment_method: 'cod',
            freebie_item: couponFreebie || null,
          })
          .select()
          .single()

        if (orderError || !order) {
          throw new Error(orderError?.message || 'Failed to create order')
        }

        orderId = order.id

        // Insert order items (fallback only)
        const orderItems = items.map((item) => ({
          order_id: order.id,
          food_id: item.foodId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        }))

        await supabase.from('order_items').insert(orderItems)

        // Update coupon usage (fallback only)
        if (couponApplied) {
          try {
            await supabase.rpc('increment_coupon_usage', { coupon_code: couponApplied })
          } catch { /* ignore */ }
        }
      }

      clearCart()

      // Anti-spam: Set local cooldown timer after successful order
      const expiresAt = Date.now() + COOLDOWN_MS
      localStorage.setItem('arf_order_cooldown', expiresAt.toString())
      setCooldownRemaining(COOLDOWN_MS)

      toast.success("Order placed successfully!", {
        action: {
          label: "View Order",
          onClick: () => router.push("/orders"),
        },
      })
      router.push(`/order-success?id=${orderId}`)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Failed to place order")
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cart is empty</h2>
          <p className="text-muted-foreground">Add items before checking out.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-6">
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        Checkout
      </h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Info */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Delivery Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    required
                    maxLength={50}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11 rounded-xl bg-secondary border-border focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Mobile Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground">
                      +91
                    </div>
                    <Input
                      id="phone"
                      placeholder="10-digit number"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="h-11 rounded-xl bg-secondary border-border focus:border-primary/50 flex-1"
                    />
                  </div>
                </div>
              </div>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Select Address
                  </Label>
                  <div className="grid gap-2 overflow-hidden">
                    {savedAddresses.map((addr) => {
                      const formatted = [addr.street, addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")
                      return (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all overflow-hidden ${
                            selectedAddressId === addr.id
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-secondary/30 hover:border-border/80"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address-picker"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-secondary border border-border">
                                {addr.type}
                              </span>
                              {addr.is_default && (
                                <span className="text-[10px] text-primary font-medium">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 break-words">{formatted}</p>
                            {addr.phone_number && (
                              <p className="text-xs text-muted-foreground mt-0.5">📞 {addr.phone_number}</p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAddressId === "new"
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-secondary/30 hover:border-border/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address-picker"
                        checked={selectedAddressId === "new"}
                        onChange={() => setSelectedAddressId("new")}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">Use a different address</span>
                    </label>
                  </div>
                </div>
              )}

              {(savedAddresses.length === 0 || selectedAddressId === "new") && (
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Delivery Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="House no, Street, Area, City, PIN code"
                    required
                    maxLength={200}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-11 rounded-xl bg-secondary border-border focus:border-primary/50"
                  />
                  <p className="text-[11px] text-muted-foreground">Include your 6-digit PIN code (e.g. 751024)</p>
                </div>
              )}
            </div>

            {/* Payment Method — COD only */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" /> Payment Method
              </h3>

              <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/40 bg-primary/5">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-2xl bg-card border border-border space-y-5">
              <h3 className="font-bold text-lg">Order Summary</h3>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => {
                  const isUnavailable = unavailableItems.includes(item.foodId)
                  return (
                  <div key={item.foodId} className={`flex justify-between text-sm ${isUnavailable ? 'text-destructive font-medium bg-destructive/5 -mx-2 px-2 py-1 rounded' : ''}`}>
                    <span className={`${!isUnavailable && 'text-muted-foreground'} truncate mr-2`}>
                      {item.quantity}× {item.name} {isUnavailable && "(Out of Stock)"}
                    </span>
                    <span className="flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                )})}
              </div>

              <Separator className="bg-border" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Delivery Fee
                    {freeDeliveryAbove > 0 && totalAmount >= freeDeliveryAbove && (
                      <span className="text-green-400 ml-1">(Free!)</span>
                    )}
                  </span>
                  <span className={deliveryFee === 0 ? "line-through text-muted-foreground" : ""}>
                    ₹{deliveryFeeBase}
                  </span>
                </div>
                {gstPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                    <span>₹{tax}</span>
                  </div>
                )}

                {/* Coupon Input */}
                {!couponApplied ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-9 rounded-lg bg-secondary border-border text-sm uppercase flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      variant="outline"
                      className="h-9 rounded-lg text-sm px-4 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-green-500/10 rounded-lg px-3 py-2">
                    <span className="text-green-400 text-xs font-medium">
                      {couponFreebie
                        ? `🎁 ${couponApplied} applied — Free ${couponFreebie}!`
                        : `🎉 ${couponApplied} applied — ₹${couponDiscount} off`
                      }
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponFreebie && (
                  <div className="flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-2">
                    <span className="text-green-500 text-sm font-medium">🎁 Free {couponFreebie} with your order!</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                <Separator className="bg-border" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{grandTotal}</span>
                </div>
              </div>

              {/* Blocked user warning */}
              {isBlocked && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <Ban className="h-4 w-4 flex-shrink-0" />
                  <span>{blockReason || 'Your account has been suspended. Contact support.'}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !isStoreOpen || unavailableItems.length > 0 || isBlocked || cooldownRemaining > 0}
                className={`w-full h-12 text-base rounded-xl transition-all ${
                  !isStoreOpen || unavailableItems.length > 0 || isBlocked || cooldownRemaining > 0
                    ? "bg-secondary text-muted-foreground" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground glow-orange hover:glow-orange-strong"
                }`}
              >
                {isBlocked ? (
                  <>Account Suspended</>
                ) : cooldownRemaining > 0 ? (
                  <><Clock className="mr-2 h-4 w-4" />Wait {formatCooldown(cooldownRemaining)}</>
                ) : !isStoreOpen ? (
                  <>Store Closed</>
                ) : unavailableItems.length > 0 ? (
                  <>Items Out of Stock</>
                ) : isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>Place Order (₹{grandTotal})</>
                )}
              </Button>

              {isBlocked ? (
                <p className="text-xs text-center text-destructive font-medium">
                  Contact us on WhatsApp to resolve this issue
                </p>
              ) : cooldownRemaining > 0 ? (
                <p className="text-xs text-center text-muted-foreground">
                  You can place your next order in {formatCooldown(cooldownRemaining)}
                </p>
              ) : !isStoreOpen ? (
                <p className="text-xs text-center text-destructive font-medium">
                  We are not accepting orders at this time
                </p>
              ) : unavailableItems.length > 0 && (
                <p className="text-xs text-center text-destructive font-medium">
                  Please return to cart to remove unavailable items
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
