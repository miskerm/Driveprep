export type UserRole = 'user' | 'admin'
export type AccountStatus = 'active' | 'terminated'
export type PaymentStatus = 'unpaid' | 'pending' | 'approved' | 'rejected'
export type PaymentReviewStatus = 'pending' | 'approved' | 'rejected'

export type PaymentRecord = {
  id: string
  userId: number
  userName: string
  userEmail: string | null
  userPhone: string | null
  amount: number
  currency: string
  reference: string
  status: PaymentReviewStatus
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: number | null
  reason: string | null
  receiptName: string
  telegramMessageId: number | null
  telegramFileId: string | null
  telegramFileUniqueId: string | null
  createdAt: string
  updatedAt: string
}

export type AccountEvent = {
  id: string
  userId: number
  userName: string
  actorId: number | null
  action: string
  detail: string
  createdAt: string
}
