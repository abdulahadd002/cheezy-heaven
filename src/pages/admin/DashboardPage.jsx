import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, DollarSign, Users, TrendingUp, Loader } from 'lucide-react'
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
    return { todayOrders: todayOrders.length, todayRevenue, totalRevenue, activeOrders: activeOrders.length, total: orders.length }
  }, [orders])

  const recentOrders = orders.slice(0, 8)

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
