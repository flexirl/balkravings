"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

function EmptyStateWrapper({ title, description, actionLabel, actionHref, children }: EmptyStateProps & { children: React.ReactNode }) {
  return (
    <div className="text-center py-20 space-y-5">
      <div className="mx-auto w-28 h-28 flex items-center justify-center">
        {children}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-6 mt-2">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  )
}

/** Empty cart illustration */
export function EmptyCart() {
  return (
    <EmptyStateWrapper
      title="Your cart is empty"
      description="Looks like you haven't added anything yet. Browse our delicious menu!"
      actionLabel="Browse Menu"
      actionHref="/menu"
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        <circle cx="60" cy="60" r="56" className="fill-secondary" />
        <rect x="30" y="45" width="60" height="40" rx="6" className="fill-muted stroke-border" strokeWidth="2" />
        <path d="M26 45 L34 28 H86 L94 45" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="44" cy="90" r="5" className="fill-muted-foreground/30" />
        <circle cx="76" cy="90" r="5" className="fill-muted-foreground/30" />
        <line x1="50" y1="60" x2="70" y2="60" className="stroke-muted-foreground/40" strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="68" x2="74" y2="68" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 78 Q60 73 65 78" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </EmptyStateWrapper>
  )
}

/** Empty orders illustration */
export function EmptyOrders() {
  return (
    <EmptyStateWrapper
      title="No orders yet"
      description="Place your first order from our menu and track it here!"
      actionLabel="Browse Menu"
      actionHref="/menu"
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        <circle cx="60" cy="60" r="56" className="fill-secondary" />
        <rect x="32" y="25" width="56" height="72" rx="6" className="fill-card stroke-border" strokeWidth="2" />
        <line x1="42" y1="42" x2="78" y2="42" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="52" x2="68" y2="52" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="62" x2="74" y2="62" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="72" x2="62" y2="72" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
        <circle cx="78" cy="78" r="16" className="fill-primary/10 stroke-primary" strokeWidth="2" />
        <path d="M73 78 L76 81 L83 74" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </EmptyStateWrapper>
  )
}

/** Empty menu / no items illustration */
export function EmptyMenu() {
  return (
    <EmptyStateWrapper
      title="No items yet"
      description="No items added yet. Admin can add food items from the dashboard."
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        <circle cx="60" cy="60" r="56" className="fill-secondary" />
        <ellipse cx="60" cy="72" rx="32" ry="8" className="fill-muted stroke-border" strokeWidth="2" />
        <ellipse cx="60" cy="68" rx="32" ry="8" className="fill-card stroke-border" strokeWidth="2" />
        <circle cx="50" cy="54" r="6" className="fill-primary/20 stroke-primary/40" strokeWidth="1.5" />
        <circle cx="66" cy="50" r="5" className="fill-primary/15 stroke-primary/30" strokeWidth="1.5" />
        <circle cx="58" cy="42" r="4" className="fill-primary/10 stroke-primary/25" strokeWidth="1.5" />
        <path d="M40 38 Q60 28 80 38" className="stroke-muted-foreground/20" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      </svg>
    </EmptyStateWrapper>
  )
}

/** No search results illustration */
export function NoResults() {
  return (
    <EmptyStateWrapper
      title="No dishes found"
      description="Try a different search or category."
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        <circle cx="60" cy="60" r="56" className="fill-secondary" />
        <circle cx="52" cy="52" r="22" className="stroke-muted-foreground/40" strokeWidth="2.5" fill="none" />
        <line x1="68" y1="68" x2="88" y2="88" className="stroke-muted-foreground/40" strokeWidth="3" strokeLinecap="round" />
        <line x1="44" y1="48" x2="60" y2="48" className="stroke-muted-foreground/25" strokeWidth="2" strokeLinecap="round" />
        <line x1="44" y1="56" x2="56" y2="56" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </EmptyStateWrapper>
  )
}
