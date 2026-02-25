import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Loader } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { useProducts } from '../hooks/useProducts'
import './MenuPage.css'

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'pizza', name: 'Pizza' },
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'sandwiches', name: 'Sandwiches' },
  { id: 'chicken', name: 'Chicken' },
  { id: 'pasta', name: 'Pasta' },
  { id: 'platters', name: 'Platters' },
  { id: 'fries', name: 'Fries & Extras' },
  { id: 'drinks', name: 'Drinks' },
]

const DIETARY = ['vegetarian', 'halal']

export default function MenuPage() {
  const { products, loading } = useProducts()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')

  const [sort, setSort] = useState('popular')
  const [dietary, setDietary] = useState([])

  // Keep category in sync when URL param changes (e.g. footer links).
  // Also reset dietary filters so users don't see unexpectedly filtered results.
  useEffect(() => {
    setCategory(searchParams.get('category') || 'all')
    setDietary([])
  }, [searchParams])

  const categoryCounts = useMemo(() => {
    const counts = { all: products.length }
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [products])

  const categoryOrder = useMemo(() => {
    const order = {}
    CATEGORIES.forEach((cat, i) => { order[cat.id] = i })
    return order
  }, [])

  const filtered = useMemo(() => {
    let result = [...products]

    if (category !== 'all') {
      result = result.filter(p => p.category === category)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }

    if (dietary.length > 0) {
      result = result.filter(p =>
        dietary.every(d => p.dietary.includes(d))
      )
    }

    const sortWithin = (a, b) => {
      switch (sort) {
        case 'price-low': return a.price - b.price
        case 'price-high': return b.price - a.price
        case 'rating': return b.rating - a.rating
        case 'popular':
        default: return b.reviews - a.reviews
      }
    }

    if (category === 'all') {
      result.sort((a, b) => {
        const catDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99)
        if (catDiff !== 0) return catDiff
        return sortWithin(a, b)
      })
    } else {
      result.sort(sortWithin)
    }

    return result
  }, [products, category, search, sort, dietary])

  if (loading) {
    return (
      <div className="menu-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  const handleCategoryChange = (cat) => {
    setCategory(cat)
    if (cat !== 'all') {
      setSearchParams({ category: cat })
    } else {
      setSearchParams({})
    }
  }

  const toggleDietary = (d) => {
    setDietary(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  return (
    <div className="menu-page">
      <div className="container">
        <div className="menu-header">
          <h1>Our Menu</h1>
          <p>Explore our full range of delicious offerings</p>
        </div>

        <div className="menu-search-bar">
          <div className="menu-search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search for pizza, wings, drinks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search menu"
            />
          </div>
        </div>

        <div className="menu-sort-buttons">
          {[
            { value: 'popular', label: 'Most Popular' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
          ].map(option => (
            <button
              key={option.value}
              className={`sort-btn ${sort === option.value ? 'active' : ''}`}
              onClick={() => setSort(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="menu-layout">
          <aside className="menu-sidebar">
            <div className="filter-section">
              <h3>Categories</h3>
              <div className="filter-options">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`filter-option ${category === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {cat.name}
                    <span className="filter-option-count">
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h3>Dietary</h3>
              <div className="filter-tags">
                {DIETARY.map(d => (
                  <button
                    key={d}
                    className={`filter-tag ${dietary.includes(d) ? 'active' : ''}`}
                    onClick={() => toggleDietary(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="menu-results-info">
              <p className="menu-results-count">
                Showing <span>{filtered.length}</span> items
              </p>
            </div>

            {filtered.length > 0 ? (
              <div className="product-grid stagger-children">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="menu-empty">
                <h3>No items found</h3>
                <p>Try adjusting your filters or search term</p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('')
                    setCategory('all')
                    setDietary([])
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
