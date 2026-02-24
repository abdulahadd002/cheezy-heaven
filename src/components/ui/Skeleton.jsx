import './Skeleton.css'

export function SkeletonCard() {
  return (
    <div className="skeleton skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-card-content">
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text skeleton-text-short" />
        <div className="skeleton skeleton-text-xs" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
