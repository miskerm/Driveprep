'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SessionProvider, signOut, useSession } from 'next-auth/react'
import {
  computeStats,
  dayKey,
  emptyProgress,
  type NotificationEntry,
  type ProgressState,
  type User,
} from '@/lib/quiz-data'
import { getDeviceIdentity } from '@/lib/device-client'
import { DEVICE_FLAG_THRESHOLD, type LearnerAccess } from '@/lib/access-types'

type AccessPayload = {
  user?: {
    id: number
    name: string
    email: string | null
    phone: string | null
    role: 'user' | 'admin'
    status: 'active' | 'terminated'
    paymentStatus: 'unpaid' | 'pending' | 'approved' | 'rejected'
    premiumEntitlement: boolean
  }
  access?: LearnerAccess | null
}

type AuthContextValue = {
  user: User
  access: LearnerAccess | null
  accessNotice: string
  loading: boolean
  refreshAccess: () => Promise<void>
  logout: () => Promise<void>
}

function noticeFor(access: LearnerAccess) {
  if (access.restricted) {
    return `Premium access is restricted for this account because it is active on ${access.deviceCount} device${access.deviceCount === 1 ? '' : 's'}. Ask the admin to restore it.`
  }
  if (access.deviceCount >= DEVICE_FLAG_THRESHOLD) {
    return `This account is active on ${access.deviceCount} devices, so the admin has flagged it for review. Premium accounts are meant for one device.`
  }
  return ''
}

function toUser(payload: AccessPayload): User {
  const profile = payload.user
  if (!profile) return null
  const premium =
    profile.status === 'active' &&
    profile.role === 'admin' ? true : profile.status === 'active' && profile.paymentStatus === 'approved' && profile.premiumEntitlement

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    status: profile.status,
    paymentStatus: profile.paymentStatus,
    premiumEntitlement: profile.premiumEntitlement,
    plan: premium ? 'premium_1000' : 'free',
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [user, setUser] = useState<User>(null)
  const [access, setAccess] = useState<LearnerAccess | null>(null)
  const [accessNotice, setAccessNotice] = useState('')
  const registeredRef = useRef('')
  const loading = status === 'loading'

  const applyPayload = useCallback((payload: AccessPayload) => {
    setUser(toUser(payload))
    setAccess(payload.access ?? null)
    setAccessNotice(payload.access ? noticeFor(payload.access) : '')
  }, [])

  const refreshAccess = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      const response = await fetch('/api/access/status', { cache: 'no-store' })
      if (!response.ok) return
      applyPayload((await response.json()) as AccessPayload)
    } catch (error) {
      console.error('Could not refresh account access:', error)
    }
  }, [applyPayload, status])

  useEffect(() => {
    if (status !== 'authenticated') {
      setUser(null)
      setAccess(null)
      setAccessNotice('')
      registeredRef.current = ''
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const device = getDeviceIdentity()
        const registerKey = `${device.deviceId}`
        if (registeredRef.current !== registerKey) {
          const response = await fetch('/api/access/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: device.deviceId, label: device.label }),
          })
          if (response.ok) {
            const payload = (await response.json()) as AccessPayload
            if (!cancelled) applyPayload(payload)
            registeredRef.current = registerKey
          }
        }

        const response = await fetch('/api/access/status', { cache: 'no-store' })
        if (!response.ok) return
        const payload = (await response.json()) as AccessPayload
        if (!cancelled) applyPayload(payload)
      } catch (error) {
        console.error('Could not verify this device:', error)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [applyPayload, status])

  useEffect(() => {
    if (status !== 'authenticated') return

    const refresh = () => void refreshAccess()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)
    const timer = window.setInterval(refresh, 60_000)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(timer)
    }
  }, [refreshAccess, status])

  const logout = useCallback(async () => {
    setUser(null)
    setAccess(null)
    setAccessNotice('')
    registeredRef.current = ''
    await signOut({ callbackUrl: '/' })
  }, [])

  const value = useMemo(
    () => ({ user, access, accessNotice, loading, refreshAccess, logout }),
    [access, accessNotice, loading, logout, refreshAccess, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

type ProgressContextValue = {
  stats: ReturnType<typeof computeStats>
  notifications: NotificationEntry[]
  unreadCount: number
  recordAnswer: (topic: string, questionId: number, correct: boolean) => void
  recordResult: (label: string, score: number) => void
  notify: (kind: NotificationEntry['kind'], title: string, message: string) => void
  markNotificationsRead: () => void
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined)

function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [progressByUser, setProgressByUser] = useState<Record<string, ProgressState>>({})
  const userKey = user ? String(user.email || user.phone || user.id) : 'guest'
  const progress = progressByUser[userKey] ?? emptyProgress

  const update = (change: (state: ProgressState) => ProgressState) => {
    setProgressByUser((all) => ({ ...all, [userKey]: change(all[userKey] ?? emptyProgress) }))
  }

  const recordAnswer = (topic: string, questionId: number, correct: boolean) => {
    const today = dayKey(new Date())
    update((state) => ({
      ...state,
      answers: { ...state.answers, [`${topic}:${questionId}`]: correct },
      attempts: state.attempts + 1,
      correctAttempts: state.correctAttempts + (correct ? 1 : 0),
      activeDays: state.activeDays.includes(today) ? state.activeDays : [...state.activeDays, today],
    }))
  }

  const recordResult = (label: string, score: number) => {
    update((state) => ({ ...state, results: [{ label, score, at: Date.now() }, ...state.results] }))
  }

  const notify = (kind: NotificationEntry['kind'], title: string, message: string) => {
    update((state) => ({ ...state, notifications: [{ kind, title, message, at: Date.now(), read: false }, ...state.notifications] }))
  }

  const markNotificationsRead = () => {
    update((state) => (state.notifications.some((item) => !item.read) ? { ...state, notifications: state.notifications.map((item) => ({ ...item, read: true })) } : state))
  }

  return (
    <ProgressContext.Provider
      value={{
        stats: computeStats(progress),
        notifications: progress.notifications,
        unreadCount: progress.notifications.filter((item) => !item.read).length,
        recordAnswer,
        recordResult,
        notify,
        markNotificationsRead,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress must be used within ProgressProvider')
  return context
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ProgressProvider>{children}</ProgressProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
