"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { Plus, Sparkles } from "lucide-react"
import Image from "next/image"
import supabase from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SuggestedFood {
  id: string
  name: string
  price: number
  image: string
  category: string
  is_veg?: boolean
}

export function CartSuggestions() {
  const { items, addToCart } = useCart()
  const [suggestions, setSuggestions] = useState<SuggestedFood[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (items.length === 0) {
        setSuggestions([])
        setLoading(false)
        return
      }

      try {
        const cartFoodIds = items.map(i => i.foodId)
        const cartCategories = new Set<string>()

        // Get categories of items in cart
        const { data: cartFoods } = await supabase
          .from("foods")
          .select("category")
          .in("id", cartFoodIds)

        cartFoods?.forEach(f => cartCategories.add(f.category?.trim().toLowerCase()))

        // Fetch available foods NOT in cart, prioritizing:
        // 1. Different categories (add-ons / complements)
        // 2. Affordable items (under ₹150 — impulse buys)
        const { data: allFoods } = await supabase
          .from("foods")
          .select("id, name, price, image, category, is_veg")
          .eq("availability", true)
          .not("id", "in", `(${cartFoodIds.join(",")})`)
          .order("price", { ascending: true })

        if (!allFoods || allFoods.length === 0) {
          setSuggestions([])
          setLoading(false)
          return
        }

        // Smart sorting: prioritize different categories & cheaper items
        const scored = allFoods.map(food => {
          const foodCat = food.category?.trim().toLowerCase()
          const isDifferentCategory = !cartCategories.has(foodCat)
          const isAffordable = food.price <= 150
          // Score: different category items first, then affordable ones
          let score = 0
          if (isDifferentCategory) score += 2
          if (isAffordable) score += 1
          return { ...food, score }
        })

        // Sort by score desc, then shuffle within same score for variety
        scored.sort((a, b) => b.score - a.score || Math.random() - 0.5)

        // Take top 6 suggestions
        setSuggestions(scored.slice(0, 6))
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [items])

  const handleAddSuggestion = (food: SuggestedFood) => {
    addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      image: food.image,
      quantity: 1,
    })
    toast.success(`${food.name} added!`, {
      id: "suggestion-add",
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    })
  }

  if (loading || suggestions.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">People also ordered</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {suggestions.map((food) => (
          <div
            key={food.id}
            className="flex-shrink-0 w-36 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden group"
          >
            {/* Image */}
            <div className="relative h-24 w-full overflow-hidden">
              <Image
                src={food.image}
                alt={food.name}
                fill
                sizes="144px"
                quality={50}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Veg/Non-veg indicator */}
              <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm p-0.5 rounded-sm">
                <div className={`w-2 h-2 rounded-full ${food.is_veg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{food.category}</p>
              <h4 className="text-sm font-semibold mt-0.5 line-clamp-1">{food.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary">₹{food.price.toFixed(0)}</span>
                <button
                  onClick={() => handleAddSuggestion(food)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
