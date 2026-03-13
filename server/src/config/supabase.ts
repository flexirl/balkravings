import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This is the ADMIN client for server-side operations
// It bypasses RLS - use responsibly
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default supabaseAdmin
