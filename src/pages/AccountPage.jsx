import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Package, Heart, MapPin, Settings, LogOut, Trash2, Edit3, Loader } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import { useProducts } from '../hooks/useProducts'
import { getUserOrders } from '../lib/firestore'
import './AccountPage.css'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AccountPage() {
  const { user, isLoggedIn, loading, login, signup, logout, updateUserProfile, addAddress, removeAddress } = useAuth()
  const { favorites } = useFavorites()
  const { addToast } = useToast()
  const { products } = useProducts()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tab, setTab] = useState(searchParams.get('tab') || 'profile')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Fetch user's orders when they switch to orders tab
  useEffect(() => {
    if (tab !== 'orders' || !isLoggedIn || !user?.uid) return
    let cancelled = false
    setOrdersLoading(true)
    getUserOrders(user.uid)
      .then(data => { if (!cancelled) setOrders(data) })
      .catch(() => { if (!cancelled) setOrders([]) })
      .finally(() => { if (!cancelled) setOrdersLoading(false) })
    return () => { cancelled = true }
  }, [tab, isLoggedIn, user?.uid])
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)

  // Auth form state
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })

  // Profile edit state
  const [profileForm, setProfileForm] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    const result = await login(authForm.email, authForm.password)
    setAuthLoading(false)
    if (result.success) {
      addToast('Welcome back!', 'success')
    } else {
      addToast(result.error, 'error')
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    const result = await signup(authForm.name, authForm.email, authForm.phone, authForm.password)
    setAuthLoading(false)
    if (result.success) {
      addToast('Account created successfully!', 'success')
    } else {
      addToast(result.error, 'error')
    }
  }

  const handleProfileSave = async () => {
    if (!profileForm) return
    if (!profileForm.name?.trim()) {
      addToast('Name cannot be empty', 'error')
      return
    }
    try {
      await updateUserProfile(profileForm)
      setProfileForm(null)
      addToast('Profile updated!', 'success')
    } catch {
      addToast('Failed to update profile', 'error')
    }
  }

  // Show loading spinner while Firebase checks auth state
  if (loading) {
    return (
      <div className="account-page">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      </div>
    )
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
                  placeholder={authMode === 'signup' ? 'Minimum 6 characters' : 'Enter password'}
                  value={authForm.password}
                  onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={authLoading}>
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
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

  // Get current profile form values (or fall back to user data)
  const pName = profileForm?.name ?? user.name
  const pPhone = profileForm?.phone ?? user.phone

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
              <input
                type="text"
                className="form-input"
                value={pName}
                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={user.email} disabled style={{ opacity: 0.6 }} />
              <span className="form-hint">Email cannot be changed</span>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={pPhone}
                onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleProfileSave}
              disabled={!profileForm}
              style={{ opacity: profileForm ? 1 : 0.5 }}
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-48)' }}>
                <Loader size={28} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : orders.length > 0 ? (
              <div className="orders-list">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="order-history-card"
                    onClick={() => navigate(`/order/${order.id}`)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 'var(--space-24)',
                      marginBottom: 'var(--space-16)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-orange)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-white)' }}>Order #{order.id}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        padding: '3px 10px', borderRadius: 20,
                        background: order.status === 'delivered' ? 'rgba(16,185,129,0.15)' : 'rgba(139,32,32,0.2)',
                        color: order.status === 'delivered' ? '#10B981' : 'var(--color-orange)',
                        textTransform: 'capitalize',
                      }}>
                        {(order.status || 'confirmed').replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-gray-1)', marginBottom: 6 }}>
                      {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-gray-2)' }}>
                        {order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--color-orange)' }}>
                        PKR {(order.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tab-empty">
                <Package size={48} style={{ color: 'var(--color-gray-2)', marginBottom: 16 }} />
                <h3>No orders yet</h3>
                <p>Your order history will appear here after you place an order.</p>
                <Link to="/menu" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                  Browse Menu
                </Link>
              </div>
            )}
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
                  <button
                    className="btn-icon"
                    onClick={async () => {
                      const newText = window.prompt('Edit address:', addr.address)
                      const trimmed = newText?.trim()
                      if (!trimmed || trimmed === addr.address) return
                      try {
                        const updated = (user.addresses || []).map(a =>
                          a.id === addr.id ? { ...a, address: trimmed } : a
                        )
                        await updateUserProfile({ addresses: updated })
                        addToast('Address updated', 'success')
                      } catch {
                        addToast('Failed to update address', 'error')
                      }
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ color: '#EF4444' }}
                    onClick={async () => {
                      try {
                        await removeAddress(addr.id)
                        addToast('Address removed', 'info')
                      } catch {
                        addToast('Failed to remove address', 'error')
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn-secondary"
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
              onClick={async () => {
                const labelRaw = window.prompt('Address label (e.g., Home, Office):')
                const label = labelRaw?.trim()
                if (!label) return
                const addressRaw = window.prompt('Full delivery address:')
                const addressText = addressRaw?.trim()
                if (!addressText) return
                try {
                  await addAddress({ label, address: addressText, isDefault: !(user.addresses?.length > 0) })
                  addToast('Address added', 'success')
                } catch {
                  addToast('Failed to add address', 'error')
                }
              }}
            >
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
              <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} style={{ accentColor: 'var(--color-orange)' }} />
            </div>
            <div className="settings-item">
              <div>
                <div className="settings-item-label">SMS Notifications</div>
                <div className="settings-item-desc">Receive order updates via SMS</div>
              </div>
              <input type="checkbox" checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)} style={{ accentColor: 'var(--color-orange)' }} />
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
              onClick={async () => {
                await logout()
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
