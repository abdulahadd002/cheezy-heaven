import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const STORAGE_KEY = 'cheesy-heaven-auth'

const MOCK_USERS = [
  {
    id: 1,
    name: 'Ali Khan',
    email: 'ali@example.com',
    phone: '+92 300 1234567',
    password: 'password123',
    addresses: [
      { id: 1, label: 'Home', address: '123 Main Street, DHA Phase 5, Karachi', isDefault: true },
      { id: 2, label: 'Office', address: '456 Business Park, Clifton, Karachi', isDefault: false }
    ]
  }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      const { password: _, ...userData } = found
      setUser(userData)
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const signup = (name, email, phone, password) => {
    const exists = MOCK_USERS.find(u => u.email === email)
    if (exists) {
      return { success: false, error: 'Email already registered' }
    }
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      addresses: []
    }
    setUser(newUser)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
  }

  const updateProfile = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const addAddress = (address) => {
    const newAddress = { id: Date.now(), ...address }
    setUser(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), newAddress]
    }))
  }

  const removeAddress = (addressId) => {
    setUser(prev => ({
      ...prev,
      addresses: prev.addresses.filter(a => a.id !== addressId)
    }))
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      login,
      signup,
      logout,
      updateProfile,
      addAddress,
      removeAddress
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
