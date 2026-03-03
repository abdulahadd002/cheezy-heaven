import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, ArrowRight, Loader } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { getPromoCode } from '../lib/firestore'
import './CartPage.css'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQty, clearCart, subtotal, deliveryFee, tax, total } = useCart()
  const { addToast } = useToast()
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoLoading, setPromoLoading] = useState(false)

  // Clear stale promo from sessionStorage when returning to cart
  useEffect(() => {
    sessionStorage.removeItem('cheesy-promo-discount')
  }, [])

  const discountAmount = discount > 0 ? Math.round(subtotal * discount / 100) : 0
  const displayTotal = Math.max(0, total - discountAmount)

  const handleApplyPromo = async () => {
    if (promoApplied) { addToast('Promo code already applied', 'info'); return }
    if (!promoCode.trim()) { addToast('Enter a promo code', 'error'); return }
    setPromoLoading(true)
    try {
      const promo = await getPromoCode(promoCode.trim())
      if (promo) {
        if (promo.minOrder && subtotal < promo.minOrder) {
          addToast(`Minimum order PKR ${promo.minOrder.toLocaleString()} required`, 'error')
        } else {
          setDiscount(promo.discount)
          setPromoApplied(true)
          addToast(`Promo code applied! ${promo.discount}% off.`, 'success')
        }
      } else {
        addToast('Invalid or expired promo code', 'error')
      }
    } catch {
      addToast('Failed to validate promo code', 'error')
    }
    setPromoLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingCart size={64} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/menu" className="btn-primary">
              Browse Menu <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-image">
                  {item.image
                    ? <img src={item.image} alt={item.name} />
                    : <div style={{ width: '100%', height: '100%', background: '#2A1520', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍕</div>
                  }
                </div>
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  {item.description && (
                    <p className="cart-item-meta" style={{ marginBottom: 2 }}>{item.description}</p>
                  )}
                  <p className="cart-item-meta">
                    Size: {item.size}
                    {item.customizations?.length > 0 && ` | ${item.customizations.join(', ')}`}
                  </p>
                  <span className="cart-item-price">PKR {item.price.toLocaleString()} each</span>
                </div>
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.cartId, item.qty - 1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.cartId, item.qty + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-total">
                  PKR {(item.price * item.qty).toLocaleString()}
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => {
                    removeItem(item.cartId)
                    addToast(`${item.name} removed from cart`, 'info')
                  }}
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <div className="cart-actions">
              <Link to="/menu" className="btn-secondary">
                Continue Shopping
              </Link>
              <button
                className="btn-secondary"
                onClick={() => {
                  clearCart()
                  setDiscount(0)
                  setPromoApplied(false)
                  setPromoCode('')
                  addToast('Cart cleared', 'info')
                }}
              >
                Clear Cart
              </button>
            </div>
          </div>

          <aside className="order-summary">
            <h2>Order Summary</h2>

            <div className="order-summary-row">
              <span>Subtotal</span>
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

            {discountAmount > 0 && (
              <div className="order-summary-row">
                <span>Promo Discount ({discount}%)</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>- PKR {discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="order-summary-divider" />

            <div className="order-summary-total">
              <span>Total</span>
              <span>PKR {displayTotal.toLocaleString()}</span>
            </div>

            <div className="promo-input-row">
              <input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                aria-label="Promo code"
              />
              <button className="btn-secondary btn-sm" onClick={handleApplyPromo} disabled={promoLoading}>
                {promoLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Apply'}
              </button>
            </div>

            <button
              className="btn-primary btn-lg"
              onClick={() => navigate('/checkout', { state: { discount, discountAmount } })}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
