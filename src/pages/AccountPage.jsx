import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Package, Heart, MapPin, Settings, LogOut, Trash2, Edit3 } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import products from '../data/products.json'
import './AccountPage.css'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const MOCK_ORDERS = [
  { id: '54321', date: '2026-02-22', items: '2x Cheese Volcano, 1x Buffalo Wings', total: 3822, status: 'delivered' },
  { id: '54290', date: '2026-02-18', items: '1x Pepperoni Feast, 1x Oreo Milkshake', total: 2148, status: 'delivered' },
  { id: '54150', date: '2026-02-10', items: '1x Family Feast Deal', total: 2999, status: 'delivered' },
]

export default function AccountPage() {
  const { user, isLoggedIn, login, signup, logout, updateProfile, removeAddress } = useAuth()
  const { favorites } = useFavorites()
  const { addToast } = useToast()

  const [tab, setTab] = useState('profile')
  const [authMode, setAuthMode] = useState('login')

  // Auth form state
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })

  const handleLogin = (e) => {
    e.preventDefault()
    const result = login(authForm.email, authForm.password)
    if (result.success) {
      addToast('Welcome back!', 'success')
    } else {
      addToast(result.error, 'error')
    }
  }

  const handleSignup = (e) => {
    e.preventDefault()
    const result = signup(authForm.name, authForm.email, authForm.phone, authForm.password)
    if (result.success) {
      addToast('Account created successfully!', 'success')
    } else {
      addToast(result.error, 'error')
    }
  }

  // Not logged in - show auth form
  if (!isLoggedIn) {
    return (
      <div className="account-page">
        <div className="container">
          <div className="auth-container">
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Sign in to access your orders and favorites'
                : 'Join Cheesy Heaven for exclusive deals'}
            </p>

            <form
              className="auth-form"
              onSubmit={authMode === 'login' ? handleLogin : handleSignup}
            >
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Your name"
                    value={authForm.name}
                    onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={authForm.email}
                  onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+92 300 1234567"
                    value={authForm.phone}
                    onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={authForm.password}
                  onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              {authMode === 'login' && (
                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--color-gray-2)' }}>
                  Demo: ali@example.com / password123
                </p>
              )}
            </form>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <>Don&apos;t have an account? <button onClick={() => setAuthMode('signup')}>Sign Up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setAuthMode('login')}>Sign In</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const favoriteProducts = products.filter(p => favorites.includes(p.id))

  return (
    <div className="account-page">
      <div className="container">
        <h1>My Account</h1>

        <div className="account-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`account-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="profile-name">{user.name}</div>
                <div className="profile-email">{user.email}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" defaultValue={user.name} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" defaultValue={user.email} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" defaultValue={user.phone} />
            </div>

            <button
              className="btn-primary"
              onClick={() => addToast('Profile updated!', 'success')}
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            <div className="order-history-list">
              {MOCK_ORDERS.map(order => (
                <div key={order.id} className="order-history-card">
                  <div>
                    <div className="order-history-id">Order #{order.id}</div>
                    <div className="order-history-date">{order.date}</div>
                    <div className="order-history-items">{order.items}</div>
                  </div>
                  <div className="order-history-right">
                    <div className="order-history-total">PKR {order.total.toLocaleString()}</div>
                    <span className={`order-history-status status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link to={`/order/${order.id}`} className="btn-secondary btn-sm">Track</Link>
                      <button className="btn-primary btn-sm">Reorder</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {tab === 'favorites' && (
          <div>
            {favoriteProducts.length > 0 ? (
              <div className="favorites-grid">
                {favoriteProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="tab-empty">
                <Heart size={48} style={{ color: 'var(--color-gray-2)', marginBottom: 16 }} />
                <h3>No favorites yet</h3>
                <p>Heart items from the menu to save them here.</p>
                <Link to="/menu" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                  Browse Menu
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <div className="addresses-list">
            {user.addresses?.map(addr => (
              <div key={addr.id} className="address-manage-card">
                <div>
                  <div className="address-manage-label">
                    {addr.label}
                    {addr.isDefault && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-orange)' }}>DEFAULT</span>
                    )}
                  </div>
                  <div className="address-manage-text">{addr.address}</div>
                </div>
                <div className="address-manage-actions">
                  <button className="btn-icon"><Edit3 size={16} /></button>
                  <button
                    className="btn-icon"
                    style={{ color: '#EF4444' }}
                    onClick={() => {
                      removeAddress(addr.id)
                      addToast('Address removed', 'info')
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              + Add New Address
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="settings-section">
            <div className="settings-item">
              <div>
                <div className="settings-item-label">Email Notifications</div>
                <div className="settings-item-desc">Receive order updates and offers via email</div>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-orange)' }} />
            </div>
            <div className="settings-item">
              <div>
                <div className="settings-item-label">SMS Notifications</div>
                <div className="settings-item-desc">Receive order updates via SMS</div>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-orange)' }} />
            </div>
            <div className="settings-item">
              <div>
                <div className="settings-item-label">Language</div>
                <div className="settings-item-desc">Choose your preferred language</div>
              </div>
              <select className="form-select" style={{ width: 'auto', minWidth: 120 }}>
                <option>English</option>
                <option>Urdu</option>
              </select>
            </div>

            <button
              className="btn-secondary"
              style={{ marginTop: 'var(--space-32)', borderColor: '#EF4444', color: '#EF4444' }}
              onClick={() => {
                logout()
                addToast('Logged out successfully', 'info')
              }}
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
