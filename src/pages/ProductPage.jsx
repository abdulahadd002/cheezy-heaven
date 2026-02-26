import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Heart, ChevronRight, Loader } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import { useProducts } from '../hooks/useProducts'
import './ProductPage.css'

function getStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half)
}

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addToast } = useToast()
  const { products, loading } = useProducts()

  const product = products.find(p => p.id === id)

  const sizeKeys = product ? Object.keys(product.sizes || {}) : []
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedCustomizations, setSelectedCustomizations] = useState([])
  const [qty, setQty] = useState(1)

  // Reset size selection whenever the product changes
  useEffect(() => {
    setSelectedSize(sizeKeys.length > 0 ? sizeKeys[0] : '')
  }, [product?.id])

  if (loading) {
    return (
      <div className="product-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="container">
          <div className="menu-empty">
            <h3>Product not found</h3>
            <p>The product you're looking for doesn't exist.</p>
            <button className="btn-primary" onClick={() => navigate('/menu')}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentPrice = product.sizes?.[selectedSize] || product.price || 0
  const discountedPrice = product.discount
    ? Math.round(currentPrice * (1 - product.discount / 100))
    : currentPrice

  const custPrices = product.customizationPrices || {}
  const customizationsTotal = selectedCustomizations.reduce((sum, c) => sum + (custPrices[c] || 0), 0)
  const totalPrice = discountedPrice + customizationsTotal

  const toggleCustomization = (c) => {
    setSelectedCustomizations(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handleAddToCart = () => {
    addItem(product, selectedSize, totalPrice, selectedCustomizations, qty)
    addToast(`${qty}x ${product.name} added to cart!`, 'success')
  }

  const similar = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const categoryName = product.category.charAt(0).toUpperCase() + product.category.slice(1)

  return (
    <div className="product-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <Link to={`/menu?category=${product.category}`}>{categoryName}</Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="product-detail">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="product-detail-info">
            <h1>{product.name}</h1>

            <div className="product-detail-rating">
              <span className="rating-stars">{getStars(product.rating)}</span>
              <span className="rating-value">{product.rating}</span>
              <span className="rating-count">({product.reviews} reviews)</span>
            </div>

            <p className="product-detail-desc">{product.description}</p>

            <div className="product-detail-dietary">
              {(product.dietary || []).map(d => (
                <span key={d} className="dietary-tag">{d}</span>
              ))}
            </div>

            {/* Size Selection */}
            <div className="product-options">
              <h3>Select Size</h3>
              <div className="size-options">
                {sizeKeys.map(size => (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                    <span className="size-option-price">
                      PKR {product.sizes[size].toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Customizations */}
            {(product.customizations?.length > 0) && (
              <div className="product-options">
                <h3>Customizations</h3>
                <div className="customization-options">
                  {product.customizations.map(c => (
                    <button
                      key={c}
                      className={`customization-tag ${selectedCustomizations.includes(c) ? 'active' : ''}`}
                      onClick={() => toggleCustomization(c)}
                    >
                      {c}{custPrices[c] > 0 && <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 4 }}>+PKR {custPrices[c]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="product-detail-price">
              PKR {totalPrice.toLocaleString()}
              {(product.discount > 0 || customizationsTotal > 0) && (
                <span className="product-detail-price-original">
                  {product.discount > 0 ? `PKR ${(currentPrice + customizationsTotal).toLocaleString()}` : ''}
                </span>
              )}
            </div>

            {/* Add to Cart */}
            <div className="product-add-row">
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="btn-primary btn-lg" onClick={handleAddToCart}>
                <ShoppingCart size={18} />
                Add to Cart - PKR {(totalPrice * qty).toLocaleString()}
              </button>
              <button
                className={`btn-icon ${isFavorite(product.id) ? 'text-orange' : ''}`}
                onClick={() => toggleFavorite(product.id)}
                aria-label="Toggle favorite"
                style={{
                  border: '1px solid var(--color-border)',
                  width: 48, height: 48,
                  color: isFavorite(product.id) ? '#EF4444' : undefined
                }}
              >
                <Heart size={20} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <section className="similar-section">
            <div className="section-header">
              <div>
                <span className="label-text">You might also like</span>
                <h2>Similar Items</h2>
              </div>
            </div>
            <div className="product-grid stagger-children">
              {similar.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
