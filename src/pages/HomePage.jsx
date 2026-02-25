import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pizza, Drumstick, Sandwich, Beef, Soup, UtensilsCrossed, Salad, CupSoda, Grid3X3, Phone, Loader } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { useProducts } from '../hooks/useProducts'
import './HomePage.css'

const CATEGORY_ICONS = { Grid3X3, Pizza, Drumstick, Sandwich, Beef, Soup, UtensilsCrossed, Salad, CupSoda }

const categories = [
  { id: 'pizza', name: 'Pizza', icon: 'Pizza' },
  { id: 'appetizers', name: 'Appetizers', icon: 'Drumstick' },
  { id: 'burgers', name: 'Burgers', icon: 'Sandwich' },
  { id: 'chicken', name: 'Chicken', icon: 'Drumstick' },
  { id: 'pasta', name: 'Pasta', icon: 'Soup' },
  { id: 'platters', name: 'Platters', icon: 'UtensilsCrossed' },
  { id: 'drinks', name: 'Drinks', icon: 'CupSoda' },
]

export default function HomePage() {
  const { products, loading } = useProducts()

  const featured = useMemo(() => products.filter(p => p.isBestseller).slice(0, 8), [products])
  const newArrivals = useMemo(() => products.filter(p => p.isNew).slice(0, 4), [products])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Cheezy
              <span className="text-orange"> Heaven</span>
            </h1>
            <p className="hero-subtitle">
              Where Every Bite A Cheezy Delight! Premium pizzas, burgers, wings & more.
              Free home delivery in Rawalpindi.
            </p>
            <div className="hero-ctas">
              <Link to="/menu" className="btn-primary btn-lg">
                Order Now <ArrowRight size={18} />
              </Link>
              <Link to="/offers" className="btn-secondary btn-lg">
                View Deals
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-number">30+</div>
                <div className="hero-stat-label">Menu Items</div>
              </div>
              <div>
                <div className="hero-stat-number"><Phone size={20} /></div>
                <div className="hero-stat-label">051-5122227</div>
              </div>
              <div>
                <div className="hero-stat-number">Free</div>
                <div className="hero-stat-label">Home Delivery</div>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-glow" />
            <img src="/images/logo.jpeg" alt="Cheezy Heaven Logo" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-sm">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="label-text">Explore</span>
              <h2>Browse Categories</h2>
            </div>
          </div>
          <div className="categories-scroll">
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat.icon]
              return (
                <Link
                  key={cat.id}
                  to={`/menu?category=${cat.id}`}
                  className="category-card"
                >
                  <div className="category-card-icon">
                    <Icon size={24} />
                  </div>
                  <span className="category-card-name">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="label-text">Most Popular</span>
              <h2>Bestsellers</h2>
            </div>
            <Link to="/menu">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="product-grid stagger-children">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="section-sm">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-content">
              <h2>Pizza Mania - All Day!</h2>
              <p>Small Pizza + Reg Drink starting from just PKR 600. Check out all our amazing deals.</p>
              <div className="promo-code">FREE DELIVERY</div>
            </div>
            <Link to="/offers" className="btn-primary btn-lg">
              View Deals
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="label-text">Just Added</span>
                <h2>New Arrivals</h2>
              </div>
              <Link to="/menu">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="product-grid stagger-children">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
