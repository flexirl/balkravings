"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()

  // Determine redirect path based on user role
  const getRedirectPath = async (userId: string): Promise<string> => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
      if (data?.role === "admin") return "/admin"
      if (data?.role === "delivery") return "/delivery"
    } catch { /* fallback to home */ }
    return "/"
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase auto-detects the session from the URL hash/query
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Auth callback error:", error.message)
          router.push("/login?error=auth_failed")
          return
        }

        if (session) {
          // Session established — redirect based on role
          const path = await getRedirectPath(session.user.id)
          router.push(path)
        } else {
          // No session yet — wait for onAuthStateChange to fire
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === "SIGNED_IN" && newSession) {
                subscription.unsubscribe()
                const path = await getRedirectPath(newSession.user.id)
                router.push(path)
              }
            }
          )

          // Timeout fallback — if no session after 30s, redirect to login
          setTimeout(() => {
            subscription.unsubscribe()
            router.push("/login?error=auth_timeout")
          }, 30000)
        }
      } catch {
        router.push("/login?error=auth_failed")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Signing you in... This may take a moment.</p>
    </div>
  )
}
