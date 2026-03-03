import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'deals'),
      (snap) => {
        setDeals(snap.docs.map(d => ({ ...d.data(), id: d.id })))
        setLoading(false)
      },
      (err) => {
        console.error('useDeals subscription error:', err)
        setError(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { deals, loading, error }
}
