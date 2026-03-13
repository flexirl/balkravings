"use client"

import { useState, useEffect } from "react"
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

  // Auto-fill default address from user's saved addresses
  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name)
    }
    
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find((addr) => addr.is_default)
      
      if (defaultAddress) {
        const formattedAddress = [
          defaultAddress.street,
          defaultAddress.city,
          defaultAddress.state,
          defaultAddress.postal_code,
          defaultAddress.country,
        ].filter(Boolean).join(", ")
        
        setAddress(formattedAddress)
        
        if (!phone && defaultAddress.phone_number) {
          setPhone(defaultAddress.phone_number)
        }
      }
    }
  }, [user, phone, customerName])

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
  const grandTotal = totalAmount + deliveryFee + tax - couponDiscount

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      // Validate coupon from Supabase
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

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("This coupon has expired")
        return
      }

      // Check min order
      if (totalAmount < coupon.min_order) {
        toast.error(`Minimum order ₹${coupon.min_order} required for this coupon`)
        return
      }

      // Check usage limit
      if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        toast.error("This coupon has reached its usage limit")
        return
      }

      // Calculate discount
      let discount = 0
      if (coupon.discount_type === 'percent') {
        discount = Math.round(totalAmount * (coupon.discount_value / 100))
        if (coupon.max_discount > 0) discount = Math.min(discount, coupon.max_discount)
      } else {
        discount = coupon.discount_value
      }

      setCouponDiscount(discount)
      setCouponApplied(coupon.code)
      toast.success(`Coupon applied! ₹${discount} off`)
    } catch {
      toast.error("Failed to apply coupon")
      setCouponDiscount(0)
      setCouponApplied("")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode("")
    setCouponDiscount(0)
    setCouponApplied("")
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please login to place an order")
      router.push("/login")
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
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    if (!address.trim()) {
      toast.error("Please enter your delivery address")
      return
    }

    setIsLoading(true)

    try {
      // Create order in Supabase
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
        })
        .select()
        .single()

      if (orderError || !order) {
        throw new Error(orderError?.message || 'Failed to create order')
      }

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        food_id: item.foodId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items error:', itemsError.message)
      }

      // Update coupon usage if applied
      if (couponApplied) {
        try {
          const { data: coupon } = await supabase
            .from('coupons')
            .select('used_count')
            .eq('code', couponApplied)
            .single()
          if (coupon) {
            await supabase
              .from('coupons')
              .update({ used_count: (coupon.used_count || 0) + 1 })
              .eq('code', couponApplied)
          }
        } catch {
          // ignore coupon update errors
        }
      }

      clearCart()
      toast.success("Order placed! Pay on delivery.")
      router.push("/orders")
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

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Delivery Address
                </Label>
                <Input
                  id="address"
                  placeholder="House no, Street, Area, City, PIN"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 rounded-xl bg-secondary border-border focus:border-primary/50"
                />
              </div>
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
                      🎉 {couponApplied} applied — ₹{couponDiscount} off
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

              <Button
                type="submit"
                disabled={isLoading || !isStoreOpen || unavailableItems.length > 0}
                className={`w-full h-12 text-base rounded-xl transition-all ${
                  !isStoreOpen || unavailableItems.length > 0
                    ? "bg-secondary text-muted-foreground" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground glow-orange hover:glow-orange-strong"
                }`}
              >
                {!isStoreOpen ? (
                  <>Store Closed</>
                ) : unavailableItems.length > 0 ? (
                  <>Items Out of Stock</>
                ) : isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>Place Order (₹{grandTotal})</>
                )}
              </Button>

              {!isStoreOpen ? (
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
