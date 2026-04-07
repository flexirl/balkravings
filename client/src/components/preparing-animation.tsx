"use client"

import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"
import dynamic from "next/dynamic"

const DinoGame = dynamic(() => import("@/components/dino-game"), { ssr: false })

export default function PreparingAnimation() {
  return (
    <div className="mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-primary/5 border border-yellow-500/10 p-4">
      {/* Cooking animation header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <motion.div
            className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChefHat className="h-5 w-5 text-yellow-500" />
          </motion.div>

          {/* Steam particles */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-yellow-400/40"
                animate={{
                  y: [-2, -14],
                  opacity: [0.6, 0],
                  scale: [1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Your food is being prepared with love 🧡
          </p>
          <p className="text-[11px] text-muted-foreground">
            Our chef is working on your order right now
          </p>
        </div>
      </div>

      {/* Cooking progress bar animation */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="flex gap-1">
          {["🧅", "🍳", "🔥", "✨"].map((emoji, i) => (
            <motion.span
              key={i}
              className="text-sm"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-primary"
            animate={{ width: ["15%", "70%", "40%", "85%", "60%"] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Dino Game */}
      <DinoGame />
    </div>
  )
}
