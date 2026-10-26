import type { Metadata } from 'next'
import { PricingPage } from '@/components/pages/pricing-page'
import { getPaymentConfig } from '@/lib/payment-config'

export const metadata: Metadata = {
  title: 'Pricing | DrivoPrep',
  description: 'Premium access for the DrivoPrep Code 2 learner test.',
}

export default function PricingRoute() {
  const config = getPaymentConfig()
  return <PricingPage amountLabel={config.amountLabel} />
}
