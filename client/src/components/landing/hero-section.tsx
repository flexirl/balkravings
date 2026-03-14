"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/HeroImage-2000.avif"
          alt="Kravings hero background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        
    <motion.h1
    initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="font-display text-[#D91729] leading-none tracking-wide"
>
  <span className="sr-only">Kravings Kitchen by ARF — Late Night Food Delivery in KIIT & Nearby Areas, Patia, Bhubaneswar</span>
  <span className="block text-6xl sm:text-7xl md:text-8xl -mt-40" aria-hidden="true">
    Midnight Cravings?
  </span>

  <span className="block text-5xl sm:text-6xl md:text-7xl" aria-hidden="true">
    We Got You.
  </span>
</motion.h1>
      

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <Link
            href="/menu"
            className="inline-block mt-10  bg-primary text-primary-foreground font-display text-2xl px-10 py-4 rounded-xl hover:bg-primary/90 transition-colors tracking-widest"
          >
            ORDER NOW
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
