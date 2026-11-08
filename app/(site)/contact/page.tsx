import type { Metadata } from 'next'
import { ContactPage as ContactPageComponent } from '@/components/pages/contact'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact | DrivoPrep',
  description: 'Get in touch with DrivoPrep. Phone, email, address, and social links.',
}

export default async function ContactPage() {
  return <ContactPageComponent />
}
