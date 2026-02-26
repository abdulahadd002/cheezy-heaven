import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader } from 'lucide-react'

export default function AdminGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0D0A0E' }}>
        <Loader size={32} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  // TODO: Re-enable guard after testing
  // if (!user || user.role !== 'admin') {
  //   return <Navigate to="/" replace />
  // }

  return children
}
