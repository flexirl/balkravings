"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Session, User as SupabaseUser } from "@supabase/supabase-js"
import supabase from "@/lib/supabase"

export interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  phone_number: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  addresses?: Address[]
}

interface AuthContextType {
  user: User | null
  session: Session | null
  login: (email: string, password: string) => Promise<{ error?: string; role?: string }>
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch or create profile from profiles table
  const fetchOrCreateProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Try to get existing profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error || !profile) {
        // Profile doesn't exist — create it (for OAuth users or if trigger didn't fire)
        const name = supabaseUser.user_metadata?.name
          || supabaseUser.user_metadata?.full_name
          || supabaseUser.email?.split('@')[0]
          || ''

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: supabaseUser.id,
            name,
          })
          .select()
          .single()

        if (insertError || !newProfile) {
          console.error('Failed to create profile:', insertError?.message)
          // Still return a basic user object so the UI works
          return {
            id: supabaseUser.id,
            name,
            email: supabaseUser.email || '',
            role: 'user',
            addresses: [],
          }
        }

        return {
          id: supabaseUser.id,
          name: newProfile.name || name,
          email: supabaseUser.email || '',
          phone: newProfile.phone || '',
          role: newProfile.role || 'user',
          addresses: [],
        }
      }

      // Profile exists — fetch addresses too
      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('is_default', { ascending: false })

      return {
        id: supabaseUser.id,
        name: profile.name || '',
        email: supabaseUser.email || '',
        phone: profile.phone || '',
        role: profile.role || 'user',
        addresses: addresses || [],
      }
    } catch (err) {
      console.error('fetchOrCreateProfile error:', err)
      // Return a basic user even if DB fails
      return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
        email: supabaseUser.email || '',
        role: 'user',
        addresses: [],
      }
    }
  }

  // Initialize session and listen for auth changes
  useEffect(() => {
    // Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event, newSession?.user?.email)
        setSession(newSession)

        if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          const profile = await fetchOrCreateProfile(newSession.user)
          setUser(profile)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    // Then check existing session
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (currentSession?.user) {
        setSession(currentSession)
        const profile = await fetchOrCreateProfile(currentSession.user)
        setUser(profile)
      }
      setLoading(false)
    }

    initSession()

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ error?: string; role?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { error: error.message }

    if (data.user) {
      const profile = await fetchOrCreateProfile(data.user)
      setUser(profile)
      return { role: profile?.role || 'user' }
    }

    return { error: 'Login failed' }
  }

  const register = async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) return { error: error.message }

    if (data.user) {
      // Update profile name (trigger creates it, but we need to set the name)
      await supabase
        .from('profiles')
        .update({ name })
        .eq('id', data.user.id)

      const profile = await fetchOrCreateProfile(data.user)
      setUser(profile)
    }

    return {}
  }

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const logout = async () => {
    // Clear state immediately so UI updates before navigation
    setUser(null)
    setSession(null)
    // Clear local storage cart to avoid stale data
    localStorage.removeItem("cart")
    // Sign out from Supabase
    await supabase.auth.signOut()
    // Navigate after state is cleared
    router.push("/login")
    // Force a full page reload to reset all client state cleanly
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, session, login, register, loginWithGoogle, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
