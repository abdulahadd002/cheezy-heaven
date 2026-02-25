import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader, Filter } from 'lucide-react'
import { subscribeToAllOrders, updateOrderStatus } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

const STATUS_ORDER = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

const FILTERS = ['all', ...STATUS_ORDER]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { addToast } = useToast()

  useEffect(() => {
    const unsub = subscribeToAllOrders((data) => {
      setOrders(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter(o => o.status === filter)
  }, [orders, filter])

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Change order #${orderId} status to "${STATUS_LABELS[newStatus]}"?`)) return
    try {
      await updateOrderStatus(orderId, newStatus)
      addToast(`Order #${orderId} updated to ${STATUS_LABELS[newStatus]}`, 'success')
    } catch {
      addToast('Failed to update status', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Orders</h1>
        <p>Manage and track all orders in real-time</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`admin-btn ${filter === f ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${orders.length})` : `${STATUS_LABELS[f]} (${orders.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="admin-table-wrapper">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            <h3>No orders found</h3>
            <p>{filter === 'all' ? 'No orders yet.' : `No ${STATUS_LABELS[filter]?.toLowerCase()} orders.`}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/admin/orders/${order.id}`} style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
                      #{order.id}
                    </Link>
                  </td>
                  <td>{order.userName || 'Guest'}</td>
                  <td style={{ fontSize: 13 }}>{order.phone || '—'}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight: 600 }}>PKR {(order.total || 0).toLocaleString()}</td>
                  <td style={{ fontSize: 13 }}>{order.payment || 'COD'}</td>
                  <td>
                    <select
                      className="status-select"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {STATUS_ORDER.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>
                    {order.placedAt ? new Date(order.placedAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                    }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
