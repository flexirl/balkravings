"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ChefHat, Instagram, Facebook, Twitter, Globe } from "lucide-react"

const slideVariants = {
  enter: { opacity: 0, y: 20, filter: "blur(4px)" },
  center: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -20, filter: "blur(4px)" },
}

const transition = {
  duration: 0.6,
  ease: "easeOut" as const,
}

export function BrandFlipCard() {
  const [showFlexirl, setShowFlexirl] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFlexirl((prev) => !prev)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="md:col-span-1 relative" style={{ minHeight: "220px" }}>
      <AnimatePresence mode="wait">
        {!showFlexirl ? (
          <motion.div
            key="kravings"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {/* Kravings Card */}
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-[family-name:var(--font-galindo)] text-xl leading-none tracking-wide text-primary">
                  KRAVINGS <br />by ARF
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Premium cloud kitchen serving hot, hygiene-first, and chef-crafted
              meals for students &amp; professionals across KIIT, Patia &amp; nearby
              areas in Bhubaneswar.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://www.instagram.com/kravings_by.arf/" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://facebook.com/kravingsbyarf" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://twitter.com/kravingsbyarf" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="flexirl"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {/* "Developed & marketed by" label */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
              Developed &amp; marketed by
            </p>

            {/* Flexirl Brand — no logo, text-only */}
            <Link href="https://flexirl.com" target="_blank" rel="noopener noreferrer" className="inline-block mb-4 group">
              <span className="font-[family-name:var(--font-galindo)] text-2xl leading-none tracking-wide text-primary group-hover:opacity-80 transition-opacity">
                FLEXIRL
              </span>
              <span className="block h-0.5 w-0 group-hover:w-full bg-primary/40 transition-all duration-300 mt-1 rounded-full" />
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              The agency behind this platform. We design, develop, and grow
              brands — from ordering systems to marketing that drives real
              customers.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://instagram.com/flexirl_/" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://flexirl.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
                <Globe className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
