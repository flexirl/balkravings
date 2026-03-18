"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function WhatsAppFloat() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Only show on homepage, and not for admins
  if (pathname !== "/" || user?.role === "admin") return null

  const phone = "918018332575"
  const message = encodeURIComponent("Hi, I want to order from Kravings Kitchen")
 // const href = `https://wa.me/${phone}?text=${message}`
  
  const href = "https://chat.whatsapp.com/CDByGuGayaD98ZBo7v3Lt2?mode=gi_t"
  

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-current">
        <path d="M16.004 0C7.165 0 0 7.163 0 16.001c0 2.82.737 5.574 2.137 7.998L.072 32l8.208-2.04A15.93 15.93 0 0016.004 32C24.838 32 32 24.837 32 16.001 32 7.163 24.838 0 16.004 0zm0 29.39a13.36 13.36 0 01-7.222-2.114l-.518-.307-4.872 1.213 1.298-4.745-.337-.536A13.32 13.32 0 012.61 16.001c0-7.39 6.012-13.4 13.394-13.4 7.384 0 13.396 6.01 13.396 13.4 0 7.392-6.012 13.389-13.396 13.389zm7.344-10.028c-.402-.202-2.382-1.175-2.752-1.31-.37-.133-.639-.2-.908.201-.27.401-1.042 1.31-1.278 1.579-.236.268-.472.302-.874.1-.402-.2-1.697-.625-3.233-1.993-1.195-1.065-2.002-2.381-2.237-2.783-.236-.401-.025-.618.177-.817.181-.18.402-.469.604-.703.2-.235.268-.402.402-.67.134-.268.067-.502-.034-.703-.1-.2-.908-2.189-1.243-2.995-.328-.787-.66-.68-.908-.693l-.774-.013c-.268 0-.704.1-1.073.502-.37.401-1.41 1.376-1.41 3.357 0 1.98 1.443 3.893 1.644 4.162.201.268 2.84 4.333 6.879 6.075.962.414 1.712.661 2.297.847.965.306 1.843.263 2.537.16.774-.115 2.382-.974 2.718-1.914.335-.94.335-1.746.235-1.914-.1-.168-.37-.268-.773-.469z"/>
      </svg>
    </a>
  )
}
