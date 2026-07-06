import Hero from '@/components/landing/Hero'
import ProductCarousel from '@/components/landing/ProductCarousel'
import CatalogSection from '@/components/landing/CatalogSection'
import MaterialsSection from '@/components/landing/MaterialsSection'
import ProcessSection from '@/components/landing/ProcessSection'
import ContactSection from '@/components/landing/ContactSection'
import Footer from '@/components/landing/Footer'
import AiAssistant from '@/components/AiAssistant'

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <ProductCarousel />
      <CatalogSection />
      <MaterialsSection />
      <ProcessSection />
      <ContactSection />
      <Footer />
      <AiAssistant />
    </main>
  )
}
