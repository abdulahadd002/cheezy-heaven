import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader, ChevronRight, CalendarDays, X, Trash2, Bell } from 'lucide-react'
import { subscribeToAllOrders, updateOrderStatus, deleteOrder } from '../../lib/firestore'
import { useToast } from '../../context/ToastContext'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

const STATUS_ORDER = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}
const NEXT_ACTION_LABELS = {
  confirmed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Send Out',
  out_for_delivery: 'Mark Delivered',
}

const FILTERS = ['all', ...STATUS_ORDER]

function getDateLabel(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const orderDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (today - orderDay) / 86400000
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function groupByDate(orders) {
  const groups = []
  const map = {}
  orders.forEach(o => {
    const label = o.placedAt ? getDateLabel(o.placedAt) : 'Unknown'
    if (!map[label]) {
      map[label] = { label, orders: [] }
      groups.push(map[label])
    }
    map[label].orders.push(o)
  })
  return groups
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('') // yyyy-mm-dd or empty for all
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const dateRef = useRef(null)
  const prevCountRef = useRef(null)
  const notifyRef = useRef(false)
  const { addToast } = useToast()
  const [advancingId, setAdvancingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const enableNotifications = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifyEnabled(p === 'granted'))
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotifyEnabled(true)
    }
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifyEnabled(true)
      notifyRef.current = true
    }
  }, [])

  // Keep ref in sync with state so the subscription callback reads the latest value
  useEffect(() => { notifyRef.current = notifyEnabled }, [notifyEnabled])

  useEffect(() => {
    const unsub = subscribeToAllOrders((data) => {
      if (prevCountRef.current !== null && data.length > prevCountRef.current) {
        const diff = data.length - prevCountRef.current
        playNotificationSound()
        addToast(`${diff} new order${diff > 1 ? 's' : ''} received!`, 'success')
        if (notifyRef.current) {
          try { new Notification('New Order!', { body: `${diff} new order${diff > 1 ? 's' : ''} received`, icon: '/favicon.jpeg' }) } catch {}
        }
      }
      prevCountRef.current = data.length
      setOrders(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    let list = orders
    if (filter !== 'all') list = list.filter(o => o.status === filter)
    if (dateFilter) {
      list = list.filter(o => {
        if (!o.placedAt) return false
        const d = new Date(o.placedAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return key === dateFilter
      })
    }
    return list
  }, [orders, filter, dateFilter])

  const handleStatusChange = async (orderId, newStatus) => {
    setAdvancingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      addToast(`Order #${orderId} updated to ${STATUS_LABELS[newStatus]}`, 'success')
    } catch {
      addToast('Failed to update status', 'error')
    }
    setAdvancingId(null)
  }

  const handleDelete = async (orderId) => {
    if (!window.confirm(`Delete order #${orderId}? This cannot be undone.`)) return
    setDeletingId(orderId)
    try {
      await deleteOrder(orderId)
      addToast(`Order #${orderId} deleted`, 'success')
    } catch {
      addToast('Failed to delete order', 'error')
    }
    setDeletingId(null)
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
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Orders</h1>
          <p>Manage and track all orders in real-time</p>
        </div>
        {!notifyEnabled && 'Notification' in window && Notification.permission !== 'denied' && (
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={enableNotifications}>
            <Bell size={14} /> Enable Notifications
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`admin-btn ${filter === f ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${orders.length})` : `${STATUS_LABELS[f]} (${orders.filter(o => o.status === f).length})`}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex' }}>
            <input
              ref={dateRef}
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
                opacity: 0, pointerEvents: 'none',
              }}
            />
            <span
              className={`admin-btn admin-btn-sm ${dateFilter ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => dateRef.current?.showPicker()}
            >
              <CalendarDays size={14} />
              {dateFilter
                ? new Date(dateFilter + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Pick Date'}
            </span>
          </label>
          {dateFilter && (
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => setDateFilter('')}
              title="Clear date filter"
              style={{ padding: '5px 6px' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-table-wrapper">
          <div className="admin-empty">
            <h3>No orders found</h3>
            <p>{filter === 'all' ? 'No orders yet.' : `No ${STATUS_LABELS[filter]?.toLowerCase()} orders.`}</p>
          </div>
        </div>
      ) : (
        groupByDate(filtered).map(group => (
          <div key={group.label} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-white)' }}>{group.label}</h2>
              <span style={{ fontSize: 12, color: 'var(--color-gray-2)', fontWeight: 600 }}>
                {group.orders.length} {group.orders.length === 1 ? 'order' : 'orders'}
              </span>
            </div>
            <div className="admin-table-wrapper">
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {group.orders.map(order => (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`status-badge status-${order.status}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                          {order.status !== 'delivered' && (
                            <button
                              className="next-status-pill"
                              onClick={() => handleStatusChange(order.id, STATUS_ORDER[STATUS_ORDER.indexOf(order.status) + 1])}
                              disabled={advancingId === order.id}
                            >
                              {advancingId === order.id ? 'Updating...' : NEXT_ACTION_LABELS[order.status]} {advancingId !== order.id && <ChevronRight size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>
                        {order.placedAt ? new Date(order.placedAt).toLocaleString('en-US', {
                          hour: 'numeric', minute: '2-digit', hour12: true
                        }) : '—'}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDelete(order.id)}
                          disabled={deletingId === order.id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
