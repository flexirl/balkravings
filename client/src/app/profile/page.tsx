'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import ProfileInfoForm from '@/components/profile-info-form'
import AddressManagement from '@/components/address-management'
import styles from './profile.module.css'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
            Profile Information
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            Delivery Addresses
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' && <ProfileInfoForm />}
          {activeTab === 'addresses' && <AddressManagement />}
        </div>
      </div>
    </div>
  )
}
