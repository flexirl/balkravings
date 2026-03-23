"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import supabase from "@/lib/supabase"

interface Review {
  id: string
  user_name: string
  rating: number
  review_text: string
  created_at: string
}

// Fallback testimonials when < 3 real public reviews exist
const FALLBACK_TESTIMONIALS: Review[] = [
  {
    id: "fb-1",
    user_name: "Sneha Das",
    rating: 5,
    review_text: "hostel mess band tha so I tried the aloo paratha + dahi raita combo and bhai it literally tasted like ghar ka khana?? the paratha was soft and stuffed properly not some dry maida thing. now every sunday I skip mess and order from here instead 😭",
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-2",
    user_name: "Rohit Mehra",
    rating: 5,
    review_text: "ordered matar paneer with fried rice for dinner and my roommate was like 'bro ye hostel mein kaise aa gaya'. that's the best review I can give lol. also the egg curry is underrated, tastes like something my mom would make ngl 😂",
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-3",
    user_name: "Ananya Mishra",
    rating: 4,
    review_text: "was craving chicken biryani at midnight and most places were closed. these guys delivered in 20 mins and the biryani had actual chicken pieces not just bones 😭 also tried their paneer bhurji paratha combo last week — pure comfort food. wallet is suffering tho because I keep ordering",
    created_at: new Date().toISOString(),
  },
]

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-card p-8 rounded-3xl border border-primary/10 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all duration-300 relative h-full">
      {/* Quotation mark decor */}
      <div className="absolute top-6 right-8 text-primary/15 font-serif text-6xl leading-none font-bold">&quot;</div>

      {/* Left accent stripe */}
      <div className="absolute left-0 top-8 bottom-8 w-1 rounded-full bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

      <div className="flex items-center gap-1 mb-6">
        {[...Array(5)].map((_, j) => (
          <Star
            key={j}
            className={`h-5 w-5 ${j < review.rating ? "text-amber-500 fill-amber-500" : "text-border"}`}
          />
        ))}
      </div>

      <p className="text-foreground/70 leading-relaxed mb-8 text-sm md:text-base relative z-10 line-clamp-4">
        &quot;{review.review_text}&quot;
      </p>

      <div className="flex items-center gap-4 mt-auto">
        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-display text-xl shadow-sm">
          {review.user_name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <h4 className="font-bold text-foreground text-sm">{review.user_name}</h4>
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const fetchPublicReviews = async () => {
      try {
        const { data } = await supabase
          .from("reviews")
          .select("id, user_name, rating, review_text, created_at")
          .eq("is_public", true)
          .not("review_text", "is", null)
          .order("created_at", { ascending: false })
          .limit(20)

        if (data && data.length >= 3) {
          setReviews(data)
        }
      } catch {
        // silently fall back to hardcoded
      } finally {
        setLoaded(true)
      }
    }
    fetchPublicReviews()
  }, [])

  // Use real reviews only if >= 3, otherwise fallback
  const displayReviews = reviews.length >= 3 ? reviews : FALLBACK_TESTIMONIALS

  // Average rating
  const avgRating = reviews.length >= 3
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "4.8"

  // Check scroll state
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [loaded, displayReviews, updateScrollState])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector("div")?.offsetWidth || 350
    el.scrollBy({ left: direction === "right" ? cardWidth + 32 : -(cardWidth + 32), behavior: "smooth" })
  }

  const hasSlider = displayReviews.length > 3

  return (
    <section className="py-24 relative bg-secondary/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4">
            Loved by <span className="text-[#d8232a]">KIITians</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            THEY CAME. THEY CRAVED. THEY CAME BACK. HERE&apos;S WHY.
          </p>
          {/* Average rating badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <span className="text-lg font-bold text-foreground">{avgRating}</span>
            <span className="text-sm text-muted-foreground">
              {reviews.length >= 3 ? `from ${reviews.length} review${reviews.length > 1 ? "s" : ""}` : "average rating"}
            </span>
          </div>
        </div>

        {/* Reviews Container */}
        <div className="relative">
          {/* Left Arrow */}
          {hasSlider && canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-secondary transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {hasSlider ? (
            /* Slider mode: horizontal scroll */
            <div
              ref={scrollRef}
              className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayReviews.map((review) => (
                <div
                  key={review.id}
                  className="snap-start flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[calc(33.333%-1.333rem)]"
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          ) : (
            /* Grid mode: standard 3-column grid */
            <div className="grid md:grid-cols-3 gap-8">
              {displayReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Right Arrow */}
          {hasSlider && canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-secondary transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Dot Indicators (mobile) */}
        {hasSlider && (
          <div className="flex justify-center gap-1.5 mt-6 md:hidden">
            {displayReviews.map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary/20" />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
