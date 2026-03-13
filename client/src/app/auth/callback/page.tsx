"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()

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
          // Session established — redirect to homepage
          router.push("/")
        } else {
          // No session yet — wait for onAuthStateChange to fire
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
              if (event === "SIGNED_IN" && newSession) {
                subscription.unsubscribe()
                router.push("/")
              }
            }
          )

          // Timeout fallback — if no session after 5s, redirect to login
          setTimeout(() => {
            subscription.unsubscribe()
            router.push("/login?error=auth_timeout")
          }, 5000)
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
      <p className="text-muted-foreground text-sm">Signing you in...</p>
    </div>
  )
}
