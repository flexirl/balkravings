"use client"

import { useState, useEffect } from "react"
import { Clock, Store, MessageCircle } from "lucide-react"

interface StoreBannerProps {
  isStoreOpen: boolean
  storeOpensAt: string | null
  closedMessage?: string | null
}

export function StoreBanner({ isStoreOpen, storeOpensAt, closedMessage }: StoreBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    if (isStoreOpen || !storeOpensAt) return

    const targetDate = new Date(storeOpensAt).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance <= 0) {
        setTimeLeft("Opening soon...")
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      const parts = []
      if (days > 0) parts.push(`${days}d`)
      if (hours > 0) parts.push(`${hours}h`)
      parts.push(`${minutes}m`)
      parts.push(`${seconds}s`)

      setTimeLeft(parts.join(" "))
    }

    updateTimer() // Initial call
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [isStoreOpen, storeOpensAt])

  if (isStoreOpen) return null

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
          <div className="flex items-center justify-center gap-2 text-destructive font-semibold">
            <Store className="w-5 h-5" />
            <span>We are currently closed</span>
          </div>
          
          {storeOpensAt && timeLeft && (
            <div className="flex items-center gap-2 text-sm sm:text-base text-foreground font-medium bg-background/50 px-3 py-1 rounded-full border border-border">
              <Clock className="w-4 h-4 text-primary animate-pulse" />
              Opens in: <span className="font-mono text-primary w-[80px] text-left">{timeLeft}</span>
            </div>
          )}
        </div>

        {closedMessage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <MessageCircle className="w-4 h-4 shrink-0 text-primary" />
            <span>{closedMessage}</span>
          </div>
        )}
      </div>
    </div>
  )
}
