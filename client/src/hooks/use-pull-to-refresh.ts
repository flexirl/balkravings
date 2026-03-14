"use client"

import { useRef, useState, useCallback, useEffect } from "react"

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
}

interface PullToRefreshReturn {
  pullIndicatorRef: React.RefObject<HTMLDivElement | null>
  isRefreshing: boolean
  pullProgress: number
}

/**
 * Custom hook for pull-to-refresh on mobile devices.
 * Attach `pullIndicatorRef` to a container element at the top of the page.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 60,
}: PullToRefreshOptions): PullToRefreshReturn {
  const pullIndicatorRef = useRef<HTMLDivElement | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const startY = useRef(0)
  const pulling = useRef(false)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    },
    [isRefreshing]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return

      const deltaY = e.touches[0].clientY - startY.current
      if (deltaY > 0 && window.scrollY === 0) {
        const progress = Math.min(deltaY / threshold, 1)
        setPullProgress(progress)

        if (pullIndicatorRef.current) {
          pullIndicatorRef.current.style.transform = `translateY(${Math.min(deltaY * 0.5, threshold)}px)`
          pullIndicatorRef.current.style.opacity = String(progress)
        }
      } else {
        pulling.current = false
        setPullProgress(0)
        if (pullIndicatorRef.current) {
          pullIndicatorRef.current.style.transform = "translateY(0px)"
          pullIndicatorRef.current.style.opacity = "0"
        }
      }
    },
    [isRefreshing, threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullProgress >= 1 && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullProgress(0)
    if (pullIndicatorRef.current) {
      pullIndicatorRef.current.style.transition = "transform 0.2s ease, opacity 0.2s ease"
      pullIndicatorRef.current.style.transform = "translateY(0px)"
      pullIndicatorRef.current.style.opacity = "0"
      setTimeout(() => {
        if (pullIndicatorRef.current) {
          pullIndicatorRef.current.style.transition = ""
        }
      }, 200)
    }
  }, [pullProgress, isRefreshing, onRefresh])

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { pullIndicatorRef, isRefreshing, pullProgress }
}
