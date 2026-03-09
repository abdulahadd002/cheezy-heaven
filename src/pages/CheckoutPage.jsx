import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { MapPin, Phone, ChevronLeft, ChevronRight, Check, Banknote, Wallet, Plus } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import StepIndicator from '../components/ui/StepIndicator'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createOrder } from '../lib/firestore'
import { setActiveOrder } from '../components/ui/TrackOrderButton'
import { canPlaceOrder } from '../lib/rateLimit'
import { validateAddress, validatePhone, validateOrderData, sanitizeOrderData, LIMITS } from '../lib/validate'
import './CheckoutPage.css'

const PROMO_SESSION_KEY = 'cheesy-promo-discount'

const STEPS = ['Address', 'Payment', 'Review']

function buildWhatsAppLink(orderId, items, total, address, phone, paymentMethod) {
  const itemLines = items.map(i =>
    `  ${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ''}`
  ).join('\n')
  const payment = paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'Cash on Delivery'
  const msg = `Hi! I just placed an order on Cheezy Heaven.\n\nOrder #${orderId.slice(0, 8)}\n\nItems:\n${itemLines}\n\nTotal: PKR ${total.toLocaleString()}\nAddress: ${address}\nPhone: ${phone}\nPayment: ${payment}\n\nPlease confirm!`
  return `https://wa.me/923495479437?text=${encodeURIComponent(msg)}`
}

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

  // Promo discount: read from navigation state, fall back to sessionStorage on refresh
  const stateDiscount = location.state?.discountAmount
  const promoDiscountAmount = stateDiscount != null
    ? stateDiscount
    : Number(sessionStorage.getItem(PROMO_SESSION_KEY) || 0)

  const [step, setStep] = useState(0)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const [address, setAddress] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [placedItems, setPlacedItems] = useState([])
  const [placedTotal, setPlacedTotal] = useState(0)
  const [easypaisaNumber, setEasypaisaNumber] = useState('')
  const [easypaisaName, setEasypaisaName] = useState('')

  // Save promo discount to sessionStorage so it survives a page refresh
  useEffect(() => {
    if (stateDiscount != null) {
      sessionStorage.setItem(PROMO_SESSION_KEY, stateDiscount)
    }
  }, [stateDiscount])

  // Load EasyPaisa details from admin settings
  useEffect(() => {
    getDoc(doc(db, 'settings', 'restaurant')).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.easypaisaNumber) setEasypaisaNumber(data.easypaisaNumber)
        if (data.easypaisaName) setEasypaisaName(data.easypaisaName)
      }
    }).catch(() => {})
  }, [])

  // Pre-fill phone from user profile and auto-select default address
  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone)
    if (user?.addresses?.length > 0 && !selectedAddressId && !address) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0]
      setSelectedAddressId(defaultAddr.id)
      setAddress(defaultAddr.address)
    }
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

            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 'var(--space-24)',
              margin: 'var(--space-24) auto',
              maxWidth: 400,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 14, color: 'var(--color-gray-1)', lineHeight: 1.8 }}>
                <p><strong style={{ color: 'var(--color-white)' }}>Delivery to:</strong> {address}</p>
                <p><strong style={{ color: 'var(--color-white)' }}>Phone:</strong> {phone}</p>
                <p><strong style={{ color: 'var(--color-white)' }}>Payment:</strong> {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}</p>
                <p><strong style={{ color: 'var(--color-white)' }}>Estimated time:</strong> 30-45 minutes</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={buildWhatsAppLink(orderId, placedItems, placedTotal, address, phone, paymentMethod)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ background: '#25D366', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Confirm via WhatsApp
              </a>
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

  const finalTotal = Math.max(0, subtotal + deliveryFee + tax - promoDiscountAmount)

  const handlePlaceOrder = async () => {
    if (placing) return

    // Rate limit: prevent rapid order spam
    const rateCheck = canPlaceOrder()
    if (!rateCheck.allowed) {
      const secs = Math.ceil(rateCheck.retryAfterMs / 1000)
      addToast(`Too many orders. Please wait ${secs}s before trying again.`, 'error')
      return
    }

    const orderData = {
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
      deliveryFee,
      tax,
      promoDiscount: promoDiscountAmount > 0 ? promoDiscountAmount : 0,
      total: finalTotal,
      address,
      phone,
      payment: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name,
    }

    // Validate order schema before sending to Firestore
    const validation = validateOrderData(orderData)
    if (!validation.valid) {
      addToast(validation.errors[0], 'error')
      return
    }

    // Sanitize all string fields
    const sanitized = sanitizeOrderData(orderData)

    setPlacing(true)
    try {
      const id = crypto.randomUUID()
      await createOrder(id, sanitized)
      setOrderId(id)
      setPlacedItems([...items])
      setPlacedTotal(finalTotal)
      setOrderPlaced(true)
      setActiveOrder(id)
      clearCart()
      sessionStorage.removeItem(PROMO_SESSION_KEY)
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

                  {user?.addresses?.length > 0 && (
                    <div className="address-cards">
                      {user.addresses.map(addr => (
                        <div
                          key={addr.id}
                          className={`address-card ${selectedAddressId === addr.id && !showNewAddress ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedAddressId(addr.id)
                            setAddress(addr.address)
                            setShowNewAddress(false)
                            setErrors(prev => ({ ...prev, address: '' }))
                          }}
                        >
                          <div className="address-card-radio" />
                          <div className="address-card-info">
                            <div className="address-card-label">{addr.label}</div>
                            <div className="address-card-text">{addr.address}</div>
                          </div>
                        </div>
                      ))}
                      <div
                        className={`address-card ${showNewAddress ? 'selected' : ''}`}
                        onClick={() => {
                          setShowNewAddress(true)
                          setSelectedAddressId(null)
                          setAddress('')
                          setErrors(prev => ({ ...prev, address: '' }))
                        }}
                      >
                        <div className="address-card-radio" />
                        <div className="address-card-info">
                          <div className="address-card-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={14} /> New Address
                          </div>
                          <div className="address-card-text">Enter a different delivery address</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(!user?.addresses?.length || showNewAddress) && (
                    <input
                      type="text"
                      className={`form-input ${errors.address ? 'form-input-error' : ''}`}
                      placeholder="Enter your full delivery address"
                      maxLength={LIMITS.address.max}
                      value={showNewAddress ? address : address}
                      onChange={e => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: '' })) }}
                    />
                  )}
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
                      maxLength={LIMITS.phone.max}
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
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-white)', margin: '8px 0' }}>{easypaisaNumber}</p>
                      <p>Account: <strong style={{ color: 'var(--color-white)' }}>{easypaisaName}</strong></p>
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
                  <p><strong style={{ color: 'var(--color-white)' }}>Delivery:</strong> {deliveryFee > 0 ? `PKR ${deliveryFee.toLocaleString()}` : 'Free Delivery'}</p>
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
                    const addrResult = validateAddress(address)
                    if (!addrResult.valid) newErrors.address = addrResult.error
                    const phoneResult = validatePhone(phone)
                    if (!phoneResult.valid) newErrors.phone = phoneResult.error
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
              {deliveryFee > 0
                ? <span>PKR {deliveryFee.toLocaleString()}</span>
                : <span style={{ color: '#4CAF50', fontWeight: 600 }}>FREE</span>}
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
