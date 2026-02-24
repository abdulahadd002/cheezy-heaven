import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-name">CHEEZY <span>HEAVEN</span></div>
            <p>
              Where Every Bite A Cheezy Delight! Premium pizzas, burgers, and more.
              Free home delivery in Rawalpindi.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <div className="footer-links">
              <Link to="/menu">Menu</Link>
              <Link to="/offers">Offers & Deals</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/account">My Account</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Menu</h4>
            <div className="footer-links">
              <Link to="/menu?category=pizza">Pizza</Link>
              <Link to="/menu?category=appetizers">Appetizers</Link>
              <Link to="/menu?category=burgers">Burgers</Link>
              <Link to="/menu?category=chicken">Chicken</Link>
              <Link to="/menu?category=pasta">Pasta</Link>
              <Link to="/menu?category=drinks">Drinks</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Contact</h4>
            <div className="footer-contact-item">
              <MapPin size={16} />
              <span>Rizwan Plaza Opp, Man O Salwa Sweets, Old Lalazar, Rawalpindi</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={16} />
              <span>051-5122227 / 0349-5479437</span>
            </div>
            <div className="footer-contact-item">
              <Mail size={16} />
              <span>info@cheezyheaven.pk</span>
            </div>
            <div className="footer-contact-item">
              <Clock size={16} />
              <span>11:00 AM - 3:00 AM (Daily)</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Cheezy Heaven. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
