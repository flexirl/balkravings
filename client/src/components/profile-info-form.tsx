'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { profileAPI } from '@/lib/profile-api'
import styles from './profile-info-form.module.css'

export default function ProfileInfoForm() {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setMessage(null)

    try {
      await profileAPI.updateProfile(user.id, {
        name: formData.name,
        phone: formData.phone,
      })

      updateUser({
        name: formData.name,
        phone: formData.phone,
      })

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: unknown) {
      const err = error as { message?: string }
      setMessage({
        type: 'error',
        text: err.message || 'Failed to update profile',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.subtitle}>Profile Information</h2>

      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.input}
            disabled
          />
          <p className={styles.hint}>Email cannot be changed</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            className={styles.input}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
