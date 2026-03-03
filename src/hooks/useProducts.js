import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        setProducts(snap.docs.map(d => ({ ...d.data(), id: d.id })))
        setLoading(false)
      },
      (err) => {
        console.error('useProducts subscription error:', err)
        setError(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { products, loading, error }
}
