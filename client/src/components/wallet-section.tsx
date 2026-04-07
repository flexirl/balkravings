"use client"

import { useEffect, useState } from "react"
import { useWallet, WalletTransaction } from "@/context/wallet-context"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, Sparkles } from "lucide-react"
import Link from "next/link"
import supabase from "@/lib/supabase"

export function WalletSection() {
  const { walletBalance, walletLoading, transactions, transactionsLoading, fetchTransactions } = useWallet()

  // Dynamic wallet settings from admin
  const [walletMinOrder, setWalletMinOrder] = useState(149)
  const [walletMaxPerOrder, setWalletMaxPerOrder] = useState(50)
  const [walletExpiryDays, setWalletExpiryDays] = useState(90)

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('wallet_min_order, wallet_max_per_order, wallet_expiry_days').single()
        if (data) {
          setWalletMinOrder(data.wallet_min_order ?? 149)
          setWalletMaxPerOrder(data.wallet_max_per_order ?? 50)
          setWalletExpiryDays(data.wallet_expiry_days ?? 90)
        }
      } catch { /* use defaults */ }
    }
    fetchSettings()
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return "Expired"
    if (diffDays <= 7) return `Expires in ${diffDays}d`
    if (diffDays <= 30) return `Expires in ${Math.ceil(diffDays / 7)}w`
    return `Expires ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet Balance</span>
          </div>

          {walletLoading ? (
            <div className="h-10 w-32 bg-primary/10 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-primary">
              ₹{walletBalance.toFixed(0)}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            Use up to ₹{walletMaxPerOrder} per order on orders above ₹{walletMinOrder}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          How Wallet Works
        </h4>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">1.</span>
            Apply a cashback-enabled coupon at checkout
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">2.</span>
            Cashback is credited to your wallet after order delivery
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">3.</span>
            Use wallet on next order (min ₹{walletMinOrder}, max ₹{walletMaxPerOrder} per order)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">4.</span>
            Credits expire {walletExpiryDays} days after being earned
          </li>
        </ul>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="font-bold text-lg mb-4">Transaction History</h3>

        {transactionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-7 w-7 text-primary/60" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">No transactions yet</p>
            <p className="text-xs text-muted-foreground">
              Use a cashback coupon to earn your first reward! 🎉
            </p>
            <Link
              href="/menu"
              className="inline-block mt-4 text-sm text-primary font-medium hover:underline"
            >
              Browse Menu →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn: WalletTransaction) => {
              const isCredit = txn.type === "credit"
              const expiryText = isCredit ? formatExpiry(txn.expires_at) : null

              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCredit ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowUpCircle className="h-4.5 w-4.5 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-4.5 w-4.5 text-red-500" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.reason}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(txn.created_at)}</span>
                      {expiryText && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {expiryText}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <span
                    className={`text-sm font-bold flex-shrink-0 ${
                      isCredit ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isCredit ? "+" : "-"}₹{txn.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
