"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

export function CtaSection() {
  return (
    <section className="relative bg-[#E5A83E] overflow-visible">

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 items-center">

        {/* LEFT TEXT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="px-6 sm:px-12 lg:px-20 py-20"
        >
          <h2 className="font-display text-black leading-[1.05]
                         text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            READY TO SATISFY YOUR
          </h2>

          <h3 className="font-display text-primary mt-4 leading-[1.05]
                         text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            MIDNIGHT CRAVINGS?
          </h3>

          <p className="mt-6 text-base sm:text-lg text-black/80 max-w-lg leading-relaxed">
            Join hundreds of students & locals who have upgraded their late-night
            food game. Hot, fresh, and delivered in minutes.
          </p>

          <p className="mt-3 text-sm text-black/60 italic">
            * No minimum order value
          </p>

          <Link
            href="/menu"
            className="inline-block mt-8 bg-primary text-primary-foreground
                       font-display text-base sm:text-lg px-8 py-3
                       rounded-full hover:bg-primary/90 transition"
          >
            ORDER NOW
          </Link>
        </motion.div>
      </div>

      {/* IMAGE WITH TOP + BOTTOM OVERFLOW */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="hidden lg:block absolute right-0
                   top-[-120px] bottom-[-120px]
                   w-[55%] z-0"
      >
        <Image
          src="/catering-food-900.webp"
          alt="Food spread"
          fill
          priority
          className="object-contain object-right"
        />
      </motion.div>

    </section>
  )
}