import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'
import Toast from '../ui/Toast'
import TrackOrderButton from '../ui/TrackOrderButton'
import WhatsAppButton from '../ui/WhatsAppButton'
import OfflineBanner from '../ui/OfflineBanner'
import UpdatePrompt from '../ui/UpdatePrompt'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function Layout() {
  return (
    <>
      <OfflineBanner />
      <ScrollToTop />
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <TrackOrderButton />
      <WhatsAppButton />
      <Toast />
      <UpdatePrompt />
    </>
  )
}
