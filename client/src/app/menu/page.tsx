import { createClient } from "@supabase/supabase-js"
import MenuClient from "./menu-client"

// Server-side Supabase client for SSR data fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

async function getFoods() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .order("category", { ascending: true })
    .order("availability", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch foods for SSR:", error)
    return []
  }

  return data || []
}

export const revalidate = 60 // Re-generate page every 60 seconds

export default async function MenuPage() {
  const foods = await getFoods()

  return <MenuClient initialFoods={foods} />
}
