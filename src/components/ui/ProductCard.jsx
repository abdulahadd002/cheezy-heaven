import { memo, useMemo, useCallback } from 'react'
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

const ProductCard = memo(function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addToast } = useToast()

  const { firstSize, firstPrice, discountedPrice } = useMemo(() => {
    const sizeKeys = Object.keys(product.sizes || {})
    const fs = sizeKeys[0] || ''
    const fp = product.sizes?.[fs] ?? product.price ?? 0
    const dp = product.discount ? Math.round(fp * (1 - product.discount / 100)) : fp
    return { firstSize: fs, firstPrice: fp, discountedPrice: dp }
  }, [product.sizes, product.price, product.discount])

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation()
    addItem(product, firstSize, discountedPrice)
    addToast(`${product.name} added to cart!`, 'success')
  }, [addItem, product, firstSize, discountedPrice, addToast])

  const handleFavorite = useCallback((e) => {
    e.stopPropagation()
    toggleFavorite(product.id)
  }, [toggleFavorite, product.id])

  const fav = isFavorite(product.id)

  return (
    <div className="product-card">
      <div className="product-card-image" onClick={() => navigate(`/product/${product.id}`)}>
        {product.image
          ? <img src={product.image} alt={product.name} loading="lazy" width="400" height="300" />
          : <div style={{ width: '100%', height: '100%', background: '#2A1520', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🍕</div>
        }

        <div className="product-card-badges">
          {product.isNew && <span className="badge badge-new">New</span>}
          {product.isBestseller && <span className="badge badge-bestseller">Best</span>}
          {product.discount > 0 && (
            <span className="badge badge-discount">-{product.discount}%</span>
          )}
        </div>

        <button
          className={`product-card-fav ${fav ? 'active' : ''}`}
          onClick={handleFavorite}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
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
})

export default ProductCard
