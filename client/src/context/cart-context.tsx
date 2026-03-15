"use client"

import React, { createContext, useContext, useState, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "./auth-context"

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
  const { user } = useAuth()

  // Track previous user to clear cart on user change (login/logout/switch)
  const prevUserId = useRef<string | null | undefined>(undefined)

  // Clear cart whenever user changes (logout, login, switch account)
  if (prevUserId.current !== undefined && (user?.id || null) !== prevUserId.current) {
    setItems([])
  }
  prevUserId.current = user?.id || null

  // ───── Cart Operations (session-only, no database) ─────

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
