"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, createContext, useContext, Suspense } from "react"
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, ChefHat, Settings, Tag, Megaphone, Mail, Star } from "lucide-react"

export type AdminTab = "dashboard" | "orders" | "foods" | "settings" | "coupons" | "offers" | "emails" | "reviews"

interface AdminTabContextType {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  newOrderBadge: number
  setNewOrderBadge: React.Dispatch<React.SetStateAction<number>>
}

const AdminTabContext = createContext<AdminTabContextType>({
  activeTab: "dashboard",
  setActiveTab: () => {},
  newOrderBadge: 0,
  setNewOrderBadge: () => {},
})

export const useAdminTab = () => useContext(AdminTabContext)

const NAV_ITEMS: { tab: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { tab: "orders", label: "Orders", icon: ShoppingBag },
  { tab: "foods", label: "Menu Items", icon: UtensilsCrossed },
  { tab: "settings", label: "Settings", icon: Settings },
  { tab: "coupons", label: "Coupons", icon: Tag },
  { tab: "offers", label: "Offer Cards", icon: Megaphone },
  { tab: "emails", label: "Emails", icon: Mail },
  { tab: "reviews", label: "Reviews", icon: Star },
]

const VALID_TABS = new Set<string>(NAV_ITEMS.map(i => i.tab))

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newOrderBadge, setNewOrderBadge] = useState(0)

  // Derive active tab directly from URL (no useState sync needed)
  const tabFromUrl = searchParams.get("tab") || "dashboard"
  const activeTab: AdminTab = VALID_TABS.has(tabFromUrl) ? (tabFromUrl as AdminTab) : "dashboard"

  // Update URL when tab changes & clear badge when switching to orders
  const setActiveTab = (tab: AdminTab) => {
    if (tab === "orders") {
      setNewOrderBadge(0)
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) return null

  return (
    <AdminTabContext.Provider value={{ activeTab, setActiveTab, newOrderBadge, setNewOrderBadge }}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/30 hidden md:flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <ChefHat className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Admin Panel</p>
                <p className="text-[10px] text-muted-foreground">KRAVINGS BY ARF</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.tab
              const showBadge = item.tab === "orders" && newOrderBadge > 0 && !isActive
              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                      {newOrderBadge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </AdminTabContext.Provider>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  )
}

