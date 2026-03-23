"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Session, User as SupabaseUser } from "@supabase/supabase-js"
import supabase from "@/lib/supabase"
import api from "@/lib/api"

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
  const profileCache = useRef<Map<string, User>>(new Map())

  // Fetch or create profile from profiles table — with parallel queries
  const fetchOrCreateProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    // Check cache first to avoid duplicate fetches
    const cached = profileCache.current.get(supabaseUser.id)
    if (cached) return cached

    try {
      // Fetch profile and addresses IN PARALLEL
      const [profileResult, addressesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
        supabase.from('addresses').select('*').eq('user_id', supabaseUser.id).order('is_default', { ascending: false }),
      ])

      if (profileResult.error || !profileResult.data) {
        // Profile doesn't exist — create it (for OAuth users or if trigger didn't fire)
        const name = supabaseUser.user_metadata?.name
          || supabaseUser.user_metadata?.full_name
          || supabaseUser.email?.split('@')[0]
          || ''

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({ id: supabaseUser.id, name })
          .select()
          .single()

        if (insertError || !newProfile) {
          const fallback: User = {
            id: supabaseUser.id,
            name,
            email: supabaseUser.email || '',
            role: 'user',
            addresses: [],
          }
          profileCache.current.set(supabaseUser.id, fallback)
          return fallback
        }

        const result: User = {
          id: supabaseUser.id,
          name: newProfile.name || name,
          email: supabaseUser.email || '',
          phone: newProfile.phone || '',
          role: newProfile.role || 'user',
          addresses: addressesResult.data || [],
        }
        profileCache.current.set(supabaseUser.id, result)

        // Fire-and-forget: Send welcome email for new users (including Google OAuth)
        api.post('/email/welcome', { name: result.name, email: result.email })
          .catch((err) => console.warn('[Welcome Email] Failed:', err.message))

        return result
      }

      const result: User = {
        id: supabaseUser.id,
        name: profileResult.data.name || '',
        email: supabaseUser.email || '',
        phone: profileResult.data.phone || '',
        role: profileResult.data.role || 'user',
        addresses: addressesResult.data || [],
      }
      profileCache.current.set(supabaseUser.id, result)
      return result
    } catch (err) {
      console.error('fetchOrCreateProfile error:', err)
      const fallback: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
        email: supabaseUser.email || '',
        role: 'user',
        addresses: [],
      }
      return fallback
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
          profileCache.current.clear()
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

  // Login — just authenticate, let onAuthStateChange handle profile loading
  const login = async (email: string, password: string): Promise<{ error?: string; role?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { error: error.message }

    if (data.user) {
      const profile = await fetchOrCreateProfile(data.user)
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
      // onAuthStateChange will handle setting the user via fetchOrCreateProfile

      // Fire-and-forget: Send welcome email (non-blocking)
      api.post('/email/welcome', { name, email })
        .catch((err) => console.warn('[Welcome Email] Failed:', err.message))
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
      const updated = { ...user, ...userData }
      setUser(updated)
      profileCache.current.set(user.id, updated)
    }
  }

  const logout = async () => {
    // Sign out from Supabase first — clears session from localStorage
    await supabase.auth.signOut()
    // Clear app state after signout is complete
    setUser(null)
    setSession(null)
    profileCache.current.clear()
    // Navigate to login
    router.push("/login")
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
