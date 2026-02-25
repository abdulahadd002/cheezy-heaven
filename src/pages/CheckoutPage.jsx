import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { MapPin, Phone, ChevronLeft, ChevronRight, Check, Banknote, Wallet } from 'lucide-react'
import StepIndicator from '../components/ui/StepIndicator'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createOrder } from '../lib/firestore'
import './CheckoutPage.css'

const STEPS = ['Address', 'Payment', 'Review']

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: Banknote },
  { id: 'easypaisa', name: 'EasyPaisa', desc: 'Send payment to our EasyPaisa account', icon: Wallet },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCart()
  const { user } = useAuth()
  const { addToast } = useToast()

  const promoDiscountAmount = location.state?.discountAmount || 0

  const [step, setStep] = useState(0)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone)
  }, [user])

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

  const finalTotal = subtotal + tax - promoDiscountAmount

  const handlePlaceOrder = async () => {
    setPlacing(true)
    try {
      const id = `${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      await createOrder(id, {
        userId: user?.uid || 'guest',
        userName: user?.name || 'Guest',
        items: items.map(item => ({
          name: item.name,
          qty: item.qty,
          size: item.size,
          customizations: item.customizations,
          price: item.price,
        })),
        subtotal,
        tax,
        total: finalTotal,
        address,
        phone,
        payment: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name,
      })
      setOrderId(id)
      setOrderPlaced(true)
      clearCart()
      addToast('Order placed successfully!', 'success')
    } catch {
      addToast('Failed to place order. Please try again.', 'error')
    }
    setPlacing(false)
  }

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
                <h2>Delivery Details</h2>

                <div className="form-group">
                  <label className="form-label">Delivery Address <span className="required">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${errors.address ? 'form-input-error' : ''}`}
                    placeholder="Enter your full delivery address"
                    value={address}
                    onChange={e => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: '' })) }}
                  />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number <span className="required">*</span></label>
                  <div className="phone-input-wrapper">
                    <Phone size={18} className="phone-input-icon" />
                    <input
                      type="tel"
                      className={`form-input phone-input ${errors.phone ? 'form-input-error' : ''}`}
                      placeholder="03XX-XXXXXXX"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })) }}
                    />
                  </div>
                  {errors.phone ? <span className="form-error">{errors.phone}</span> : <span className="form-hint">We'll contact you for delivery updates</span>}
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

                {paymentMethod === 'easypaisa' && (
                  <div style={{
                    marginTop: 'var(--space-16)',
                    padding: 'var(--space-24)',
                    background: '#1F1018',
                    border: '1px solid #3F2230',
                    borderRadius: 12,
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-white)', marginBottom: 8, fontSize: 15 }}>
                      EasyPaisa Payment Instructions
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-gray-1)', lineHeight: 1.8 }}>
                      <p>Send <strong style={{ color: 'var(--color-orange)' }}>PKR {finalTotal.toLocaleString()}</strong> to:</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-white)', margin: '8px 0' }}>0312-8680974</p>
                      <p>Account: <strong style={{ color: 'var(--color-white)' }}>Afshan Majid</strong></p>
                      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-gray-2)' }}>
                        After sending, place your order. Our team will verify the payment and confirm your order.
                      </p>
                    </div>
                  </div>
                )}
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
                  <p><strong style={{ color: 'var(--color-white)' }}>Address:</strong> {address}</p>
                  <p><strong style={{ color: 'var(--color-white)' }}>Phone:</strong> {phone}</p>
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
                <button className="btn-primary" onClick={() => {
                  if (step === 0) {
                    const newErrors = {}
                    if (!address.trim()) newErrors.address = 'Delivery address is required'
                    if (!phone.trim()) {
                      newErrors.phone = 'Mobile number is required'
                    } else if (!/^(0\d{10}|\+92\d{10})$/.test(phone.trim())) {
                      newErrors.phone = 'Enter a valid Pakistani number (e.g., 03001234567)'
                    }
                    if (Object.keys(newErrors).length > 0) {
                      setErrors(newErrors)
                      return
                    }
                  }
                  setStep(s => s + 1)
                }}>
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn-primary btn-lg" onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'Placing Order...' : `Place Order - PKR ${finalTotal.toLocaleString()}`}
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
            {promoDiscountAmount > 0 && (
              <div className="order-summary-row">
                <span>Promo Discount</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>- PKR {promoDiscountAmount.toLocaleString()}</span>
              </div>
            )}
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
