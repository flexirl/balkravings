"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, LogOut, Wallet } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { StoreBanner } from "./store-banner";
import { LaunchBanner } from "./launch-banner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import supabase from "@/lib/supabase";

export function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { walletBalance, walletLoading } = useWallet();
  const isAdmin = user?.role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [storeOpensAt, setStoreOpensAt] = useState<string | null>(null);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [animateCart, setAnimateCart] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('*').single();
        if (data) {
          setIsStoreOpen(data.is_store_open ?? true);
          setStoreOpensAt(data.store_opens_at ?? null);
          setClosedMessage(data.closed_message ?? null);
        }
      } catch {}
    };
    fetchSettings();

    // Real-time: update store banner when admin changes settings
    const channel = supabase
      .channel('navbar-settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'settings' },
        (payload) => {
          const data = payload.new as { is_store_open?: boolean; store_opens_at?: string | null; closed_message?: string | null };
          if (data.is_store_open !== undefined) setIsStoreOpen(data.is_store_open);
          if (data.store_opens_at !== undefined) setStoreOpensAt(data.store_opens_at);
          if (data.closed_message !== undefined) setClosedMessage(data.closed_message ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cart bounce animation
  useEffect(() => {
    if (cartCount > 0) {
      const timer1 = setTimeout(() => setAnimateCart(true), 0);
      const timer2 = setTimeout(() => setAnimateCart(false), 400);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [cartCount]);

  const navItems = isAdmin
    ? [
        { href: "/menu", label: "Menu" },
        { href: "/admin", label: "Dashboard" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/menu", label: "Menu" },
        { href: "/#offers", label: "Offers" },
        { href: "/#contact", label: "Contact" },
        { href: "/#aboutUs", label: "About us" },
      ];

  return (
    <>
      <LaunchBanner />
      <StoreBanner isStoreOpen={isStoreOpen} storeOpensAt={storeOpensAt} closedMessage={closedMessage} />

      <nav className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 relative">

          {/* LEFT: Hamburger */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Left Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-display text-lg tracking-wide text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CENTER LOGO */}
          <Link
            href="/"
            className={`absolute left-1/2 -translate-x-1/2 text-center font-[family-name:var(--font-galindo)] text-primary`}
          >
            {/* Desktop */}
            <span className="hidden md:block text-3xl lg:text-4xl tracking-wide">
              KRAVINGS by ARF
            </span>

            {/* Tablet */}
            <span className="hidden sm:block md:hidden text-2xl tracking-wide">
              KRAVINGS by ARF
            </span>

            {/* Mobile */}
            <span className="block sm:hidden leading-tight">
              <span className="block text-2xl font-semibold tracking-wide">
                KRAVINGS
              </span>
              <span className="block text-sm tracking-widest opacity-80">
                by ARF
              </span>
            </span>
          </Link>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-1.5 sm:gap-3">

            {/* WALLET — Always visible when logged in */}
            {user && !walletLoading && (
              <Link
                href="/profile?tab=wallet"
                className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-colors ${
                  walletBalance > 0
                    ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                    : 'bg-secondary/50 border-border hover:bg-secondary'
                }`}
              >
                <Wallet className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${walletBalance > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] sm:text-xs font-bold ${walletBalance > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  ₹{walletBalance.toFixed(0)}
                </span>
              </Link>
            )}

            {/* CART — Always visible */}
            <Link href="/cart" className="relative">
              <motion.div
                animate={
                  animateCart
                    ? { scale: [1, 1.25, 0.95, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4 }}
              >
                <ShoppingCart className="h-6 w-6 text-foreground" />
              </motion.div>

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth - Visible on both mobile and desktop when logged in */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="hover:text-primary">Dashboard</Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="hover:text-primary">My Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="hover:text-primary">My Orders</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                {/* Desktop Login/Signup */}
                <Link
                  href="/login"
                  className="hidden md:block font-display text-lg text-foreground hover:text-primary transition-colors"
                >
                  LOGIN
                </Link>

                <Link
                  href="/register"
                  className="hidden md:block bg-primary text-primary-foreground font-display text-lg px-5 py-2 rounded-sm hover:bg-primary/90 transition-colors tracking-wide"
                >
                  SIGN UP
                </Link>

                {/* Mobile Login button */}
                <Link
                  href="/login"
                  className="md:hidden font-display text-sm tracking-wide text-foreground hover:text-primary transition-colors"
                >
                  LOGIN
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-background border-b border-border px-4 pb-6 pt-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 font-display text-xl text-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Login/Signup inside menu as well */}
              {!user && (
                <div className="mt-6 flex flex-col gap-4">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block font-display text-xl text-foreground hover:text-primary"
                  >
                    LOGIN
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="block bg-primary text-primary-foreground font-display text-xl px-6 py-3 rounded-sm text-center"
                  >
                    SIGN UP
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
