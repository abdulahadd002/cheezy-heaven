import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '96px 24px'
    }}>
      <div style={{ fontSize: '120px', fontWeight: 800, color: 'var(--color-orange)', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-white)', marginTop: '16px' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--color-gray-1)', marginTop: '8px', marginBottom: '32px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/menu" className="btn-secondary">Browse Menu</Link>
      </div>
    </div>
  )
}
