"use client"

import { useState, useEffect, useMemo } from "react"
import { FoodCard } from "@/components/food-card"
import { Input } from "@/components/ui/input"
import { Search, Flame, Loader2 } from "lucide-react"
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

  // Derive categories dynamically from fetched foods
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(foods.map((f) => f.category))].sort()
    return ["All", ...uniqueCategories]
  }, [foods])

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .eq('availability', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setFoods(data || [])
      } catch (error) {
        console.error("Failed to fetch foods:", error)
      } finally {
        setLoading(false)
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
          if (data) setFoods(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || food.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen">
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

            <div className="relative w-full lg:top-8 md:w-80">
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
            {categories.map((category) => (
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold mb-2">No dishes found</h3>
            <p className="text-muted-foreground text-sm">
              {foods.length === 0
                ? "No items added yet. Admin can add food items from the dashboard."
                : "Try a different search or category."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
