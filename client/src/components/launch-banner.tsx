"use client"

import { useState, useEffect } from "react"
import { Rocket, X } from "lucide-react"

// Launch date: March 18, 2026 at 12:00 PM IST
const LAUNCH_DATE = new Date("2026-03-18T11:00:00+05:30");

export function LaunchBanner() {
  const [timeLeft, setTimeLeft] = useState("")
  const [isVisible, setIsVisible] = useState(true)
  const [isLaunched, setIsLaunched] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = LAUNCH_DATE.getTime() - now

      if (distance <= 0) {
        setIsLaunched(true)
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

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-hide after launch date
  if (isLaunched || !isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground px-4 py-3 text-center">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
          <Rocket className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce" />
          <span>🔥 Your late-night cravings finally have an answer — <strong>Launching March 18th!</strong></span>
        </div>

        {timeLeft && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span>🚀 Launching in:</span>
            <span className="font-bold tracking-wider min-w-[80px]">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
