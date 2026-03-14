"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { Clock, Plus } from "lucide-react"
import Image from "next/image"

interface Food {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  availability: boolean
  preparation_time?: number
  is_veg?: boolean
}

export function FoodCard({ food }: { food: Food }) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <Card className={`group overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 ${food.availability ? "hover:border-primary/30 hover:glow-orange" : "opacity-75 grayscale-[0.3]"}`}>
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={food.image}
          alt={food.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          quality={75}
          className={`object-cover transition-transform duration-500 ${food.availability ? "group-hover:scale-110" : ""}`}
        />
        
        {/* Out of Stock Overlay */}
        {!food.availability && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
            <span className="bg-destructive/90 text-destructive-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg tracking-wide uppercase">
              Out of Stock
            </span>
          </div>
        )}

        {/* Veg/Non-veg dot */}
        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm p-1 rounded-sm shadow-sm border border-border">
          <div className={`w-3 h-3 rounded-full ${food.is_veg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        {/* Prep time badge */}
        {food.preparation_time && (
          <div className="absolute top-3 right-3 flex items-center gap-1 glass rounded-full px-2.5 py-1">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground">{food.preparation_time}m</span>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-5 pb-3">
        <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">{food.category}</span>
        <h3 className="font-bold text-base mt-1.5 line-clamp-1">{food.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed min-h-[2rem]">
          {food.description}
        </p>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-5 pt-0 flex items-center justify-between">
        <span className="text-xl font-bold text-primary">₹{food.price.toFixed(0)}</span>
        {!isAdmin && (
          <Button
            size="sm"
            disabled={!food.availability}
            className={`rounded-xl h-9 px-4 gap-1.5 transition-all ${
              food.availability 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95" 
                : "bg-secondary text-muted-foreground w-full"
            }`}
            onClick={() =>
              addToCart({
                foodId: food.id,
                name: food.name,
                price: food.price,
                image: food.image,
                quantity: 1,
              })
            }
          >
            {food.availability ? (
              <>
                <Plus className="w-4 h-4" /> Add
              </>
            ) : (
              "Unavailable"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
