import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, ChefHat, Package, Truck, CircleCheckBig } from 'lucide-react'
import './OrderTrackingPage.css'

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000)
}

export default function OrderTrackingPage() {
  const { id } = useParams()
  const [currentStep, setCurrentStep] = useState(0)

  const order = useMemo(() => {
    try {
      const data = localStorage.getItem(`order_${id}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }, [id])

  const placedTime = useMemo(() => {
    return order?.placedAt ? new Date(order.placedAt) : new Date()
  }, [order])

  const steps = useMemo(() => [
    { label: 'Confirmed', icon: Check, time: formatTime(placedTime) },
    { label: 'Preparing', icon: ChefHat, time: formatTime(addMinutes(placedTime, 3)) },
    { label: 'Ready', icon: Package, time: formatTime(addMinutes(placedTime, 20)) },
    { label: 'Out for Delivery', icon: Truck, time: formatTime(addMinutes(placedTime, 25)) },
    { label: 'Delivered', icon: CircleCheckBig, time: formatTime(addMinutes(placedTime, 45)) },
  ], [placedTime])

  // Simulate order progress
  useEffect(() => {
    if (currentStep < 4) {
      const delays = [3000, 8000, 5000, 10000]
      const timer = setTimeout(() => {
        setCurrentStep(s => s + 1)
      }, delays[currentStep])
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const progressWidth = `${(currentStep / (steps.length - 1)) * 100}%`

  const statusText = steps[currentStep]?.label || 'Confirmed'
  const statusClass = currentStep <= 1 ? 'preparing'
    : currentStep <= 3 ? 'delivering'
    : 'delivered'

  const estimatedDelivery = `${formatTime(addMinutes(placedTime, 35))} - ${formatTime(addMinutes(placedTime, 50))}`

  const statusMessage = currentStep === 0 ? 'Your order has been confirmed!'
    : currentStep === 1 ? 'Our chefs are preparing your food'
    : currentStep === 2 ? 'Your order is ready for pickup'
    : currentStep === 3 ? 'Your order is on its way!'
    : 'Your order has been delivered!'

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
                    <div className="progress-step-time">{step.time}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="tracking-info-grid">
          <div className="tracking-info-card">
            <h3>Estimated Delivery</h3>
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
