import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Loader } from 'lucide-react'
import { subscribeToOrder, updateOrderStatus } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

const STATUS_ORDER = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined)
  const { addToast } = useToast()

  useEffect(() => {
    const unsub = subscribeToOrder(id, setOrder)
    return () => unsub()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      await updateOrderStatus(id, newStatus)
      addToast(`Status updated to ${STATUS_LABELS[newStatus]}`, 'success')
    } catch {
      addToast('Failed to update status', 'error')
    }
  }

  const currentIdx = order ? STATUS_ORDER.indexOf(order.status) : -1
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIdx + 1] : null

  if (order === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="admin-empty">
        <h3>Order not found</h3>
        <p>Order #{id} doesn't exist.</p>
        <Link to="/admin/orders" className="admin-btn admin-btn-primary" style={{ marginTop: 16 }}>
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-gray-1)', fontSize: 14, marginBottom: 16, textDecoration: 'none' }}>
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-white)' }}>Order #{id}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-gray-2)', marginTop: 4 }}>
            Placed {order.placedAt ? new Date(order.placedAt).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            }) : '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`status-badge status-${order.status}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
          {nextStatus && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => handleStatusChange(nextStatus)}
            >
              Mark as {STATUS_LABELS[nextStatus]}
            </button>
          )}
        </div>
      </div>

      <div className="admin-order-detail">
        <div>
          {/* Items */}
          <div className="admin-card">
            <h3>Order Items ({order.items?.length || 0})</h3>
            <div className="admin-order-items">
              {order.items?.map((item, i) => (
                <div key={i} className="admin-order-item">
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-white)' }}>
                      {item.qty}x {item.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-gray-2)', marginTop: 2 }}>
                      Size: {item.size}
                      {item.customizations?.length > 0 && ` | ${item.customizations.join(', ')}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-white)' }}>
                    PKR {(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          <div className="admin-card">
            <h3>Status Timeline</h3>
            {order.statusHistory?.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: i < order.statusHistory.length - 1 ? '1px solid #1F1528' : 'none' }}>
                <span className={`status-badge status-${entry.status}`}>
                  {STATUS_LABELS[entry.status] || entry.status}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>
                  {new Date(entry.time).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="admin-card">
            <h3>Customer</h3>
            <div style={{ fontSize: 14, color: 'var(--color-gray-1)', lineHeight: 2 }}>
              <p><strong style={{ color: 'var(--color-white)' }}>Name:</strong> {order.userName || 'Guest'}</p>
              <p><strong style={{ color: 'var(--color-white)' }}>Phone:</strong> {order.phone || '—'}</p>
              <p><strong style={{ color: 'var(--color-white)' }}>Address:</strong> {order.address || '—'}</p>
            </div>
          </div>

          <div className="admin-card">
            <h3>Payment</h3>
            <div style={{ fontSize: 14, color: 'var(--color-gray-1)', lineHeight: 2 }}>
              <p><strong style={{ color: 'var(--color-white)' }}>Method:</strong> {order.payment || 'Cash on Delivery'}</p>
              <div style={{ borderTop: '1px solid #1F1528', marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Subtotal</span>
                  <span>PKR {(order.subtotal || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Tax</span>
                  <span>PKR {(order.tax || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Delivery</span>
                  <span style={{ color: '#4CAF50' }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-white)', borderTop: '1px solid #1F1528', paddingTop: 8, marginTop: 8, fontSize: 16 }}>
                  <span>Total</span>
                  <span>PKR {(order.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
