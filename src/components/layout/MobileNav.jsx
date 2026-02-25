import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Heart, User, ShoppingCart } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import './MobileNav.css'

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useCart()

  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Menu', path: '/menu' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: itemCount },
    { icon: Heart, label: 'Saved', path: '/account?tab=favorites' },
    { icon: User, label: 'Account', path: '/account' },
  ]

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav-icons">
        {items.map(item => {
          const [itemPath, itemQuery] = item.path.split('?')
          const isActive = location.pathname === itemPath && (
            itemQuery
              ? location.search === `?${itemQuery}`
              : !items.some(other => {
                  const [op, oq] = other.path.split('?')
                  return other.path !== item.path && op === itemPath && oq && location.search === `?${oq}`
                })
          )
          return (
          <button
            key={item.path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <item.icon size={20} />
            {item.badge > 0 && <span className="cart-badge">{item.badge}</span>}
            <span>{item.label}</span>
          </button>
          )
        })}
      </div>
    </nav>
  )
}
