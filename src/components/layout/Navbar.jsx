import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import './Navbar.css'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobile}>
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
          >
            <User size={20} />
          </button>

          <button
            className={`hamburger-btn ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <NavLink to="/menu" onClick={closeMobile}>Menu</NavLink>
        <NavLink to="/offers" onClick={closeMobile}>Offers</NavLink>
        <NavLink to="/contact" onClick={closeMobile}>Contact</NavLink>
        <NavLink to="/about" onClick={closeMobile}>About</NavLink>
        <NavLink to="/account" onClick={closeMobile}>My Account</NavLink>
      </div>
    </nav>
  )
}
