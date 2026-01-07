import Header from '@/components/Header/Header'
import Hero from '@/components/Hero/Hero'
import InfoSection from '@/components/InfoSection/InfoSection'
import { ScrollProvider } from '@/components/ScrollContext'

export default function Home() {
  return (
    <ScrollProvider>
      <Header />
      <main>
        <Hero />
        <InfoSection />
      </main>
    </ScrollProvider>
  )
}
