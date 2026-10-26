'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'
import { approvePayment, rejectPayment } from '@/lib/payments'

function revalidatePaymentViews() {
  revalidatePath('/admin/payments')
  revalidatePath('/admin/users')
  revalidatePath('/payment')
  revalidatePath('/payment/pending')
  revalidatePath('/dashboard')
  revalidatePath('/study')
  revalidatePath('/practice')
  revalidatePath('/full-mock')
  revalidatePath('/quizzes')
}

export async function approvePaymentAction(formData: FormData) {
  const admin = await requireAdmin()
  const paymentId = String(formData.get('paymentId') ?? '').trim()
  if (!paymentId) redirect('/admin/payments?result=missing')

  let approved = false
  try {
    approved = Boolean(await approvePayment(paymentId, admin.id))
  } catch (error) {
    console.error(`Could not approve payment ${paymentId}:`, error)
    redirect('/admin/payments?result=error')
  }

  revalidatePaymentViews()
  redirect(approved ? '/admin/payments?result=approved' : '/admin/payments?result=missing')
}

export async function rejectPaymentAction(formData: FormData) {
  const admin = await requireAdmin()
  const paymentId = String(formData.get('paymentId') ?? '').trim()
  const reason = String(formData.get('reason') ?? '').trim()
  if (!paymentId) redirect('/admin/payments?result=missing')

  let rejected = false
  try {
    rejected = Boolean(await rejectPayment(paymentId, admin.id, reason))
  } catch (error) {
    console.error(`Could not reject payment ${paymentId}:`, error)
    redirect('/admin/payments?result=error')
  }

  revalidatePaymentViews()
  redirect(rejected ? '/admin/payments?result=rejected' : '/admin/payments?result=missing')
}
