import { useState, useEffect } from 'react'
import { getDeals } from '../lib/firestore'

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getDeals()
      .then(data => {
        if (!cancelled) {
          setDeals(data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  return { deals, loading, error }
}
