import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, ChefHat, Package, Truck, CircleCheckBig, Phone } from 'lucide-react'
import './OrderTrackingPage.css'

const ORDER_STEPS = [
  { label: 'Confirmed', icon: Check, time: '11:15 PM' },
  { label: 'Preparing', icon: ChefHat, time: '11:18 PM' },
  { label: 'Ready', icon: Package, time: '11:35 PM' },
  { label: 'Out for Delivery', icon: Truck, time: '11:40 PM' },
  { label: 'Delivered', icon: CircleCheckBig, time: '' },
]

export default function OrderTrackingPage() {
  const { id } = useParams()
  const [currentStep, setCurrentStep] = useState(1)

  // Simulate order progress
  useEffect(() => {
    if (currentStep < 3) {
      const timer = setTimeout(() => {
        setCurrentStep(s => s + 1)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const progressWidth = `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`

  const statusText = currentStep === 0 ? 'Confirmed'
    : currentStep === 1 ? 'Preparing'
    : currentStep === 2 ? 'Ready'
    : currentStep === 3 ? 'Out for Delivery'
    : 'Delivered'

  const statusClass = currentStep <= 1 ? 'preparing'
    : currentStep <= 3 ? 'delivering'
    : 'delivered'

  return (
    <div className="tracking-page">
      <div className="container">
        <div className="tracking-header">
          <div>
            <h1>Order Tracking</h1>
            <p className="tracking-order-id">
              Order ID: <span>#{id || '12345'}</span>
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
            {ORDER_STEPS.map((step, index) => (
              <div
                key={step.label}
                className={`progress-step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
              >
                <div className="progress-step-icon">
                  {index < currentStep ? <Check size={18} /> : <step.icon size={18} />}
                </div>
                <div>
                  <div className="progress-step-label">{step.label}</div>
                  {step.time && index <= currentStep && (
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
            <div className="tracking-info-value">11:45 PM - 12:00 AM</div>
            <p className="tracking-info-sub">Your order is on its way!</p>
          </div>

          <div className="tracking-info-card">
            <h3>Delivery Driver</h3>
            <div className="driver-info">
              <div className="driver-avatar">AK</div>
              <div>
                <div className="driver-name">Ali Khan</div>
                <div className="driver-rating">Bike Rider &middot; 4.8 ★</div>
              </div>
            </div>
            <button
              className="btn-secondary btn-sm"
              style={{ marginTop: 'var(--space-16)', width: '100%' }}
            >
              <Phone size={14} /> Contact Driver
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div className="tracking-order-details">
          <h3>Order Details</h3>
          <div className="review-items">
            <div className="review-item">
              <div>
                <div className="review-item-name">1x Cheese Volcano</div>
                <div className="review-item-meta">Large | Extra Cheese Layer</div>
              </div>
              <div className="review-item-price">PKR 2,124</div>
            </div>
            <div className="review-item">
              <div>
                <div className="review-item-name">1x Buffalo Wings (8 pcs)</div>
                <div className="review-item-meta">Extra Spicy</div>
              </div>
              <div className="review-item-price">PKR 699</div>
            </div>
            <div className="review-item">
              <div>
                <div className="review-item-name">1x Coca-Cola</div>
                <div className="review-item-meta">1.5L</div>
              </div>
              <div className="review-item-price">PKR 299</div>
            </div>
          </div>

          <div className="order-summary-divider" />
          <div className="order-summary-row">
            <span>Subtotal</span>
            <span>PKR 3,122</span>
          </div>
          <div className="order-summary-row">
            <span>Delivery</span>
            <span>PKR 200</span>
          </div>
          <div className="order-summary-row">
            <span>Tax</span>
            <span>PKR 500</span>
          </div>
          <div className="order-summary-divider" />
          <div className="order-summary-total">
            <span>Total</span>
            <span>PKR 3,822</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-48)' }}>
          <Link to="/menu" className="btn-secondary">Order More</Link>
        </div>
      </div>
    </div>
  )
}
