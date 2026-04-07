"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import supabase from "@/lib/supabase"
import { toast } from "sonner"

export interface WalletTransaction {
  id: string
  type: "credit" | "debit"
  amount: number
  reason: string
  order_id: string | null
  expires_at: string | null
  created_at: string
}

interface WalletContextType {
  walletBalance: number
  walletLoading: boolean
  transactions: WalletTransaction[]
  transactionsLoading: boolean
  refreshWalletBalance: () => Promise<void>
  fetchTransactions: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletLoading, setWalletLoading] = useState(true)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const hasCheckedNewCredits = useRef(false)

  const refreshWalletBalance = useCallback(async () => {
    if (!user) {
      setWalletBalance(0)
      setWalletLoading(false)
      return
    }
    try {
      const { data, error } = await supabase.rpc("get_wallet_balance", {
        p_user_id: user.id,
      })
      if (error) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .single()
        setWalletBalance(wallet?.balance ?? 0)
      } else {
        setWalletBalance(data?.balance ?? 0)
      }
    } catch {
      setWalletBalance(0)
    } finally {
      setWalletLoading(false)
    }
  }, [user])

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setTransactionsLoading(true)
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      setTransactions(data || [])
    } catch {
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }, [user])

  // Fetch balance when user changes
  useEffect(() => {
    if (user) {
      refreshWalletBalance()
    } else {
      setWalletBalance(0)
      setWalletLoading(false)
      setTransactions([])
      hasCheckedNewCredits.current = false
    }
  }, [user, refreshWalletBalance])

  // Check for new cashback credits since last visit and show notification
  useEffect(() => {
    if (!user || hasCheckedNewCredits.current) return
    hasCheckedNewCredits.current = true

    const checkNewCredits = async () => {
      try {
        const storageKey = `arf_last_seen_credit_${user.id}`
        const lastSeen = localStorage.getItem(storageKey)

        let query = supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "credit")
          .ilike("reason", "%cashback%")
          .order("created_at", { ascending: false })
          .limit(5)

        if (lastSeen) {
          query = query.gt("created_at", lastSeen)
        }

        const { data: newCredits } = await query
        if (newCredits && newCredits.length > 0) {
          const totalNew = newCredits.reduce((sum, c) => sum + Number(c.amount), 0)
          setTimeout(() => {
            toast.success(
              `🎉 ₹${totalNew} cashback${newCredits.length > 1 ? ` from ${newCredits.length} orders` : ''} has been added to your wallet!`,
              { duration: 6000 }
            )
          }, 1500)
        }

        // Update last seen to now
        localStorage.setItem(storageKey, new Date().toISOString())
      } catch { /* silent */ }
    }

    checkNewCredits()
  }, [user])

  // Real-time subscription for wallet balance + new credit notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { balance?: number }
          if (newData?.balance !== undefined) {
            setWalletBalance(newData.balance)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const txn = payload.new as WalletTransaction
          if (txn.type === "credit" && txn.reason?.toLowerCase().includes("cashback")) {
            toast.success(`🎉 ₹${txn.amount} cashback added to your wallet!`, { duration: 5000 })
            localStorage.setItem(`arf_last_seen_credit_${user.id}`, new Date().toISOString())
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <WalletContext.Provider
      value={{
        walletBalance,
        walletLoading,
        transactions,
        transactionsLoading,
        refreshWalletBalance,
        fetchTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
