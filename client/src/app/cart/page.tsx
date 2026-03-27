"use client"

import { useState, useEffect } from "react"
import supabase from "@/lib/supabase"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { EmptyCart } from "@/components/empty-states"
import { CartSuggestions } from "@/components/cart-suggestions"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart()

  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const [unavailableItems, setUnavailableItems] = useState<string[]>([])
  
  // Dynamic Fees
  const [deliveryFeeBase, setDeliveryFeeBase] = useState(0)
  const [customChargeLabel, setCustomChargeLabel] = useState<string | null>(null)
  const [customChargeType, setCustomChargeType] = useState<'flat' | 'percent'>('flat')
  const [customChargeValue, setCustomChargeValue] = useState(0)
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(0)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const checkAvailability = async () => {
      if (items.length === 0) {
        setUnavailableItems([])
        return
      }
      try {
        // Fetch settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('*')
          .single()

        if (settingsData) {
          setIsStoreOpen(settingsData.is_store_open ?? true)
          setDeliveryFeeBase(settingsData.delivery_fee ?? 0)
          setCustomChargeLabel(settingsData.custom_charge_label ?? null)
          setCustomChargeType(settingsData.custom_charge_type ?? 'flat')
          setCustomChargeValue(settingsData.custom_charge_value ?? 0)
          setFreeDeliveryAbove(settingsData.free_delivery_above ?? 0)
        }
        setSettingsLoaded(true)

        // Fetch food availability
        const foodIds = items.map(item => item.foodId)
        const { data: foods } = await supabase
          .from('foods')
          .select('id, availability')
          .in('id', foodIds)

        const outOfStockIds = items
          .filter(cartItem => {
            const dbItem = foods?.find(f => f.id === cartItem.foodId)
            return !dbItem || dbItem.availability === false
          })
          .map(item => item.foodId)
          
        setUnavailableItems(outOfStockIds)
      } catch (err) {
        console.error("Failed to sync cart status", err)
        setSettingsLoaded(true)
      }
    }

    checkAvailability()
  }, [items])

  if (items.length === 0) {
    return <EmptyCart />
  }

  const deliveryFee = freeDeliveryAbove > 0 && totalAmount >= freeDeliveryAbove ? 0 : deliveryFeeBase
  const customCharge = (customChargeLabel && customChargeValue > 0)
    ? (customChargeType === 'percent' ? Math.round(totalAmount * (customChargeValue / 100)) : customChargeValue)
    : 0
  const grandTotal = totalAmount + deliveryFee + customCharge

  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl font-bold pt-20 mb-8 flex items-center gap-3">
        <ShoppingBag className=" h-7 w-7 text-primary" />
        Shopping Cart
        <span className="text-base font-normal text-muted-foreground">({items.length} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const isUnavailable = unavailableItems.includes(item.foodId)
            return (
            <div
              key={item.foodId}
              className={`flex gap-4 p-4 rounded-2xl bg-card border transition-all ${
                isUnavailable ? "border-destructive/40 bg-destructive/5" : "border-border hover:border-border/80"
              }`}
            >
              <div className={`relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 ${isUnavailable ? "grayscale opacity-60" : ""}`}>
                <Image src={item.image} alt={item.name} fill className="object-cover" />
                {isUnavailable && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                     <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                       Out of Stock
                     </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
                    onClick={() => removeFromCart(item.foodId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">₹{item.price.toFixed(0)} each</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-bold text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              </div>
            </div>
          )})}
          <button
            onClick={clearCart}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all items
          </button>

          {/* Smart Suggestions */}
          <CartSuggestions />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-lg mb-6">Order Summary</h3>
            <div className="space-y-4 text-sm">
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

              {customChargeLabel && customCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{customChargeLabel}{customChargeType === 'percent' ? ` (${customChargeValue}%)` : ''}</span>
                  <span>₹{customCharge}</span>
                </div>
              )}
              
              <Separator className="bg-border" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">₹{grandTotal}</span>
              </div>
            </div>
            {!isStoreOpen ? (
              <Button
                disabled
                className="w-full mt-6 h-12 text-base rounded-xl bg-secondary text-muted-foreground transition-all"
              >
                Store is Closed
              </Button>
            ) : unavailableItems.length > 0 ? (
              <Button
                onClick={() => unavailableItems.forEach(id => removeFromCart(id))}
                className="w-full mt-6 h-12 text-base rounded-xl bg-destructive/20 text-destructive-foreground transition-all border border-destructive/30 hover:bg-destructive/30"
              >
                Remove out of stock items
              </Button>
            ) : (
              <Button
                className="w-full mt-6 h-12 text-base rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground glow-orange hover:glow-orange-strong"
                asChild
              >
                <Link href="/checkout">
                  Checkout <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
