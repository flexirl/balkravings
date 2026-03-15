"use client"

import { Ticket, Gift, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

interface OfferCard {
  id: string
  position: number
  title: string
  description: string
  coupon_code: string | null
  cta_text: string
}

const DEFAULT_OFFERS: Omit<OfferCard, "id">[] = [
  { position: 1, title: "Flat 15% OFF", description: "On your first order with us. Use code", coupon_code: "KRAVINGS15", cta_text: "Claim Now →" },
  { position: 2, title: "Hostel Combo", description: "Order for 4 or more and get 750ml Coke bottle absolutely free. Best for match nights!", coupon_code: null, cta_text: "Order Combo →" },
  { position: 3, title: "Free Ice Cream", description: "Orders above ₹249 get a free Icecream. No coupon code required.", coupon_code: null, cta_text: "View Menu →" },
]

// Fixed styling per card position — icons, colors, etc. never change
const CARD_STYLES = [
  {
    icon: Ticket,
    cardClass: "bg-card border border-primary/20 shadow-lg hover:shadow-xl",
    iconWrap: "bg-orange-100 text-orange-600",
    titleClass: "text-foreground",
    descClass: "text-muted-foreground",
    ctaClass: "text-primary",
    decorClass: "w-24 h-24 bg-primary/10 group-hover:bg-primary/20",
  },
  {
    icon: Users,
    cardClass: "bg-primary text-primary-foreground shadow-xl hover:shadow-2xl",
    iconWrap: "bg-white/20",
    titleClass: "text-white",
    descClass: "text-primary-foreground/80",
    ctaClass: "text-white",
    decorClass: "w-32 h-32 bg-white/10 group-hover:bg-white/20",
    hasOverlayIcon: true,
  },
  {
    icon: Gift,
    cardClass: "bg-card border border-primary/20 shadow-lg hover:shadow-xl",
    iconWrap: "bg-green-100 text-green-600",
    titleClass: "text-foreground",
    descClass: "text-muted-foreground",
    ctaClass: "text-primary",
    decorClass: "w-24 h-24 bg-primary/10 group-hover:bg-primary/20",
  },
]

export function OffersSection() {
  const [offers, setOffers] = useState<Omit<OfferCard, "id">[]>(DEFAULT_OFFERS)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data, error } = await supabase
          .from("offer_cards")
          .select("*")
          .order("position", { ascending: true })
        if (!error && data && data.length === 3) {
          setOffers(data)
        }
      } catch {
        // silently fall back to defaults
      }
    }
    fetchOffers()
  }, [])

  return (
    <section id="offers" className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="absolute -top-[20rem] -right-[20rem] w-[40rem] h-[40rem] bg-orange-500/10 rounded-full blur-[100px] -z-10" />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary text-sm font-display uppercase tracking-widest mb-3">Special Deals</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4">
            Special Offers for KIIT & <span className="text-[#d8232a]">Nearby Areas</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Because we know the end-of-month broke feeling too well.<br/> Make the most of these active deals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {offers.map((offer, i) => {
            const style = CARD_STYLES[i]
            const Icon = style.icon
            return (
              <div
                key={offer.position}
                className={`relative p-8 rounded-3xl transition-all hover:-translate-y-1 overflow-hidden group ${style.cardClass}`}
              >
                <div className={`absolute top-0 right-0 rounded-bl-[100px] -z-10 transition-colors ${style.decorClass}`} />
                {style.hasOverlayIcon && (
                  <div className="absolute -bottom-4 -right-4 text-white/10 opacity-50">
                    <Icon className="h-32 w-32" />
                  </div>
                )}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${style.iconWrap}`}>
                  <Icon className={`h-6 w-6 ${i === 1 ? "text-white" : ""}`} />
                </div>
                <h3 className={`text-xl font-display mb-2 ${style.titleClass}`}>{offer.title}</h3>
                <p className={`mb-6 text-sm ${style.descClass}`}>
                  {offer.description}
                  {offer.coupon_code && (
                    <>
                      {" "}
                      <span className={`inline-block font-bold border border-dashed px-2.5 py-0.5 rounded-md text-xs tracking-wider uppercase ${
                        i === 1
                          ? "text-white bg-white/20 border-white/50"
                          : "text-primary bg-primary/10 border-primary/40"
                      }`}>
                        {offer.coupon_code?.toUpperCase()}
                      </span>
                      {" at checkout."}
                    </>
                  )}
                </p>
                <Link href="/menu" className={`font-bold hover:underline inline-flex items-center gap-1 text-sm ${style.ctaClass}`}>
                  {offer.cta_text}
                </Link>
              </div>
            )
          })}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          *Offers valid till Sunday midnight. Subject to availability.
        </p>
      </div>
    </section>
  );
}
