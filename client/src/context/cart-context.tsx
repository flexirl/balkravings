"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "./auth-context"
import supabase from "@/lib/supabase"

interface CartItem {
  foodId: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (foodId: string) => void
  updateQuantity: (foodId: string, quantity: number) => void
  clearCart: () => void
  totalAmount: number
  cartCount: number
  isSyncing: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const { user } = useAuth()
  const prevUserId = useRef<string | null>(null)
  const hasLoadedRef = useRef(false)

  // ───── Helpers ─────

  const fetchServerCart = useCallback(async (): Promise<CartItem[]> => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('food_id, quantity, foods(name, price, image)')
      .order('created_at', { ascending: true })

    if (error || !data) return []

    return data.map((item: Record<string, unknown>) => {
      const food = item.foods as Record<string, unknown> | null
      return {
        foodId: item.food_id as string,
        name: (food?.name as string) || '',
        price: Number(food?.price) || 0,
        image: (food?.image as string) || '',
        quantity: item.quantity as number,
      }
    })
  }, [])

  const pushLocalCartToServer = useCallback(async (localItems: CartItem[], userId: string) => {
    if (localItems.length === 0) return
    const rows = localItems.map(item => ({
      user_id: userId,
      food_id: item.foodId,
      quantity: item.quantity,
    }))
    await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,food_id' })
  }, [])

  // ───── Initialization ─────

  // Load cart on mount / user change
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        // Logged in: server is the source of truth
        setIsSyncing(true)
        try {
          // If user just logged in and there are local items, push them to server first
          if (user.id !== prevUserId.current && !hasLoadedRef.current) {
            const storedCart = localStorage.getItem("cart")
            if (storedCart) {
              try {
                const localItems = JSON.parse(storedCart) as CartItem[]
                if (localItems.length > 0) {
                  await pushLocalCartToServer(localItems, user.id)
                }
              } catch { /* ignore corrupt data */ }
              localStorage.removeItem("cart")
            }
          }

          // Fetch latest server cart as the single source of truth
          const serverItems = await fetchServerCart()
          setItems(serverItems)
        } catch (error) {
          console.error("Error loading cart:", error)
        } finally {
          setIsSyncing(false)
          hasLoadedRef.current = true
        }
      } else if (!user && prevUserId.current) {
        // User logged out — clear cart state, keep nothing
        setItems([])
        localStorage.removeItem("cart")
        hasLoadedRef.current = false
      } else if (!user) {
        // Guest: load from localStorage
        const storedCart = localStorage.getItem("cart")
        if (storedCart) {
          try {
            setItems(JSON.parse(storedCart) as CartItem[])
          } catch { /* ignore */ }
        }
        hasLoadedRef.current = true
      }

      prevUserId.current = user?.id || null
    }

    loadCart()
  }, [user, fetchServerCart, pushLocalCartToServer])

  // Save cart to localStorage for guests only
  useEffect(() => {
    if (!user && hasLoadedRef.current) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items, user])

  // ───── Cart Operations ─────

  const MAX_QUANTITY = 20

  const addToCart = async (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.foodId === newItem.foodId)

      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + newItem.quantity, MAX_QUANTITY)
        if (newQty === existingItem.quantity) {
          toast.error(`Maximum ${MAX_QUANTITY} items allowed`)
          return prevItems
        }
        toast.success("Item quantity updated")
        return prevItems.map(i =>
          i.foodId === newItem.foodId ? { ...i, quantity: newQty } : i
        )
      } else {
        toast.success("Added to cart")
        return [...prevItems, { ...newItem, quantity: Math.min(newItem.quantity, MAX_QUANTITY) }]
      }
    })

    // Sync to server outside of setItems to avoid closure issues
    if (user) {
      try {
        await supabase.from('cart_items').upsert({
          user_id: user.id,
          food_id: newItem.foodId,
          quantity: newItem.quantity,
        }, { onConflict: 'user_id,food_id' })
      } catch { /* ignore */ }
    }
  }

  const removeFromCart = async (foodId: string) => {
    setItems(prevItems => prevItems.filter(i => i.foodId !== foodId))
    toast.info("Item removed from cart")

    if (user) {
      try {
        await supabase.from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('food_id', foodId)
      } catch { /* ignore */ }
    }
  }

  const updateQuantity = async (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId)
      return
    }
    if (quantity > MAX_QUANTITY) {
      toast.error(`Maximum ${MAX_QUANTITY} items allowed`)
      return
    }

    setItems(prevItems =>
      prevItems.map(i => i.foodId === foodId ? { ...i, quantity } : i)
    )

    if (user) {
      try {
        await supabase.from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('food_id', foodId)
      } catch { /* ignore */ }
    }
  }

  const clearCart = async () => {
    setItems([])
    toast.info("Cart cleared")

    if (user) {
      try {
        await supabase.from('cart_items')
          .delete()
          .eq('user_id', user.id)
      } catch { /* ignore */ }
    }
  }

  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const cartCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        cartCount,
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

