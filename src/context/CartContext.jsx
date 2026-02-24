import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const STORAGE_KEY = 'cheesy-heaven-cart'

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find(
        item => item.id === action.payload.id &&
                item.size === action.payload.size &&
                JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)
      )
      if (existing) {
        return state.map(item =>
          item === existing
            ? { ...item, qty: item.qty + (action.payload.qty || 1) }
            : item
        )
      }
      return [...state, { ...action.payload, cartId: Date.now(), qty: action.payload.qty || 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter(item => item.cartId !== action.payload)
    case 'UPDATE_QTY':
      return state.map(item =>
        item.cartId === action.payload.cartId
          ? { ...item, qty: Math.max(1, action.payload.qty) }
          : item
      )
    case 'CLEAR_CART':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, size, sizePrice, customizations = []) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        image: product.image,
        price: sizePrice,
        size,
        customizations
      }
    })
  }

  const removeItem = (cartId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartId })
  }

  const updateQty = (cartId, qty) => {
    dispatch({ type: 'UPDATE_QTY', payload: { cartId, qty } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const deliveryFee = subtotal > 0 ? 200 : 0
  const tax = Math.round(subtotal * 0.16)
  const total = subtotal + deliveryFee + tax

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      itemCount,
      subtotal,
      deliveryFee,
      tax,
      total
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
