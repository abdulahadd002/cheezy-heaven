import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import products from '../data/products.json'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState('popular')
  const [dietary, setDietary] = useState([])

  const categoryCounts = useMemo(() => {
    const counts = { all: products.length }
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
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

    switch (sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'popular':
      default:
        result.sort((a, b) => b.reviews - a.reviews)
        break
    }

    return result
  }, [category, search, sort, dietary])

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
