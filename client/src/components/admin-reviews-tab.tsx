"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare, Eye, EyeOff, AlertTriangle, TrendingUp } from "lucide-react"
import supabase from "@/lib/supabase"

interface Review {
  id: string
  user_name: string
  rating: number
  review_text: string | null
  is_public: boolean
  created_at: string
  order_id: string
}

const EMOJI_MAP: Record<number, string> = {
  5: "😍",
  4: "😊",
  3: "🙂",
  2: "😕",
  1: "😢",
}

export function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setReviews(data || [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchAllReviews()

    // Real-time updates
    const channel = supabase
      .channel("admin-reviews")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        (payload) => {
          setReviews((prev) => [payload.new as Review, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Stats
  const totalReviews = reviews.length
  const publicReviews = reviews.filter((r) => r.is_public)
  const privateReviews = reviews.filter((r) => !r.is_public)
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "—"
  const publicAvgRating =
    publicReviews.length > 0
      ? (publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length).toFixed(1)
      : "—"

  // Star breakdown
  const starBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: totalReviews > 0 ? Math.round((reviews.filter((r) => r.rating === star).length / totalReviews) * 100) : 0,
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold">Reviews</h2></div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-6"><div className="h-8 bg-secondary rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reviews</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All customer feedback — private reviews are only visible here
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Real Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{averageRating} ⭐</div>
            <p className="text-xs text-muted-foreground mt-1">Across all reviews</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Public Average</CardTitle>
            <Eye className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{publicAvgRating} ⭐</div>
            <p className="text-xs text-muted-foreground mt-1">{publicReviews.length} reviews visible on site</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Private Feedback</CardTitle>
            <EyeOff className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{privateReviews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Hidden from public</p>
          </CardContent>
        </Card>
      </div>

      {/* Star Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Rating Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {starBreakdown.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-right">{star} ⭐</span>
                <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      star >= 4 ? "bg-green-500" : star === 3 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-16 text-xs text-muted-foreground text-right">
                  {count} ({percent}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground mt-1">Reviews will appear here when customers rate their delivered orders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">All Reviews</h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`p-5 rounded-2xl border transition-all ${
                review.is_public
                  ? "bg-card border-border"
                  : "bg-orange-500/5 border-orange-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 font-semibold text-lg shrink-0">
                    {review.user_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.user_name || "Customer"}</span>
                      {!review.is_public && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          PRIVATE
                        </span>
                      )}
                      {review.is_public && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <Eye className="h-3 w-3" />
                          PUBLIC
                        </span>
                      )}
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-lg">{EMOJI_MAP[review.rating] || "🙂"}</span>
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${
                            j < review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(review.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {review.review_text && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed pl-[52px]">
                  &quot;{review.review_text}&quot;
                </p>
              )}

              <div className="mt-2 pl-[52px]">
                <span className="text-[10px] text-muted-foreground/60">
                  Order #{review.order_id?.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
