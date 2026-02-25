import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, ChefHat, Package, Truck, CircleCheckBig, Loader } from 'lucide-react'
import { subscribeToOrder } from '../lib/firestore'
import './OrderTrackingPage.css'

function formatTime(dateStr) {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000)
}

const STATUS_ORDER = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']

const STEP_META = [
  { label: 'Confirmed', icon: Check, estimateMin: 0 },
  { label: 'Preparing', icon: ChefHat, estimateMin: 3 },
  { label: 'Ready', icon: Package, estimateMin: 20 },
  { label: 'Out for Delivery', icon: Truck, estimateMin: 25 },
  { label: 'Delivered', icon: CircleCheckBig, estimateMin: 45 },
]

export default function OrderTrackingPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined) // undefined = loading

  // Real-time Firestore listener — auto-updates when admin changes status
  useEffect(() => {
    const unsubscribe = subscribeToOrder(id, (data) => {
      setOrder(data) // null if not found
    })
    return () => unsubscribe()
  }, [id])

  const placedTime = useMemo(() => {
    return order?.placedAt ? new Date(order.placedAt) : new Date()
  }, [order?.placedAt])

  // Build a map of status → real timestamp from statusHistory
  const historyMap = useMemo(() => {
    const map = {}
    if (order?.statusHistory) {
      order.statusHistory.forEach(entry => {
        map[entry.status] = entry.time
      })
    }
    return map
  }, [order?.statusHistory])

  // Build steps with real times (from history) or estimated times (for future steps)
  const steps = useMemo(() => STEP_META.map((meta, i) => {
    const statusKey = STATUS_ORDER[i]
    const realTime = historyMap[statusKey]
    return {
      ...meta,
      time: realTime ? formatTime(realTime) : formatTime(addMinutes(placedTime, meta.estimateMin)),
      hasRealTime: !!realTime,
    }
  }), [historyMap, placedTime])

  // Derive current step from order status
  const currentStep = order ? Math.max(STATUS_ORDER.indexOf(order.status), 0) : 0

  const progressWidth = `${(currentStep / (steps.length - 1)) * 100}%`

  const statusText = steps[currentStep]?.label || 'Confirmed'
  const statusClass = currentStep <= 1 ? 'preparing'
    : currentStep <= 3 ? 'delivering'
    : 'delivered'

  // Estimated delivery: use real "out for delivery" time if available, otherwise estimate
  const deliveryBase = historyMap.out_for_delivery
    ? new Date(historyMap.out_for_delivery)
    : addMinutes(placedTime, 25)
  const estimatedDelivery = currentStep >= 4
    ? `Delivered at ${formatTime(historyMap.delivered || new Date())}`
    : `${formatTime(addMinutes(deliveryBase, 10))} - ${formatTime(addMinutes(deliveryBase, 25))}`

  const statusMessage = currentStep === 0 ? 'Your order has been confirmed!'
    : currentStep === 1 ? 'Our chefs are preparing your food'
    : currentStep === 2 ? 'Your order is ready for pickup'
    : currentStep === 3 ? 'Your order is on its way!'
    : 'Your order has been delivered!'

  // Loading state
  if (order === undefined) {
    return (
      <div className="tracking-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="tracking-page">
        <div className="container">
          <div className="tracking-not-found">
            <h2>Order Not Found</h2>
            <p>We couldn't find order #{id}. It may have expired or the ID is incorrect.</p>
            <Link to="/menu" className="btn-primary">Browse Menu</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tracking-page">
      <div className="container">
        <div className="tracking-header">
          <div>
            <h1>Order Tracking</h1>
            <p className="tracking-order-id">
              Order ID: <span>#{id}</span>
            </p>
          </div>
          <span className={`tracking-status-badge ${statusClass}`}>
            {statusText}
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="tracking-progress">
          <div className="progress-steps">
            <div className="progress-line" style={{ width: progressWidth }} />
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`progress-step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
              >
                <div className="progress-step-icon">
                  {index < currentStep ? <Check size={18} /> : <step.icon size={18} />}
                </div>
                <div>
                  <div className="progress-step-label">{step.label}</div>
                  {index <= currentStep && (
                    <div className="progress-step-time">
                      {step.time}
                      {!step.hasRealTime && index > 0 && index === currentStep && (
                        <span style={{ fontSize: 10, color: 'var(--color-gray-2)', marginLeft: 4 }}>(est.)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="tracking-info-grid">
          <div className="tracking-info-card">
            <h3>{currentStep >= 4 ? 'Delivery Time' : 'Estimated Delivery'}</h3>
            <div className="tracking-info-value">{estimatedDelivery}</div>
            <p className="tracking-info-sub">{statusMessage}</p>
          </div>

          <div className="tracking-info-card">
            <h3>Delivery Details</h3>
            <div className="tracking-delivery-details">
              <p><strong>Address:</strong> {order.address}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Payment:</strong> {order.payment}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="tracking-order-details">
          <h3>Order Details</h3>
          <div className="review-items">
            {order.items.map((item, i) => (
              <div key={i} className="review-item">
                <div>
                  <div className="review-item-name">{item.qty}x {item.name}</div>
                  <div className="review-item-meta">
                    Size: {item.size}
                    {item.customizations?.length > 0 && ` | ${item.customizations.join(', ')}`}
                  </div>
                </div>
                <div className="review-item-price">
                  PKR {(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary-divider" />
          <div className="order-summary-row">
            <span>Subtotal</span>
            <span>PKR {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="order-summary-row">
            <span>Delivery</span>
            <span style={{ color: '#4CAF50', fontWeight: 600 }}>FREE</span>
          </div>
          <div className="order-summary-row">
            <span>Tax (16% GST)</span>
            <span>PKR {order.tax.toLocaleString()}</span>
          </div>
          <div className="order-summary-divider" />
          <div className="order-summary-total">
            <span>Total</span>
            <span>PKR {order.total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-48)' }}>
          <Link to="/menu" className="btn-secondary">Order More</Link>
        </div>
      </div>
    </div>
  )
}
