import {
  collection, doc, getDoc, getDocs, setDoc, query,
  where, orderBy, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

// --- Products ---

export async function getProducts() {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map(d => d.data())
}

export async function getProduct(productId) {
  const snap = await getDoc(doc(db, 'products', String(productId)))
  return snap.exists() ? snap.data() : null
}

// --- Deals ---

export async function getDeals() {
  const snap = await getDocs(collection(db, 'deals'))
  return snap.docs.map(d => d.data())
}

// --- Orders ---

export async function createOrder(orderId, orderData) {
  await setDoc(doc(db, 'orders', orderId), {
    ...orderData,
    status: 'confirmed',
    statusHistory: [{ status: 'confirmed', time: new Date().toISOString() }],
    placedAt: new Date().toISOString(),
  })
  return orderId
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function subscribeToOrder(orderId, callback) {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function getUserOrders(userId) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  // Sort client-side to avoid needing a composite index
  orders.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''))
  return orders
}
