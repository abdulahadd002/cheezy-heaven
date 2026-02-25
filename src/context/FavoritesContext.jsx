import { createContext, useContext, useState, useEffect } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext()

const STORAGE_KEY = 'cheesy-heaven-favorites'

export function FavoritesProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // When user logs in, load their favorites from Firestore
  // and merge with any guest favorites from localStorage.
  // When user logs out, clear favorites to prevent data leakage.
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setFavorites([])
      return
    }

    async function syncFavorites() {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const firestoreFavs = snap.exists() ? (snap.data().favorites || []) : []

        // Merge local guest favorites with Firestore favorites (no duplicates)
        const localFavs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        const merged = [...new Set([...firestoreFavs, ...localFavs])]

        setFavorites(merged)

        // If there were local favorites to merge, save back to Firestore
        if (localFavs.length > 0 && merged.length !== firestoreFavs.length) {
          await updateDoc(doc(db, 'users', user.uid), { favorites: merged })
        }
        // Clear localStorage since Firestore is now the source of truth
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Firestore unavailable, keep using local favorites
      }
    }

    syncFavorites()
  }, [isLoggedIn, user?.uid])

  // Persist to localStorage for guests only
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    }
  }, [favorites, isLoggedIn])

  const toggleFavorite = async (productId) => {
    const newFavs = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId]

    setFavorites(newFavs)

    // Sync to Firestore if logged in
    if (isLoggedIn && user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { favorites: newFavs })
      } catch {
        // Silent fail — local state is still updated
      }
    }
  }

  const isFavorite = (productId) => favorites.includes(productId)

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
