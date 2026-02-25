import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

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
  const signup = async (name, email, phone, password) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

      // Set display name on Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name })

      // Create Firestore user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name,
        email,
        phone,
        addresses: [],
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return { success: true }
    } catch (error) {
      const message = getAuthErrorMessage(error.code)
      return { success: false, error: message }
    }
  }

  // Sign in with email & password
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      const message = getAuthErrorMessage(error.code)
      return { success: false, error: message }
    }
  }

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth)
    } catch {
      // Auth state listener will handle cleanup
    }
  }

  // Update profile fields in Firestore
  const updateUserProfile = async (updates) => {
    if (!user) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      setUser(prev => ({ ...prev, ...updates }))
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

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      loading,
      login,
      signup,
      logout,
      updateUserProfile,
      addAddress,
      removeAddress
    }}>
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
