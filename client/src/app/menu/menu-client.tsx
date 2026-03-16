"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { FoodCard } from "@/components/food-card"
import { useCart } from "@/context/cart-context"
import { Input } from "@/components/ui/input"
import { Search, Flame, ShoppingBag, ArrowRight } from "lucide-react"
import { MenuCardSkeleton } from "@/components/skeleton-loaders"
import { EmptyMenu, NoResults } from "@/components/empty-states"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import supabase from "@/lib/supabase"

interface Food {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  rating: number
  preparation_time?: number
  availability: boolean
  is_veg: boolean
}

export default function MenuClient({ initialFoods }: { initialFoods: Food[] }) {
  const [foods, setFoods] = useState<Food[]>(initialFoods)
  const [loading, setLoading] = useState(false)
  const { items, totalAmount } = useCart()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [bestsellerNames, setBestsellerNames] = useState<Set<string>>(new Set())
  const pathname = usePathname()

  // Derive categories dynamically from fetched foods (normalized to avoid duplicates from casing/whitespace)
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    foods.forEach((f) => {
      const key = f.category.trim().toLowerCase()
      if (!seen.has(key)) seen.set(key, f.category.trim())
    })
    const uniqueCategories = [...seen.values()].sort()
    return ["All", "🔥 Bestsellers", ...uniqueCategories]
  }, [foods])

  // Fetch bestseller data from order_items
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const { data } = await supabase
          .from('order_items')
          .select('name, quantity')
        if (data) {
          const counts: Record<string, number> = {}
          data.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1)
          })
          const topNames = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name]) => name.toLowerCase())
          setBestsellerNames(new Set(topNames))
        }
      } catch { /* ignore */ }
    }
    fetchBestsellers()
  }, [foods])

  // Re-fetch on soft navigation + set up real-time
  useEffect(() => {
    let cancelled = false

    // Real-time: auto-update menu when admin adds/edits/removes food
    const channel = supabase
      .channel('menu-foods')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'foods' },
        async () => {
          const { data } = await supabase
            .from('foods')
            .select('*')
            .order('availability', { ascending: false })
            .order('created_at', { ascending: false })
          if (data && !cancelled) setFoods(data)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [pathname])

  // Scroll to top whenever the menu page is navigated to
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "All"
        ? true
        : selectedCategory === "🔥 Bestsellers"
        ? bestsellerNames.has(food.name.toLowerCase())
        : food.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    return matchesSearch && matchesCategory
  })

  const refreshFoods = useCallback(async () => {
    const { data } = await supabase
      .from('foods')
      .select('*')
      .order('availability', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setFoods(data)
  }, [])

  const { pullIndicatorRef, isRefreshing } = usePullToRefresh({ onRefresh: refreshFoods })

  return (
    <div className="min-h-screen relative">
      {/* Pull-to-refresh indicator */}
      <div
        ref={pullIndicatorRef}
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-3 opacity-0 z-50 pointer-events-none"
      >
        <div className={`h-6 w-6 rounded-full border-2 border-primary border-t-transparent ${isRefreshing ? 'animate-spin' : ''}`} />
      </div>
      {/* Page Heading (scrolls away) */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 md:px-6 pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Flame className="h-7 w-7 text-primary" />
                Our Menu
              </h1>
              <p className="text-muted-foreground mt-1">
                {filteredFoods.length} items available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Search + Filters */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-16 z-30">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search dishes..."
              className="pl-10 h-10 rounded-xl bg-secondary border-border focus:border-primary/50 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        ) : (
          <div className="py-8">
            {foods.length === 0 ? <EmptyMenu /> : <NoResults />}
          </div>
        )}
      </div>
      {/* Floating Cart Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 animate-in slide-in-from-bottom duration-300">
          <Link href="/cart">
            <div className="container mx-auto max-w-lg">
              <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-white text-primary text-[10px] font-bold">
                      {items.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  </div>
                  <span className="font-semibold text-sm">View Cart</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{totalAmount.toFixed(0)}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
