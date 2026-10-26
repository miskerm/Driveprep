'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'
import { setPremiumRestriction } from '@/lib/db'
import { recordAccountEvent, setUserAccountStatus } from '@/lib/account-admin'
import { accountKey, getUserById, hasPremium } from '@/lib/users'

function revalidateLearnerViews() {
  revalidatePath('/admin/users')
  revalidatePath('/admin/payments')
  revalidatePath('/dashboard')
  revalidatePath('/study')
  revalidatePath('/practice')
  revalidatePath('/full-mock')
  revalidatePath('/quizzes')
  revalidatePath('/payment')
  revalidatePath('/payment/pending')
}

export async function setPremiumRestrictionAction(formData: FormData) {
  const admin = await requireAdmin()
  const userId = Number(formData.get('userId'))
  const restricted = String(formData.get('restricted') ?? '') === 'true'

  if (!Number.isInteger(userId) || userId <= 0) redirect('/admin/users?result=error')

  const target = await getUserById(userId)
  if (!target || target.role === 'admin') redirect('/admin/users?result=error')

  let updated = false
  try {
    updated = await setPremiumRestriction(accountKey(target), restricted, {
      name: target.name,
      plan: hasPremium(target) ? 'premium_1000' : 'free',
    })
  } catch (error) {
    console.error(`Could not update premium access for user ${userId}:`, error)
    redirect('/admin/users?result=error')
  }

  if (!updated) redirect('/admin/users?result=error')

  try {
    await recordAccountEvent({
      userId: target.id,
      actorId: admin.id,
      action: restricted ? 'premium_restricted' : 'premium_restored',
      detail: restricted
        ? 'Premium access was restricted by an administrator. The learner is blocked from premium content.'
        : 'Premium access restriction was removed by an administrator.',
    })
  } catch (error) {
    console.error(`Could not record premium access change for user ${userId}:`, error)
  }

  revalidateLearnerViews()
  redirect(restricted ? '/admin/users?result=premium-restricted' : '/admin/users?result=premium-restored')
}

export async function setAccountStatusAction(formData: FormData) {
  const admin = await requireAdmin()
  const userId = Number(formData.get('userId'))
  const status = String(formData.get('status') ?? '') === 'terminated' ? 'terminated' : 'active'

  if (!Number.isInteger(userId) || userId <= 0) redirect('/admin/users?result=error')

  let result = { ok: false, message: '' }
  try {
    result = await setUserAccountStatus(userId, status, admin)
  } catch (error) {
    console.error(`Could not set account status for user ${userId}:`, error)
    redirect('/admin/users?result=error')
  }

  if (!result.ok) redirect('/admin/users?result=error')

  console.log(`Admin ${admin.id} updated account ${userId}: ${result.message}`)
  revalidateLearnerViews()
  redirect(status === 'terminated' ? '/admin/users?result=terminated' : '/admin/users?result=activated')
}
