"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import supabase from "@/lib/supabase"
import { toast } from "sonner"

const EMOJI_RATINGS = [
  { emoji: "😍", label: "Loved it!", value: 5 },
  { emoji: "😊", label: "Great", value: 4 },
  { emoji: "🙂", label: "Good", value: 3 },
  { emoji: "😕", label: "Okay", value: 2 },
  { emoji: "😢", label: "Bad", value: 1 },
]

interface ReviewPromptProps {
  orderId: string
  onReviewSubmitted: () => void
}

export function ReviewPrompt({ orderId, onReviewSubmitted }: ReviewPromptProps) {
  const { user } = useAuth()
  const [selectedRating, setSelectedRating] = useState(5) // Default to 5
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to leave a review")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        order_id: orderId,
        rating: selectedRating,
        review_text: reviewText.trim() || null,
        user_name: user.name || "Customer",
        is_public: selectedRating >= 4, // Only 4-5 star reviews are public
      })

      if (error) {
        console.error("Review submit error:", error)
        if (error.code === "23505") {
          toast.info("You've already reviewed this order")
        } else {
          toast.error(`Review failed: ${error.message}`)
        }
      } else {
        toast.success("Thank you for your feedback! 🧡")
        onReviewSubmitted()
      }
    } catch (err) {
      console.error("Review submit exception:", err)
      toast.error("Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all active:scale-[0.98]"
      >
        ⭐ Rate your order
      </button>
    )
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-border bg-secondary/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Emoji Picker */}
      <div>
        <p className="text-sm font-medium mb-3 text-center">How was your food?</p>
        <div className="flex justify-center gap-2">
          {EMOJI_RATINGS.map((item) => (
            <button
              key={item.value}
              onClick={() => setSelectedRating(item.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                selectedRating === item.value
                  ? "bg-primary/10 ring-2 ring-primary/30 scale-110"
                  : "hover:bg-secondary opacity-60 hover:opacity-100"
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Tell us what you liked... (optional)"
        maxLength={300}
        rows={2}
        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/60"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowForm(false)}
          className="flex-1 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium gap-1.5"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Submit
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
