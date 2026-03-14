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
  const isInitialLoad = useRef(true)
  const prevUserId = useRef<string | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart) as CartItem[])
      } catch {
        // ignore corrupt data
      }
    }
    isInitialLoad.current = false
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isInitialLoad.current) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items])

  // Fetch cart from Supabase for logged-in users
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

  // Sync local cart to Supabase
  const syncToServer = useCallback(async (cartItems: CartItem[]) => {
    if (!user) return

    try {
      setIsSyncing(true)

      // Upsert current items
      if (cartItems.length > 0) {
        const rows = cartItems.map(item => ({
          user_id: user.id,
          food_id: item.foodId,
          quantity: item.quantity,
        }))

        await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,food_id' })
      }

      // Delete items that are no longer in the cart
      const currentFoodIds = cartItems.map(item => item.foodId)
      if (currentFoodIds.length > 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .not('food_id', 'in', `(${currentFoodIds.join(',')})`)
      } else {
        // Cart is empty — delete all server items
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error("Error syncing cart:", error)
    } finally {
      setIsSyncing(false)
    }
  }, [user])

  // Handle user login — merge local cart with server cart
  useEffect(() => {
    if (isInitialLoad.current) return

    const handleUserChange = async () => {
      if (user && user.id !== prevUserId.current) {
        // User just logged in
        setIsSyncing(true)
        try {
          const serverItems = await fetchServerCart()
          const localItems = items

          if (localItems.length > 0 && serverItems.length > 0) {
            // Merge: server takes priority, add local-only items
            const serverMap = new Map(serverItems.map(i => [i.foodId, i]))
            const merged = [...serverItems]
            for (const local of localItems) {
              if (!serverMap.has(local.foodId)) {
                merged.push(local)
              }
            }
            setItems(merged)
            await syncToServer(merged)
          } else if (localItems.length > 0) {
            // Only local items — push to server
            await syncToServer(localItems)
          } else if (serverItems.length > 0) {
            // Only server items — load to local
            setItems(serverItems)
          }
        } catch (error) {
          console.error("Error merging carts:", error)
        } finally {
          setIsSyncing(false)
        }
      } else if (!user && prevUserId.current) {
        // User logged out — keep local cart as-is
      }

      prevUserId.current = user?.id || null
    }

    handleUserChange()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_QUANTITY = 20

  const addToCart = async (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.foodId === newItem.foodId)
      let updatedItems: CartItem[]

      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + newItem.quantity, MAX_QUANTITY)
        if (newQty === existingItem.quantity) {
          toast.error(`Maximum ${MAX_QUANTITY} items allowed`)
          return prevItems
        }
        toast.success("Item quantity updated")
        updatedItems = prevItems.map(i =>
          i.foodId === newItem.foodId
            ? { ...i, quantity: newQty }
            : i
        )
      } else {
        toast.success("Added to cart")
        updatedItems = [...prevItems, { ...newItem, quantity: Math.min(newItem.quantity, MAX_QUANTITY) }]
      }

      // Sync to server in background
      if (user) {
        syncToServer(updatedItems)
      }

      return updatedItems
    })
  }

  const removeFromCart = (foodId: string) => {
    setItems(prevItems => {
      const updatedItems = prevItems.filter(i => i.foodId !== foodId)
      if (user) syncToServer(updatedItems)
      return updatedItems
    })
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
    setItems(prevItems => {
      const updatedItems = prevItems.map(i =>
        i.foodId === foodId ? { ...i, quantity } : i
      )
      if (user) syncToServer(updatedItems)
      return updatedItems
    })
  }

  const clearCart = () => {
    setItems([])
    if (user) {
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .then()
    }
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
