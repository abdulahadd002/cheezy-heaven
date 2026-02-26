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

export default function MenuPage() {
  const { products, loading, error } = useProducts()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')

  const [sort, setSort] = useState('popular')

  // Keep category in sync when URL param changes (e.g. footer links).
  useEffect(() => {
    setCategory(searchParams.get('category') || 'all')
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
        p.description?.toLowerCase().includes(q)
      )
    }

    const sortWithin = (a, b) => {
      switch (sort) {
        case 'price-low': return (a.price || 0) - (b.price || 0)
        case 'price-high': return (b.price || 0) - (a.price || 0)
        case 'rating': return (b.rating || 0) - (a.rating || 0)
        case 'popular':
        default: return (b.reviews || 0) - (a.reviews || 0)
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
  }, [products, category, search, sort])

  if (error) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="menu-empty">
            <h3>Failed to load menu</h3>
            <p>Please check your connection and try again.</p>
            <button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

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

        {/* Category pill buttons — always visible, horizontal scroll */}
        <div className="menu-filter-row">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`filter-pill ${category === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
              <span className="filter-pill-count">{categoryCounts[cat.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* Sort pill buttons */}
        <div className="menu-filter-row">
          {[
            { value: 'popular', label: 'Most Popular' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'price-low', label: 'Price ↑' },
            { value: 'price-high', label: 'Price ↓' },
          ].map(option => (
            <button
              key={option.value}
              className={`filter-pill ${sort === option.value ? 'active' : ''}`}
              onClick={() => setSort(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

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
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
