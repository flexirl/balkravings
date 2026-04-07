"use client"

import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import { WalletProvider } from "@/context/wallet-context"
import { Toaster } from "@/components/ui/sonner"
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <AuthProvider>
        <WalletProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </SmoothScrollProvider>
  )
}

