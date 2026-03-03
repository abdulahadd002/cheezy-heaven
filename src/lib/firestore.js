import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, arrayUnion,
  query, where, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

// --- Products ---

export async function getProducts() {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getProduct(productId) {
  const snap = await getDoc(doc(db, 'products', String(productId)))
  return snap.exists() ? { ...snap.data(), id: snap.id } : null
}

// --- Deals ---

export async function getDeals() {
  const snap = await getDocs(collection(db, 'deals'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
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
  return snap.exists() ? { ...snap.data(), id: snap.id } : null
}

export function subscribeToOrder(orderId, callback) {
  return onSnapshot(
    doc(db, 'orders', orderId),
    (snap) => { callback(snap.exists() ? { ...snap.data(), id: snap.id } : null) },
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
  const orders = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  // Sort client-side to avoid needing a composite index
  orders.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''))
  return orders
}

// --- Admin: Real-time all orders ---

export function subscribeToAllOrders(callback) {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const orders = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      orders.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''))
      callback(orders)
    },
    (error) => { console.error('subscribeToAllOrders error:', error) }
  )
}

export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, 'orders', String(orderId)))
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

// --- Promo Codes ---

export async function getPromoCode(code) {
  const q = query(
    collection(db, 'promoCodes'),
    where('code', '==', code.toUpperCase())
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const promo = { ...snap.docs[0].data(), id: snap.docs[0].id }
  return promo.active ? promo : null
}

export function subscribeToPromoCodes(callback) {
  return onSnapshot(
    collection(db, 'promoCodes'),
    (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    },
    (error) => console.error('subscribeToPromoCodes error:', error)
  )
}

export async function createPromoCode(data) {
  const id = `promo-${Date.now()}`
  await setDoc(doc(db, 'promoCodes', id), {
    ...data,
    code: data.code.toUpperCase(),
    createdAt: new Date().toISOString(),
  })
}

export async function deletePromoCode(promoId) {
  await deleteDoc(doc(db, 'promoCodes', promoId))
}

// --- Reviews ---

export async function addOrderReview(orderId, review) {
  await updateDoc(doc(db, 'orders', orderId), {
    review: {
      ...review,
      createdAt: new Date().toISOString(),
    }
  })
}
