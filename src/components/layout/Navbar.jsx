import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { itemCount } = useCart()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-text">CHEEZY <span>HEAVEN</span></span>
        </Link>

        <ul className="nav-links">
          <li><NavLink to="/menu">Menu</NavLink></li>
          <li><NavLink to="/offers">Offers</NavLink></li>
          <li><NavLink to="/contact">Contact</NavLink></li>
          <li><NavLink to="/about">About</NavLink></li>
        </ul>

        <div className="nav-right">
          <button
            className="nav-icon-btn"
            aria-label="Search"
            onClick={() => navigate('/menu')}
          >
            <Search size={20} />
          </button>

          <button
            className="nav-icon-btn"
            aria-label={`Shopping cart with ${itemCount} items`}
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

          <button
            className="nav-icon-btn"
            aria-label="Account"
            onClick={() => navigate('/account')}
            style={{ position: 'relative' }}
          >
            {isLoggedIn ? (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--color-orange)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ) : (
              <User size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile pill row — always visible, replaces hamburger dropdown */}
      <div className="mobile-nav-pills">
        <NavLink to="/menu" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Menu</NavLink>
        <NavLink to="/offers" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Offers</NavLink>
        <NavLink to="/contact" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Contact</NavLink>
        <NavLink to="/about" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>About</NavLink>
        <NavLink to="/account" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>My Account</NavLink>
      </div>
    </nav>
  )
}
