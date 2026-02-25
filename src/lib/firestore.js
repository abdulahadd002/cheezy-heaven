import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, arrayUnion,
  query, where, onSnapshot, orderBy
} from 'firebase/firestore'
import { db } from './firebase'

// --- Products ---

export async function getProducts() {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getProduct(productId) {
  const snap = await getDoc(doc(db, 'products', String(productId)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// --- Deals ---

export async function getDeals() {
  const snap = await getDocs(collection(db, 'deals'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
  return onSnapshot(
    doc(db, 'orders', orderId),
    (snap) => { callback(snap.exists() ? { id: snap.id, ...snap.data() } : null) },
    (error) => { console.error('subscribeToOrder error:', error) }
  )
}

export async function updateOrderStatus(orderId, newStatus) {
  await updateDoc(doc(db, 'orders', orderId), {
    status: newStatus,
    statusHistory: arrayUnion({ status: newStatus, time: new Date().toISOString() }),
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

// --- Admin: Real-time all orders ---

export function subscribeToAllOrders(callback) {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      orders.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''))
      callback(orders)
    },
    (error) => { console.error('subscribeToAllOrders error:', error) }
  )
}

// --- Admin: Product management ---

export async function updateProduct(productId, updates) {
  await updateDoc(doc(db, 'products', String(productId)), updates)
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', String(productId)))
}

export async function createProduct(productId, data) {
  await setDoc(doc(db, 'products', String(productId)), data)
}

// --- Admin: Deal management ---

export async function updateDeal(dealId, updates) {
  await updateDoc(doc(db, 'deals', String(dealId)), updates)
}

export async function deleteDeal(dealId) {
  await deleteDoc(doc(db, 'deals', String(dealId)))
}

export async function createDeal(dealId, data) {
  await setDoc(doc(db, 'deals', String(dealId)), data)
}
