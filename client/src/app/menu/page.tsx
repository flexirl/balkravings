"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { FoodCard } from "@/components/food-card"
import { Input } from "@/components/ui/input"
import { Search, Flame } from "lucide-react"
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

export default function MenuPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const pathname = usePathname()

  // Derive categories dynamically from fetched foods
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(foods.map((f) => f.category))].sort()
    return ["All", ...uniqueCategories]
  }, [foods])

  // Fetch foods — runs on mount AND on every soft navigation to /menu
  useEffect(() => {
    let cancelled = false

    const fetchFoods = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .eq('availability', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (!cancelled) setFoods(data || [])
      } catch (error) {
        console.error("Failed to fetch foods:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchFoods()

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
            .eq('availability', true)
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
    const matchesCategory = selectedCategory === "All" || food.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const refreshFoods = useCallback(async () => {
    const { data } = await supabase
      .from('foods')
      .select('*')
      .eq('availability', true)
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
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Flame className="h-7 w-7 text-primary" />
                Our Menu
              </h1>
              <p className="text-muted-foreground mt-1">
                {filteredFoods.length} items available
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search dishes..."
                className="pl-10 h-11 rounded-xl bg-secondary border-border focus:border-primary/50 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((category) => {
              const count = category === "All" ? foods.length : foods.filter(f => f.category === category).length
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {category}
                  <span className={`ml-1.5 text-xs ${selectedCategory === category ? "opacity-80" : "opacity-60"}`}>
                    ({count})
                  </span>
                </button>
              )
            })}
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
    </div>
  )
}
