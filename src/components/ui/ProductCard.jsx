import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useToast } from '../../context/ToastContext'
import './ProductCard.css'

function getStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half)
}

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addToast } = useToast()

  const sizeKeys = Object.keys(product.sizes || {})
  const firstSize = sizeKeys[0] || ''
  const firstPrice = product.sizes?.[firstSize] ?? product.price ?? 0

  const discountedPrice = product.discount
    ? Math.round(firstPrice * (1 - product.discount / 100))
    : firstPrice

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addItem(product, firstSize, discountedPrice)
    addToast(`${product.name} added to cart!`, 'success')
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  return (
    <div className="product-card">
      <div className="product-card-image" onClick={() => navigate(`/product/${product.id}`)}>
        <img src={product.image} alt={product.name} loading="lazy" />

        <div className="product-card-badges">
          {product.isNew && <span className="badge badge-new">New</span>}
          {product.isBestseller && <span className="badge badge-bestseller">Best</span>}
          {product.discount > 0 && (
            <span className="badge badge-discount">-{product.discount}%</span>
          )}
        </div>

        <button
          className={`product-card-fav ${isFavorite(product.id) ? 'active' : ''}`}
          onClick={handleFavorite}
          aria-label={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={18} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="product-card-content">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>

        <div className="product-card-rating">
          <span className="rating-stars">{getStars(product.rating || 0)}</span>
          <span className="rating-count">({product.reviews || 0})</span>
        </div>

        <div className="product-card-footer">
          <div>
            <span className="product-card-price">PKR {discountedPrice.toLocaleString()}</span>
            {product.discount > 0 && (
              <span className="product-card-price-original">
                PKR {firstPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button className="btn-primary btn-sm" onClick={handleAddToCart}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
