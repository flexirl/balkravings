"use client"

import React from "react"

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-muted/60 animate-shimmer ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  )
}

/** Matches the FoodCard layout on the menu page */
export function MenuCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <Bone className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-32" />
          <Bone className="h-5 w-12 rounded-full" />
        </div>
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Bone className="h-6 w-16" />
          <Bone className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/** Matches order card on orders page */
export function OrderCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-5 w-40" />
          <Bone className="h-3 w-28" />
        </div>
        <Bone className="h-7 w-24 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-3/4" />
      </div>
      <div className="pt-3 border-t border-border flex justify-between items-center">
        <Bone className="h-5 w-20" />
        <Bone className="h-9 w-24 rounded-xl" />
      </div>
      {/* Timeline skeleton */}
      <div className="flex items-center gap-1 mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <Bone className="w-8 h-8 rounded-full" />
              <Bone className="h-2 w-12 mt-1.5" />
            </div>
            {i < 3 && <Bone className="h-0.5 flex-1 -mt-4 mx-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Matches cart item layout */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
      <Bone className="w-24 h-24 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between">
          <Bone className="h-5 w-32" />
          <Bone className="h-8 w-8 rounded-lg" />
        </div>
        <Bone className="h-3 w-20" />
        <div className="flex justify-between items-center">
          <Bone className="h-9 w-24 rounded-xl" />
          <Bone className="h-5 w-14" />
        </div>
      </div>
    </div>
  )
}

/** Matches the 4-stat dashboard cards */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-card border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Bone className="h-4 w-24" />
            <Bone className="h-9 w-9 rounded-xl" />
          </div>
          <Bone className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}

/** Matches admin order card */
export function AdminOrderSkeleton() {
  return (
    <div className="rounded-xl bg-card border border-border p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-28" />
            <Bone className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-1.5 flex flex-col items-end">
          <Bone className="h-5 w-14" />
          <Bone className="h-7 w-28 rounded-lg" />
        </div>
      </div>
      <div className="ml-12 space-y-1.5">
        <Bone className="h-3 w-48" />
        <Bone className="h-3 w-36" />
      </div>
    </div>
  )
}

/** Matches admin food item row */
export function AdminFoodSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
      <Bone className="h-16 w-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-36" />
          <Bone className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Bone className="h-6 w-16 rounded-lg" />
          <Bone className="h-6 w-14 rounded-lg" />
        </div>
      </div>
      <Bone className="h-4 w-10" />
      <div className="flex gap-2">
        <Bone className="h-8 w-8 rounded-lg" />
        <Bone className="h-8 w-8 rounded-lg" />
        <Bone className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  )
}
