import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { canAttemptAuth, canUpdateProfile } from '../lib/rateLimit'
import { sanitizeText, sanitizeAndLimit, LIMITS } from '../lib/validate'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen for Firebase auth state changes.
  // This fires once on app load (resolving the current session)
  // and again on every login/logout.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch their profile from Firestore
        const profile = await fetchUserProfile(firebaseUser.uid)
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: profile?.name || firebaseUser.displayName || '',
          phone: profile?.phone || '',
          addresses: profile?.addresses || [],
          role: profile?.role || 'customer',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Read user profile from Firestore
  async function fetchUserProfile(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      return snap.exists() ? snap.data() : null
    } catch {
      return null
    }
  }

  // Sign up: creates Firebase Auth account + Firestore profile
  const signup = useCallback(async (name, email, phone, password, homeAddress) => {
    // Rate limit auth attempts
    const rateCheck = canAttemptAuth()
    if (!rateCheck.allowed) {
      const secs = Math.ceil(rateCheck.retryAfterMs / 1000)
      return { success: false, error: `Too many attempts. Please wait ${secs}s.` }
    }

    // Sanitize inputs before sending to Firebase/Firestore
    const cleanName = sanitizeAndLimit(name, LIMITS.name.max)
    const cleanPhone = sanitizeAndLimit(phone, LIMITS.phone.max)
    const cleanAddress = homeAddress ? sanitizeAndLimit(homeAddress, LIMITS.address.max) : ''

    if (!cleanName) return { success: false, error: 'Name is required' }

    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

      // Set display name on Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: cleanName })

      // Build initial addresses array (include home address if provided)
      const addresses = cleanAddress
        ? [{ id: Date.now().toString(), label: 'Home', address: cleanAddress, isDefault: true }]
        : []

      // Create Firestore user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: cleanName,
        email: sanitizeText(email),
        phone: cleanPhone,
        addresses,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return { success: true }
    } catch (error) {
      const message = getAuthErrorMessage(error.code)
      return { success: false, error: message }
    }
  }, [])

  // Sign in with email & password
  const login = useCallback(async (email, password) => {
    // Rate limit auth attempts
    const rateCheck = canAttemptAuth()
    if (!rateCheck.allowed) {
      const secs = Math.ceil(rateCheck.retryAfterMs / 1000)
      return { success: false, error: `Too many attempts. Please wait ${secs}s.` }
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      const message = getAuthErrorMessage(error.code)
      return { success: false, error: message }
    }
  }, [])

  // Sign out
  const logout = useCallback(async () => {
    try {
      await signOut(auth)
    } catch {
      // Auth state listener will handle cleanup
    }
  }, [])

  // Update profile fields in Firestore
  const updateUserProfile = async (updates) => {
    if (!user) return

    // Rate limit profile updates
    const rateCheck = canUpdateProfile()
    if (!rateCheck.allowed) throw new Error('Too many updates. Please wait a moment.')

    // Sanitize string fields — reject unexpected keys
    const allowedKeys = ['name', 'phone', 'addresses']
    const sanitized = {}
    for (const key of Object.keys(updates)) {
      if (!allowedKeys.includes(key)) continue
      if (key === 'name') sanitized.name = sanitizeAndLimit(updates.name, LIMITS.name.max)
      else if (key === 'phone') sanitized.phone = sanitizeAndLimit(updates.phone, LIMITS.phone.max)
      else if (key === 'addresses') sanitized.addresses = updates.addresses
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...sanitized,
        updatedAt: new Date().toISOString(),
      })
      setUser(prev => ({ ...prev, ...sanitized }))
    } catch {
      throw new Error('Failed to update profile')
    }
  }

  // Add a new address to the user's addresses array
  const addAddress = async (address) => {
    if (!user) return
    try {
      const newAddress = { id: Date.now().toString(), ...address }
      const updated = [...(user.addresses || []), newAddress]
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updated,
        updatedAt: new Date().toISOString(),
      })
      setUser(prev => ({ ...prev, addresses: updated }))
    } catch {
      throw new Error('Failed to add address')
    }
  }

  // Remove an address by ID
  const removeAddress = async (addressId) => {
    if (!user) return
    try {
      const updated = (user.addresses || []).filter(a => a.id !== addressId)
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updated,
        updatedAt: new Date().toISOString(),
      })
      setUser(prev => ({ ...prev, addresses: updated }))
    } catch {
      throw new Error('Failed to remove address')
    }
  }

  const value = useMemo(() => ({
    user, isLoggedIn: !!user, loading,
    login, signup, logout, updateUserProfile, addAddress, removeAddress
  }), [user, loading, login, signup, logout, updateUserProfile, addAddress, removeAddress])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Convert Firebase error codes to user-friendly messages
function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later'
    default:
      return 'Something went wrong. Please try again'
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
