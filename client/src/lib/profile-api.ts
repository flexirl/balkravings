import supabase from './supabase'
import { User, Address } from '@/context/auth-context'

// Profile endpoints — now using Supabase directly
export const profileAPI = {
  getProfile: async (userId: string): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) return null

    const { data: { user: authUser } } = await supabase.auth.getUser()

    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })

    return {
      id: userId,
      name: profile.name || '',
      email: authUser?.email || '',
      phone: profile.phone || '',
      role: profile.role || 'user',
      addresses: addresses || [],
    }
  },

  updateProfile: async (userId: string, data: { name?: string; phone?: string }): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },

  changePassword: async (newPassword: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    return {}
  },

  // Address endpoints
  getAddresses: async (userId: string): Promise<Address[]> => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
    return data || []
  },

  addAddress: async (userId: string, address: Omit<Address, 'id'>): Promise<Address[]> => {
    // If setting as default, unset all others first
    if (address.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    const { error } = await supabase
      .from('addresses')
      .insert({ ...address, user_id: userId })
    if (error) throw new Error(error.message)

    return profileAPI.getAddresses(userId)
  },

  updateAddress: async (userId: string, addressId: string, address: Partial<Address>): Promise<Address[]> => {
    if (address.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    await supabase
      .from('addresses')
      .update(address)
      .eq('id', addressId)
      .eq('user_id', userId)

    return profileAPI.getAddresses(userId)
  },

  deleteAddress: async (userId: string, addressId: string): Promise<Address[]> => {
    await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)

    return profileAPI.getAddresses(userId)
  },
}
