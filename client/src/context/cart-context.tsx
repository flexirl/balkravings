"use client"

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react"
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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const { user } = useAuth()

  // Track previous user to load saved cart on user change
  const prevUserId = useRef<string | null | undefined>(undefined)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSaveRef = useRef(false)

  // ─── Load cart from Supabase when user logs in ───
  useEffect(() => {
    const currentId = user?.id || null

    const loadCart = async (userId: string) => {
      skipSaveRef.current = true
      try {
        const { data } = await supabase
          .from('profiles')
          .select('cart')
          .eq('id', userId)
          .single()
        const savedCart = data?.cart as CartItem[] | null
        setItems(savedCart && Array.isArray(savedCart) ? savedCart : [])
      } catch {
        setItems([])
      }
      setLoaded(true)
      setTimeout(() => { skipSaveRef.current = false }, 500)
    }

    if (prevUserId.current !== undefined && currentId !== prevUserId.current) {
      if (currentId) {
        loadCart(currentId)
      } else {
        setItems([])
        setLoaded(true)
      }
    } else if (prevUserId.current === undefined && currentId) {
      loadCart(currentId)
    } else if (prevUserId.current === undefined) {
      setLoaded(true)
    }

    prevUserId.current = currentId
  }, [user?.id])

  // ─── Debounced save to Supabase on cart change ───
  const saveCart = useCallback((cartItems: CartItem[]) => {
    if (!user?.id || skipSaveRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('profiles')
          .update({ cart: cartItems })
          .eq('id', user.id)
      } catch { /* silent */ }
    }, 1000) // 1s debounce
  }, [user?.id])

  // Save whenever items change (after initial load)
  useEffect(() => {
    if (loaded) {
      saveCart(items)
    }
  }, [items, loaded, saveCart])

  // ───── Cart Operations ─────

  const MAX_QUANTITY = 20

  const addToCart = (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.foodId === newItem.foodId)

      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + newItem.quantity, MAX_QUANTITY)
        if (newQty === existingItem.quantity) {
          return prevItems
        }
        return prevItems.map(i =>
          i.foodId === newItem.foodId ? { ...i, quantity: newQty } : i
        )
      } else {
        const finalQty = Math.min(newItem.quantity, MAX_QUANTITY)
        return [...prevItems, { ...newItem, quantity: finalQty }]
      }
    })
  }

  const removeFromCart = (foodId: string) => {
    setItems(prevItems => prevItems.filter(i => i.foodId !== foodId))
    toast.info("Item removed from cart")
  }

  const updateQuantity = (foodId: string, quantity: number) => {
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
  }

  const clearCart = () => {
    setItems([])
    toast.info("Cart cleared")
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
