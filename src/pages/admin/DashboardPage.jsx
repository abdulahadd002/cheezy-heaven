import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader, TrendingUp, ShoppingBag, Star } from 'lucide-react'
import { subscribeToAllOrders } from '../../lib/firestore'

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

export default function DashboardPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToAllOrders((data) => {
      setOrders(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayOrders = orders.filter(o => o.placedAt?.slice(0, 10) === today)
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

    // Weekly revenue (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = weekAgo.toISOString()
    const weekRevenue = orders.filter(o => (o.placedAt || '') >= weekStr).reduce((sum, o) => sum + (o.total || 0), 0)

    // Orders by status
    const byStatus = {}
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })

    // Top 5 selling items
    const itemCounts = {}
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty
      })
    })
    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return {
      todayOrders: todayOrders.length, todayRevenue, totalRevenue,
      activeOrders: activeOrders.length, total: orders.length,
      avgOrder, weekRevenue, byStatus, topItems,
    }
  }, [orders])

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders])

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
        <h1>Dashboard</h1>
        <p>Overview of your restaurant</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <h3>Today's Orders</h3>
          <div className="admin-stat-value">{stats.todayOrders}</div>
        </div>
        <div className="admin-stat-card">
          <h3>Today's Revenue</h3>
          <div className="admin-stat-value">PKR {stats.todayRevenue.toLocaleString()}</div>
        </div>
        <div className="admin-stat-card">
          <h3>Active Orders</h3>
          <div className="admin-stat-value">{stats.activeOrders}</div>
          <div className="admin-stat-sub">Need attention</div>
        </div>
        <div className="admin-stat-card">
          <h3>Total Revenue</h3>
          <div className="admin-stat-value">PKR {stats.totalRevenue.toLocaleString()}</div>
          <div className="admin-stat-sub">{stats.total} total orders</div>
        </div>
        <div className="admin-stat-card">
          <h3>This Week</h3>
          <div className="admin-stat-value">PKR {stats.weekRevenue.toLocaleString()}</div>
          <div className="admin-stat-sub">Last 7 days</div>
        </div>
        <div className="admin-stat-card">
          <h3>Avg. Order</h3>
          <div className="admin-stat-value">PKR {stats.avgOrder.toLocaleString()}</div>
          <div className="admin-stat-sub">Per order</div>
        </div>
      </div>

      {/* Top Items & Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="admin-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-white)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={16} style={{ color: 'var(--color-orange)' }} /> Top Selling Items
          </h3>
          {stats.topItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topItems.map(([name, count], i) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'var(--color-orange)' : 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? '#fff' : 'var(--color-gray-1)' }}>{i + 1}</span>
                    <span style={{ fontSize: 14, color: 'var(--color-white)' }}>{name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-1)' }}>{count} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-gray-2)' }}>No data yet</p>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-white)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={16} style={{ color: 'var(--color-orange)' }} /> Orders by Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = stats.byStatus[key] || 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-gray-1)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-white)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border)' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'var(--color-orange)', width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Recent Orders</h2>
          <Link to="/admin/orders" className="admin-btn admin-btn-secondary admin-btn-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="admin-empty">
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/admin/orders/${order.id}`} style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
                      #{order.id}
                    </Link>
                  </td>
                  <td>{order.userName || 'Guest'}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight: 600 }}>PKR {(order.total || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
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
