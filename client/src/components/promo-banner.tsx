"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import Image from "next/image"
import supabase from "@/lib/supabase"

export function PromoBanner() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("promo_dismissed")) return

    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("banner_image, banner_enabled")
          .single()
        if (!error && data?.banner_enabled && data?.banner_image) {
          setBannerUrl(data.banner_image)
        }
      } catch {
        // silently fail
      }
    }
    fetchBanner()
  }, [])

  const handleClose = () => {
    setDismissed(true)
    sessionStorage.setItem("promo_dismissed", "1")
  }

  if (!bannerUrl || dismissed) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Banner Image — adapts to any aspect ratio */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt="Promotional offer"
            className={`w-full h-auto max-h-[85vh] object-contain rounded-2xl transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <div className="w-full aspect-[4/5] bg-secondary animate-pulse rounded-2xl" />
          )}
        </div>
      </div>
    </div>
  )
}
