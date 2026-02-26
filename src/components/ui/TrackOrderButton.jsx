import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package } from 'lucide-react'
import { subscribeToOrder } from '../../lib/firestore'
import './TrackOrderButton.css'

const STORAGE_KEY = 'cheesy-heaven-active-order'

export function setActiveOrder(orderId) {
  localStorage.setItem(STORAGE_KEY, orderId)
}

export function clearActiveOrder() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function TrackOrderButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const [orderId, setOrderId] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [dismissed, setDismissed] = useState(false)

  // Listen to localStorage changes (in case order placed in same tab)
  useEffect(() => {
    const check = () => setOrderId(localStorage.getItem(STORAGE_KEY))
    window.addEventListener('storage', check)
    const interval = setInterval(check, 1000)
    return () => { window.removeEventListener('storage', check); clearInterval(interval) }
  }, [])

  // Subscribe to order status — auto-clear when delivered
  useEffect(() => {
    if (!orderId) return
    const unsubscribe = subscribeToOrder(orderId, (data) => {
      if (!data || data.status === 'delivered') {
        clearActiveOrder()
        setOrderId(null)
      }
    })
    return () => unsubscribe()
  }, [orderId])

  // Don't show if no order, dismissed, or already on tracking page
  if (!orderId || dismissed || location.pathname.startsWith('/order/')) return null

  return (
    <button
      className="track-order-float"
      onClick={() => navigate(`/order/${orderId}`)}
      aria-label="Track your order"
    >
      <span className="pulse-dot" />
      <Package size={16} />
      Track Order
      <button
        className="track-order-dismiss"
        onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </button>
  )
}
