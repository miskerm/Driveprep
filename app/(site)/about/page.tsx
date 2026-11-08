import type { Metadata } from 'next'
import { AboutPage as AboutPageComponent } from '@/components/pages/about'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About Us | DrivoPrep',
  description: 'Learn more about DrivoPrep and our mission to help Ethiopian learners pass their driving theory test.',
}

export default async function AboutPage() {
  return <AboutPageComponent />
}
