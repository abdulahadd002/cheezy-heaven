import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Phone, CreditCard, ClipboardCheck, ChevronLeft, ChevronRight, Check, Banknote, Smartphone, Wallet } from 'lucide-react'
import StepIndicator from '../components/ui/StepIndicator'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './CheckoutPage.css'

const STEPS = ['Address', 'Payment', 'Review']

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: Banknote },
  { id: 'jazzcash', name: 'JazzCash', desc: 'Pay via JazzCash mobile wallet', icon: Smartphone },
  { id: 'easypaisa', name: 'EasyPaisa', desc: 'Pay via EasyPaisa mobile wallet', icon: Wallet },
  { id: 'card', name: 'Credit/Debit Card', desc: 'Visa, Mastercard accepted', icon: CreditCard },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const { addToast } = useToast()

  const [step, setStep] = useState(0)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const [selectedAddress, setSelectedAddress] = useState(0)
  const [newAddress, setNewAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const addresses = isLoggedIn && user?.addresses?.length > 0
    ? user.addresses
    : [{ id: 1, label: 'Home', address: '123 Main Street, DHA Phase 5, Karachi' }]

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Add items to your cart before checkout.</p>
            <Link to="/menu" className="btn-primary">Browse Menu</Link>
          </div>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-success">
            <div className="checkout-success-icon">
              <Check size={40} />
            </div>
            <h2>Order Placed Successfully!</h2>
            <p>Your delicious food is being prepared.</p>
            <div className="order-number">Order #{orderId}</div>
            <br /><br />
            <div style={{ display: 'flex', gap: 'var(--space-16)', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => navigate(`/order/${orderId}`)}>
                Track Order
              </button>
              <Link to="/menu" className="btn-secondary">Order More</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handlePlaceOrder = () => {
    const id = Math.floor(10000 + Math.random() * 90000).toString()
    setOrderId(id)
    setOrderPlaced(true)
    clearCart()
    addToast('Order placed successfully!', 'success')
  }

  const finalTotal = subtotal + tax

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <StepIndicator steps={STEPS} currentStep={step} />

        <div className="checkout-layout">
          <div className="checkout-step-content">
            {/* Step 0: Address */}
            {step === 0 && (
              <>
                <h2>Delivery Address</h2>
                <div className="address-cards">
                  {addresses.map((addr, i) => (
                    <div
                      key={addr.id}
                      className={`address-card ${selectedAddress === i ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(i)}
                    >
                      <div className="address-card-radio" />
                      <div className="address-card-info">
                        <div className="address-card-label">{addr.label}</div>
                        <div className="address-card-text">{addr.address}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Or enter a new address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full delivery address"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div className="phone-input-wrapper">
                    <Phone size={18} className="phone-input-icon" />
                    <input
                      type="tel"
                      className="form-input phone-input"
                      placeholder="03XX-XXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <span className="form-hint">We'll contact you for delivery updates</span>
                </div>
              </>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <>
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      className={`payment-method ${paymentMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="payment-method-icon">
                        <method.icon size={20} />
                      </div>
                      <div>
                        <div className="payment-method-name">{method.name}</div>
                        <div className="payment-method-desc">{method.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <>
                <h2>Review Your Order</h2>
                <div className="review-items">
                  {items.map(item => (
                    <div key={item.cartId} className="review-item">
                      <div>
                        <div className="review-item-name">
                          {item.qty}x {item.name}
                        </div>
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

                <div style={{ fontSize: '14px', color: 'var(--color-gray-1)', marginBottom: 'var(--space-16)' }}>
                  <p><strong style={{ color: 'var(--color-white)' }}>Address:</strong> {newAddress || addresses[selectedAddress]?.address}</p>
                  <p><strong style={{ color: 'var(--color-white)' }}>Phone:</strong> {phone || 'Not provided'}</p>
                  <p><strong style={{ color: 'var(--color-white)' }}>Delivery:</strong> Free Delivery</p>
                  <p><strong style={{ color: 'var(--color-white)' }}>Payment:</strong> {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}</p>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="checkout-nav">
              {step > 0 ? (
                <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <Link to="/cart" className="btn-secondary">
                  <ChevronLeft size={16} /> Back to Cart
                </Link>
              )}

              {step < 2 ? (
                <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn-primary btn-lg" onClick={handlePlaceOrder}>
                  Place Order - PKR {finalTotal.toLocaleString()}
                </button>
              )}
            </div>
          </div>

          <aside className="order-summary">
            <h2>Order Summary</h2>
            <div className="order-summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="order-summary-row">
              <span>Delivery Fee</span>
              <span style={{ color: '#4CAF50', fontWeight: 600 }}>FREE</span>
            </div>
            <div className="order-summary-row">
              <span>Tax (16% GST)</span>
              <span>PKR {tax.toLocaleString()}</span>
            </div>
            <div className="order-summary-divider" />
            <div className="order-summary-total">
              <span>Total</span>
              <span>PKR {finalTotal.toLocaleString()}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
