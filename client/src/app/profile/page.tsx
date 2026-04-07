'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import ProfileInfoForm from '@/components/profile-info-form'
import AddressManagement from '@/components/address-management'
import { WalletSection } from '@/components/wallet-section'
import styles from './profile.module.css'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'wallet'>(
    tabFromUrl === 'wallet' ? 'wallet' : tabFromUrl === 'addresses' ? 'addresses' : 'profile'
  )

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'wallet') setActiveTab('wallet')
    else if (tab === 'addresses') setActiveTab('addresses')
  }, [searchParams])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>My Account</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            Addresses
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'wallet' ? styles.active : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            💰 Wallet
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' && <ProfileInfoForm />}
          {activeTab === 'addresses' && <AddressManagement />}
          {activeTab === 'wallet' && <WalletSection />}
        </div>
      </div>
    </div>
  )
}

