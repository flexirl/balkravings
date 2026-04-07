"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { MapPin, Clock, Navigation } from "lucide-react"

const TOTAL_DURATION_SECONDS = 600 // 10 minutes
const ARF_MAPS_URL = "https://maps.app.goo.gl/o918FREhhMjCztzFA"

export default function DeliveryTracker() {
  const [progress, setProgress] = useState(0) // 0 to 1
  const [etaMinutes, setEtaMinutes] = useState(10)
  const startTimeRef = useRef(Date.now())
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  // Intersection observer — pause when not visible
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Progress animation
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const p = Math.min(elapsed / TOTAL_DURATION_SECONDS, 1)
      setProgress(p)

      const remaining = Math.max(0, Math.ceil((TOTAL_DURATION_SECONDS - elapsed) / 60))
      setEtaMinutes(remaining + 1)

      if (p >= 1) {
        // Loop — restart
        startTimeRef.current = Date.now()
      }
    }, 200)

    return () => clearInterval(interval)
  }, [isVisible])

  // SVG path for the road — a nice S-curve
  const roadPath = "M 30 120 C 100 120, 80 50, 180 50 C 280 50, 260 120, 340 120 C 420 120, 400 55, 470 55"

  // Cached SVG path ref for efficient point calculations
  const pathRef = useRef<SVGPathElement | null>(null)
  const pathLenRef = useRef(0)

  useEffect(() => {
    if (typeof document === "undefined") return
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", roadPath)
    svg.appendChild(path)
    svg.style.position = "absolute"
    svg.style.width = "0"
    svg.style.height = "0"
    svg.style.overflow = "hidden"
    document.body.appendChild(svg)
    pathRef.current = path
    pathLenRef.current = path.getTotalLength()
    return () => { document.body.removeChild(svg) }
  }, [roadPath])

  const getPointOnPath = (t: number) => {
    if (!pathRef.current) return { x: 30, y: 120 }
    const point = pathRef.current.getPointAtLength(t * pathLenRef.current)
    return { x: point.x, y: point.y }
  }

  const riderPos = getPointOnPath(progress)

  return (
    <div ref={containerRef} className="mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-primary/5 border border-purple-500/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Navigation className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Rider on the way!</p>
            <p className="text-[11px] text-muted-foreground">Your order is out for delivery</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-card/80 px-3 py-1.5 rounded-xl border border-border">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-bold text-primary">{etaMinutes} min</span>
        </div>
      </div>

      {/* Animation SVG */}
      <div className="relative w-full" style={{ aspectRatio: "500 / 170" }}>
        <svg viewBox="0 0 500 170" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Background elements - trees & buildings */}
          {/* Tree 1 */}
          <circle cx="120" cy="80" r="12" fill="hsl(145, 40%, 55%)" opacity="0.3" />
          <rect x="117" y="88" width="6" height="10" rx="1" fill="hsl(30, 40%, 40%)" opacity="0.3" />
          {/* Tree 2 */}
          <circle cx="250" cy="35" r="10" fill="hsl(145, 40%, 50%)" opacity="0.25" />
          <rect x="248" y="42" width="5" height="8" rx="1" fill="hsl(30, 40%, 40%)" opacity="0.25" />
          {/* Tree 3 */}
          <circle cx="380" cy="85" r="11" fill="hsl(145, 40%, 55%)" opacity="0.3" />
          <rect x="377" y="92" width="6" height="9" rx="1" fill="hsl(30, 40%, 40%)" opacity="0.3" />
          {/* Small building */}
          <rect x="180" y="80" width="18" height="22" rx="2" fill="hsl(220, 20%, 70%)" opacity="0.2" />
          <rect x="183" y="84" width="4" height="4" rx="0.5" fill="hsl(220, 30%, 50%)" opacity="0.2" />
          <rect x="190" y="84" width="4" height="4" rx="0.5" fill="hsl(220, 30%, 50%)" opacity="0.2" />

          {/* Road path — dashed background */}
          <path d={roadPath} fill="none" stroke="hsl(0, 0%, 80%)" strokeWidth="20" strokeLinecap="round" opacity="0.3" />
          {/* Road center line */}
          <path d={roadPath} fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.5" />

          {/* Progress fill */}
          <path
            d={roadPath}
            fill="none"
            stroke="hsl(271, 50%, 55%)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 - progress * 1000}
            opacity="0.6"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />

          {/* Start marker — ARF Kitchen (clickable to Google Maps) */}
          <a href={ARF_MAPS_URL} target="_blank" rel="noopener noreferrer">
            <g style={{ cursor: "pointer" }}>
              <circle cx="30" cy="120" r="14" fill="hsl(0, 72%, 40%)" opacity="0.15" />
              <circle cx="30" cy="120" r="8" fill="hsl(0, 72%, 40%)" />
              <text x="30" y="124" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">🍳</text>
              <text x="30" y="148" textAnchor="middle" fill="hsl(0, 72%, 40%)" fontSize="7" fontWeight="700" textDecoration="underline">ARF Café</text>
              <text x="30" y="158" textAnchor="middle" fill="hsl(0, 0%, 55%)" fontSize="5">📍 View on Map</text>
            </g>
          </a>

          {/* End marker — Destination */}
          <g>
            {/* Pulsing ring */}
            <circle cx="470" cy="55" r="16" fill="none" stroke="hsl(145, 50%, 50%)" strokeWidth="2" opacity="0.3">
              <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="470" cy="55" r="8" fill="hsl(145, 50%, 45%)" />
            <text x="470" y="59" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">📍</text>
            <text x="470" y="80" textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize="7" fontWeight="600">You</text>
          </g>

          {/* Rider icon — 🛵 flipped to face right */}
          <motion.g
            animate={{ x: riderPos.x - 30, y: riderPos.y - 120 }}
            transition={{ duration: 0.3, ease: "linear" }}
          >
            {/* Shadow */}
            <ellipse cx="30" cy="126" rx="10" ry="3" fill="rgba(0,0,0,0.1)" />
            {/* Rider body */}
            <circle cx="30" cy="114" r="12" fill="hsl(271, 60%, 50%)" />
            {/* Flip scooter horizontally so it faces right */}
            <g transform="translate(30, 118) scale(-1, 1)">
              <text x="0" y="0" textAnchor="middle" fontSize="13">🛵</text>
            </g>
          </motion.g>

          {/* Progress percentage dots */}
          {[0.25, 0.5, 0.75].map((p) => {
            const pt = getPointOnPath(p)
            const reached = progress >= p
            return (
              <circle
                key={p}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={reached ? "hsl(271, 60%, 50%)" : "hsl(0, 0%, 80%)"}
                style={{ transition: "fill 0.5s ease" }}
              />
            )
          })}
        </svg>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-primary"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  )
}
