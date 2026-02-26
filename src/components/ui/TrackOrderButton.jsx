import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { subscribeToOrder } from '../../lib/firestore'
import './TrackOrderButton.css'

const STORAGE_KEY = 'cheesy-heaven-active-order'
const POS_KEY = 'cheesy-heaven-track-btn-pos'
const EVENT_NAME = 'activeOrderChanged'

export function setActiveOrder(orderId) {
  localStorage.setItem(STORAGE_KEY, orderId)
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function clearActiveOrder() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(EVENT_NAME))
}

function loadPosition() {
  try {
    const stored = localStorage.getItem(POS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

export default function TrackOrderButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const [orderId, setOrderId] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [dismissed, setDismissed] = useState(false)

  const btnRef = useRef(null)
  const dragging = useRef(false)
  const dragMoved = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState(() => loadPosition())

  // Listen for order changes
  useEffect(() => {
    const sync = () => {
      const id = localStorage.getItem(STORAGE_KEY)
      setOrderId(id)
      if (id) setDismissed(false)
    }
    window.addEventListener(EVENT_NAME, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Subscribe to order status — auto-clear when delivered
  useEffect(() => {
    if (!orderId) return
    const unsubscribe = subscribeToOrder(orderId, (data) => {
      if (data && data.status === 'delivered') {
        clearActiveOrder()
        setOrderId(null)
      }
    })
    return () => unsubscribe()
  }, [orderId])

  // Clamp position within viewport
  const clamp = useCallback((x, y) => {
    const size = 72
    return {
      x: Math.max(0, Math.min(x, window.innerWidth - size)),
      y: Math.max(0, Math.min(y, window.innerHeight - size)),
    }
  }, [])

  // Drag handlers
  const onStart = useCallback((clientX, clientY) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    offset.current = { x: clientX - rect.left, y: clientY - rect.top }
    dragging.current = true
    dragMoved.current = false
  }, [])

  const onMove = useCallback((clientX, clientY) => {
    if (!dragging.current) return
    dragMoved.current = true
    const newPos = clamp(clientX - offset.current.x, clientY - offset.current.y)
    setPos(newPos)
  }, [clamp])

  const onEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    if (dragMoved.current) {
      setPos(prev => {
        if (prev) localStorage.setItem(POS_KEY, JSON.stringify(prev))
        return prev
      })
    }
  }, [])

  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e) => onMove(e.clientX, e.clientY)
    const handleMouseUp = () => onEnd()
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onMove, onEnd])

  // Touch events
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!dragging.current) return
      e.preventDefault()
      const t = e.touches[0]
      onMove(t.clientX, t.clientY)
    }
    const handleTouchEnd = () => onEnd()
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onMove, onEnd])

  if (!orderId || dismissed || location.pathname.startsWith('/order/')) return null

  const style = pos
    ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
    : {}

  return (
    <div
      ref={btnRef}
      className={`track-order-float ${pos ? 'track-order-positioned' : ''}`}
      style={style}
      onMouseDown={(e) => { e.preventDefault(); onStart(e.clientX, e.clientY) }}
      onTouchStart={(e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY) }}
      onClick={() => { if (!dragMoved.current) navigate(`/order/${orderId}`) }}
      role="button"
      tabIndex={0}
      aria-label="Track your order"
    >
      <img className="track-order-icon" src="/images/delivery-rider.jpeg" alt="Track order" />
      <span className="pulse-dot" />
      <button
        className="track-order-dismiss"
        onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
